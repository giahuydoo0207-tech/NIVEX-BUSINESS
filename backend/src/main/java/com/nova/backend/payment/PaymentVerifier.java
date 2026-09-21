package com.nova.backend.payment;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigInteger;
import java.util.HashSet;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Verify chain evidence, never a client-supplied amount or success flag. */
public final class PaymentVerifier {
    private static final Set<String> MEMO_PROGRAMS = Set.of(
        "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        "Memo4c2pN8afCj432Lb7RMVKi9PbQnnW7ewFFaV3oAH");

    private PaymentVerifier() {}

    public static void verify(JsonNode tx, String signature, String recipient, String mint,
                              String reference, String amount, long createdAt) {
        require(tx != null && tx.isObject(), "Transaction unavailable");
        JsonNode meta = tx.path("meta");
        require(meta.isObject() && meta.has("err") && meta.get("err").isNull(), "Transaction failed");
        require(tx.path("blockTime").canConvertToLong() && tx.path("blockTime").asLong() >= createdAt - 5,
            "Transaction predates request");
        require(signature.equals(tx.at("/transaction/signatures/0").asText()), "Signature mismatch");
        var message = tx.at("/transaction/message");
        Set<String> signers = new HashSet<>();
        for (var key : message.path("accountKeys")) {
            if (key.path("signer").asBoolean()) signers.add(key.path("pubkey").asText());
        }
        boolean memo = false;
        for (var ix : message.path("instructions")) {
            if (MEMO_PROGRAMS.contains(ix.path("programId").asText())
                    && reference.equals(ix.path("parsed").asText())) memo = true;
        }
        require(memo, "Invoice reference missing");
        BigInteger expected = new BigInteger(amount);
        boolean transfer = false;
        for (var ix : message.path("instructions")) {
            var info = ix.at("/parsed/info");
            if (!DevnetRpc.TOKEN_PROGRAM.equals(ix.path("programId").asText())
                    || !"transferChecked".equals(ix.at("/parsed/type").asText())) continue;
            if (!mint.equals(info.path("mint").asText())
                    || !signers.contains(info.path("authority").asText())
                    || info.at("/tokenAmount/decimals").asInt(-1) != 6
                    || !amount.equals(info.at("/tokenAmount/amount").asText())) continue;
            String destination = info.path("destination").asText();
            int index = -1;
            for (int i = 0; i < message.path("accountKeys").size(); i++) {
                if (destination.equals(message.path("accountKeys").get(i).path("pubkey").asText())) index = i;
            }
            for (var post : meta.path("postTokenBalances")) {
                if (index < 0 || post.path("accountIndex").asInt(-2) != index
                        || !recipient.equals(post.path("owner").asText())
                        || !mint.equals(post.path("mint").asText())
                        || !DevnetRpc.TOKEN_PROGRAM.equals(post.path("programId").asText())
                        || post.at("/uiTokenAmount/decimals").asInt(-1) != 6) continue;
                BigInteger before = BigInteger.ZERO;
                for (var pre : meta.path("preTokenBalances")) {
                    if (pre.path("accountIndex").asInt(-2) == index) {
                        require(recipient.equals(pre.path("owner").asText()) && mint.equals(pre.path("mint").asText())
                            && DevnetRpc.TOKEN_PROGRAM.equals(pre.path("programId").asText()), "Token account changed");
                        before = integer(pre.at("/uiTokenAmount/amount"));
                    }
                }
                if (integer(post.at("/uiTokenAmount/amount")).subtract(before).equals(expected)) transfer = true;
            }
        }
        require(transfer, "Expected USDC transfer and recipient balance increase not found");
    }

    private static BigInteger integer(JsonNode node) {
        require(node.isTextual() && node.asText().matches("[0-9]{1,20}"), "Invalid token amount");
        return new BigInteger(node.asText());
    }

    private static void require(boolean valid, String reason) {
        if (!valid) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, reason);
    }
}
