package com.nova.backend.wallet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nova.backend.TestRecipients;
import com.nova.backend.mobile.MobileController;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {
    "nova.solana.recipient=BucXFPoNNN7NL9Kv7ocXvsxw1BxRn5U5r7ky5MFqmdSA",
    "nova.demo.api-key=test-demo-key"
})
@AutoConfigureMockMvc
@Transactional
@ExtendWith(OutputCaptureExtension.class)
class MobilePayoutWalletControllerTest {
    private static final String DEMO_KEY = "test-demo-key";
    private static final String TOKEN_A = "a".repeat(43);
    private static final String TOKEN_B = "b".repeat(43);
    private static final String CONTRACTOR_B = "contractor-wallet-b";
    private static final String WALLET_A = "3fgEzVyVySaGd7N1QCbwhiPPyoFUwjSsVfnPCARsHjQ4";
    private static final String WALLET_B = "HcPgN1L8NC1TQq2TboHPi2GX763FGSE3r3zDiiNLCgqY";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;

    @BeforeEach
    void sessions() {
        jdbc.update("insert into talent_profiles(contractor_id,display_name,headline) values(?,'Contractor B','Designer')", CONTRACTOR_B);
        session(TestRecipients.CONTRACTOR, TOKEN_A);
        session(CONTRACTOR_B, TOKEN_B);
    }

    private void session(String contractorId, String token) {
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()+interval '1 hour')",
            MobileController.hashToken(token), TestRecipients.ORG, contractorId);
    }

    private ResultActions save(String token, Map<String, Object> body) throws Exception {
        return mvc.perform(put("/api/v1/mobile/wallet/receive").header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }

    private ResultActions save(String token, String address) throws Exception {
        return save(token, Map.of("walletAddress", address, "network", "solana:devnet", "confirmPublicAddress", true));
    }

    private int activeRows(String contractorId) {
        return jdbc.queryForObject("select count(*) from contractor_payout_wallets where contractor_id=? and deactivated_at is null",
            Integer.class, contractorId);
    }

    @Test
    void savesReadsReplacesAndRemovesTheSignedInContractorsWallet() throws Exception {
        mvc.perform(get("/api/v1/mobile/wallet/receive").header("Authorization", "Bearer " + TOKEN_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("NOT_CONFIGURED"))
            .andExpect(jsonPath("$.walletAddress").doesNotExist());

        save(TOKEN_A, "  " + WALLET_A + "\n").andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CONFIGURED"))
            .andExpect(jsonPath("$.walletAddress").value(WALLET_A))
            .andExpect(jsonPath("$.network").value("solana:devnet"))
            .andExpect(jsonPath("$.tokenSymbol").value("USDC"))
            .andExpect(jsonPath("$.tokenMint").value(com.nova.backend.payment.DevnetRpc.MINT))
            .andExpect(jsonPath("$.ownershipVerified").value(false));
        // Saving the same address again is a no-op, not another history row.
        save(TOKEN_A, WALLET_A).andExpect(status().isOk());
        assertEquals(1, jdbc.queryForObject("select count(*) from contractor_payout_wallets where contractor_id=?", Integer.class, TestRecipients.CONTRACTOR));

        save(TOKEN_A, WALLET_B).andExpect(status().isOk()).andExpect(jsonPath("$.walletAddress").value(WALLET_B));
        assertEquals(1, activeRows(TestRecipients.CONTRACTOR));
        mvc.perform(get("/api/v1/mobile/wallet/receive").header("Authorization", "Bearer " + TOKEN_A))
            .andExpect(jsonPath("$.walletAddress").value(WALLET_B));

        mvc.perform(delete("/api/v1/mobile/wallet/receive").header("Authorization", "Bearer " + TOKEN_A))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("NOT_CONFIGURED"));
        assertEquals(0, activeRows(TestRecipients.CONTRACTOR));
        // Removal keeps the history of addresses used.
        assertEquals(2, jdbc.queryForObject("select count(*) from contractor_payout_wallets where contractor_id=?", Integer.class, TestRecipients.CONTRACTOR));
    }

    @Test
    void rejectsInvalidAddressesWrongNetworksAndUnconfirmedSaves() throws Exception {
        for (String bad : new String[] {"Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dy0", "not-a-wallet", "",
                "https://explorer.solana.com/address/" + WALLET_A, "1111111111111111111111111111111"}) {
            save(TOKEN_A, bad).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_WALLET_ADDRESS"));
        }
        // A USDC token account (PDA) is Base58 but not a wallet a person can hold.
        save(TOKEN_A, "EN7aZiLodQAvZYrRR3eRdNacJreFv8BiwgnDyNSBimud")
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("NOT_A_WALLET_ADDRESS"));
        // The server's demo wallet and the USDC mint are not a contractor's wallet.
        save(TOKEN_A, "BucXFPoNNN7NL9Kv7ocXvsxw1BxRn5U5r7ky5MFqmdSA").andExpect(jsonPath("$.code").value("RESERVED_ADDRESS"));
        save(TOKEN_A, com.nova.backend.payment.DevnetRpc.MINT).andExpect(jsonPath("$.code").value("RESERVED_ADDRESS"));

        for (String network : new String[] {"solana:mainnet", "solana:testnet", "devnet", "ethereum"}) {
            save(TOKEN_A, Map.of("walletAddress", WALLET_A, "network", network, "confirmPublicAddress", true))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("UNSUPPORTED_NETWORK"));
        }
        save(TOKEN_A, Map.of("walletAddress", WALLET_A, "network", "solana:devnet"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("CONFIRMATION_REQUIRED"));
        assertEquals(0, activeRows(TestRecipients.CONTRACTOR));
    }

    @Test
    void neverStoresEchoesOrLogsSecrets(CapturedOutput output) throws Exception {
        byte[] secret = new byte[64];
        new SecureRandom().nextBytes(secret);
        String secretKey = SolanaAddress.encode(secret);
        String keypairJson = "[12,34,56,78,90,11,22,33,44,55,66,77,88,99,10,20,30,40,50,60,70,80,90,100]";
        String seedPhrase = "abandon ability able about above absent absorb abstract absurd abuse access accident";
        for (String value : new String[] {secretKey, keypairJson, seedPhrase}) {
            String body = save(TOKEN_A, value).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SECRET_REJECTED"))
                .andReturn().getResponse().getContentAsString();
            assertFalse(body.contains(value), body);
            assertFalse(output.getAll().contains(value), "secret must not be logged");
        }
        save(TOKEN_A, WALLET_A).andExpect(status().isOk());
        assertFalse(output.getAll().contains(secretKey));
        String stored = String.join(",", jdbc.queryForList("select row_to_json(w)::text from contractor_payout_wallets w", String.class));
        assertFalse(stored.contains(secretKey) || stored.contains("abandon ability"), stored);
        String response = mvc.perform(get("/api/v1/mobile/wallet/receive").header("Authorization", "Bearer " + TOKEN_A))
            .andReturn().getResponse().getContentAsString().toLowerCase();
        assertFalse(response.contains("secret") || response.contains("private") || response.contains("seed"), response);
    }

    @Test
    void aContractorCanOnlyChangeTheirOwnWallet() throws Exception {
        TestRecipients.payoutWallet(jdbc, CONTRACTOR_B, WALLET_B);
        // A forged contractorId in the body is ignored; the session decides whose wallet changes.
        Map<String, Object> forged = new HashMap<>(Map.of("walletAddress", WALLET_A, "network", "solana:devnet", "confirmPublicAddress", true));
        forged.put("contractorId", CONTRACTOR_B);
        save(TOKEN_A, forged).andExpect(status().isOk());
        mvc.perform(delete("/api/v1/mobile/wallet/receive").header("Authorization", "Bearer " + TOKEN_A)).andExpect(status().isOk());

        mvc.perform(get("/api/v1/mobile/wallet/receive").header("Authorization", "Bearer " + TOKEN_B))
            .andExpect(jsonPath("$.status").value("CONFIGURED"))
            .andExpect(jsonPath("$.walletAddress").value(WALLET_B));
        assertEquals(1, activeRows(CONTRACTOR_B));

        mvc.perform(get("/api/v1/mobile/wallet/receive")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/mobile/wallet/receive").header("Authorization", "Bearer " + "z".repeat(43))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("walletAddress", WALLET_A, "network", "solana:devnet", "confirmPublicAddress", true))))
            .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/mobile/wallet/receive")).andExpect(status().isUnauthorized());
    }

    @Test
    void businessSeesWalletsOnlyForItsAcceptedCandidates() throws Exception {
        UUID otherOrg = UUID.randomUUID();
        jdbc.update("insert into organizations(id,legal_name,trading_name,handle) values(?,'Other Co','Other','other-" + otherOrg + "')", otherOrg);
        String[] people = {"contractor-accepted-ready", "contractor-accepted-none", "contractor-accepted-invalid",
            "contractor-submitted", "contractor-rejected", "contractor-withdrawn", "contractor-other-org"};
        for (String person : people) {
            jdbc.update("insert into talent_profiles(contractor_id,display_name,headline) values(?,?,'Dev')", person, person);
        }
        TestRecipients.application(jdbc, TestRecipients.ORG, "contractor-accepted-ready", "accepted");
        TestRecipients.application(jdbc, TestRecipients.ORG, "contractor-accepted-none", "accepted");
        TestRecipients.application(jdbc, TestRecipients.ORG, "contractor-accepted-invalid", "accepted");
        TestRecipients.application(jdbc, TestRecipients.ORG, "contractor-submitted", "submitted");
        TestRecipients.application(jdbc, TestRecipients.ORG, "contractor-rejected", "rejected");
        TestRecipients.application(jdbc, TestRecipients.ORG, "contractor-withdrawn", "withdrawn");
        TestRecipients.application(jdbc, otherOrg, "contractor-other-org", "accepted");
        for (String person : new String[] {"contractor-accepted-ready", "contractor-submitted", "contractor-rejected",
                "contractor-withdrawn", "contractor-other-org"}) {
            TestRecipients.payoutWallet(jdbc, person, WALLET_A);
        }
        // Legacy or tampered data that is not a wallet address.
        TestRecipients.payoutWallet(jdbc, "contractor-accepted-invalid", "EN7aZiLodQAvZYrRR3eRdNacJreFv8BiwgnDyNSBimud");

        String body = mvc.perform(get("/api/v1/business/recipients").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.contractorId=='contractor-accepted-ready')].payoutReadiness").value("READY"))
            .andExpect(jsonPath("$[?(@.contractorId=='contractor-accepted-ready')].walletAddress").value(WALLET_A))
            .andExpect(jsonPath("$[?(@.contractorId=='contractor-accepted-ready')].walletNetwork").value("solana:devnet"))
            .andExpect(jsonPath("$[?(@.contractorId=='contractor-accepted-none')].payoutReadiness").value("NOT_CONFIGURED"))
            .andExpect(jsonPath("$[?(@.contractorId=='contractor-accepted-invalid')].payoutReadiness").value("INVALID"))
            .andReturn().getResponse().getContentAsString();
        for (String hidden : new String[] {"contractor-submitted", "contractor-rejected", "contractor-withdrawn", "contractor-other-org"}) {
            assertFalse(body.contains(hidden), hidden);
        }
        // Neither the invalid stored value nor a missing wallet is shown as an address.
        assertFalse(body.contains("EN7aZiLodQAvZYrRR3eRdNacJreFv8BiwgnDyNSBimud"), body);
        var rows = json.readTree(body);
        for (var row : rows) {
            if (!"READY".equals(row.path("payoutReadiness").asText())) assertEquals(true, row.path("walletAddress").isNull(), row.toString());
        }
        mvc.perform(get("/api/v1/business/recipients")).andExpect(status().isUnauthorized());
    }
}
