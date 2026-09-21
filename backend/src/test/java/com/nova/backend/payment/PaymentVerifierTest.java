package com.nova.backend.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.web.server.ResponseStatusException;

class PaymentVerifierTest {
    static final String RECIPIENT = "Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyr";
    static final String SIGNATURE = "2".repeat(88);
    static final String REFERENCE = "nova:00000000-0000-0000-0000-000000000001";
    static final ObjectMapper JSON = new ObjectMapper();

    static ObjectNode transaction() throws Exception {
        return (ObjectNode) JSON.readTree("""
            {"blockTime":2000000000,"meta":{"err":null,
              "preTokenBalances":[{"accountIndex":1,"mint":"%s","owner":"%s","programId":"%s","uiTokenAmount":{"amount":"100","decimals":6}}],
              "postTokenBalances":[{"accountIndex":1,"mint":"%s","owner":"%s","programId":"%s","uiTokenAmount":{"amount":"1000100","decimals":6}}]},
             "transaction":{"signatures":["%s"],"message":{
              "accountKeys":[{"pubkey":"payer","signer":true},{"pubkey":"recipientATA","signer":false}],
              "instructions":[{"programId":"%s","parsed":{"type":"transferChecked","info":{
                "mint":"%s","authority":"payer","destination":"recipientATA","tokenAmount":{"amount":"1000000","decimals":6}}}},
                {"programId":"MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr","parsed":"%s"}]}}}
            """.formatted(DevnetRpc.MINT, RECIPIENT, DevnetRpc.TOKEN_PROGRAM,
                DevnetRpc.MINT, RECIPIENT, DevnetRpc.TOKEN_PROGRAM, SIGNATURE,
                DevnetRpc.TOKEN_PROGRAM, DevnetRpc.MINT, REFERENCE));
    }

    private void verify(ObjectNode tx) {
        PaymentVerifier.verify(tx, SIGNATURE, RECIPIENT, DevnetRpc.MINT, REFERENCE, "1000000", 1999999900);
    }

    @Test void acceptsMatchingTransfer() throws Exception { verify(transaction()); }

    @ParameterizedTest
    @ValueSource(strings={"mint","owner","programId"})
    void rejectsWrongTokenOrRecipient(String field) throws Exception {
        var tx=transaction();
        ((ObjectNode)tx.at("/meta/postTokenBalances/0")).put(field,"wrong");
        assertThrows(ResponseStatusException.class, () -> verify(tx));
    }

    @ParameterizedTest
    @ValueSource(strings={"999999","1000001","0","18446744073709551615"})
    void rejectsWrongBalanceDelta(String amount) throws Exception {
        var tx=transaction();
        ((ObjectNode)tx.at("/meta/postTokenBalances/0/uiTokenAmount")).put("amount",amount);
        assertThrows(ResponseStatusException.class, () -> verify(tx));
    }

    @Test void rejectsWrongReference() throws Exception {
        var tx=transaction();
        ((ObjectNode)tx.at("/transaction/message/instructions/1")).put("parsed","another-invoice");
        assertThrows(ResponseStatusException.class, () -> verify(tx));
    }
    @Test void rejectsFailedTransaction() throws Exception {
        var tx=transaction(); ((ObjectNode)tx.path("meta")).put("err","failed");
        assertThrows(ResponseStatusException.class, () -> verify(tx));
    }
    @Test void rejectsOldTransaction() throws Exception {
        var tx=transaction(); tx.put("blockTime",1);
        assertThrows(ResponseStatusException.class, () -> verify(tx));
    }
    @Test void requiresSigner() throws Exception {
        var tx=transaction(); ((ObjectNode)tx.at("/transaction/message/accountKeys/0")).put("signer",false);
        assertThrows(ResponseStatusException.class, () -> verify(tx));
    }
    @Test void supportsNewRecipientAccount() throws Exception {
        var tx=transaction(); ((ObjectNode)tx.path("meta")).putArray("preTokenBalances");
        ((ObjectNode)tx.at("/meta/postTokenBalances/0/uiTokenAmount")).put("amount","1000000");
        verify(tx);
    }
}
