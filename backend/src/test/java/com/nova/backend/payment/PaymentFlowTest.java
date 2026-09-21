package com.nova.backend.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="nova.solana.recipient=Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyr")
@AutoConfigureMockMvc
@Transactional
class PaymentFlowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoBean DevnetRpc rpc;

    String create(String key, String amount) throws Exception {
        var result = mvc.perform(post("/api/v1/invoices").header("Idempotency-Key",key)
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of(
                "contractorId","demo", "description","Payment test", "amountMinor",amount,
                "dueDate",java.time.LocalDate.now().plusDays(7).toString()))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(result).path("id").asText();
    }

    String payment() throws Exception {
        String invoice = create(UUID.randomUUID().toString(), "1000000");
        String result = mvc.perform(post("/api/v1/invoices/"+invoice+"/issue").header("Idempotency-Key",UUID.randomUUID().toString()))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String id=json.readTree(result).at("/paymentRequest/id").asText();
        when(rpc.call(eq("getAccountInfo"), anyList())).thenReturn(json.readTree("""
          {"value":{"owner":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","data":{"parsed":{"type":"mint","info":{"decimals":6}}}}}
          """));
        mvc.perform(post("/api/v1/payment-requests/"+id+"/prepare"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("AWAITING_PAYMENT"))
            .andExpect(jsonPath("$.recipient").value(PaymentVerifierTest.RECIPIENT));
        mvc.perform(post("/api/v1/payment-requests/"+id+"/prepare"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.reference").value("nova:"+id));
        return id;
    }

    @Test void confirmsThenFinalizesAndReplaysWithoutAnotherPayment() throws Exception {
        String id=payment();
        ObjectNode tx=PaymentVerifierTest.transaction();
        ((ObjectNode)tx.at("/transaction/message/instructions/1")).put("parsed","nova:"+id);
        tx.put("blockTime",java.time.Instant.now().getEpochSecond());
        when(rpc.call(eq("getSignatureStatuses"), anyList()))
            .thenReturn(json.readTree("{\"value\":[{\"err\":null,\"confirmationStatus\":\"confirmed\"}]}"))
            .thenReturn(json.readTree("{\"value\":[{\"err\":null,\"confirmationStatus\":\"finalized\"}]}"));
        when(rpc.call(eq("getTransaction"), anyList())).thenReturn(tx);
        String body=json.writeValueAsString(java.util.Map.of("signature",PaymentVerifierTest.SIGNATURE));
        mvc.perform(post("/api/v1/payment-requests/"+id+"/verify").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAYMENT_DETECTED"));
        for (int i=0;i<2;i++) mvc.perform(post("/api/v1/payment-requests/"+id+"/verify").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAID_ON_CHAIN"));
        verify(rpc,times(2)).call(eq("getTransaction"),anyList());
    }

    @Test void pendingTransactionDoesNotMarkInvoicePaid() throws Exception {
        String id=payment();
        when(rpc.call(eq("getSignatureStatuses"),anyList())).thenReturn(json.readTree("{\"value\":[null]}"));
        mvc.perform(post("/api/v1/payment-requests/"+id+"/verify").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(java.util.Map.of("signature",PaymentVerifierTest.SIGNATURE))))
            .andExpect(status().isAccepted());
        mvc.perform(get("/api/v1/payment-requests/"+id)).andExpect(jsonPath("$.status").value("AWAITING_PAYMENT"));
        verify(rpc,never()).call(eq("getTransaction"),anyList());
    }

    @Test void sameCreateKeyWithChangedAmountConflicts() throws Exception {
        String key=UUID.randomUUID().toString();
        create(key,"1000000");
        mvc.perform(post("/api/v1/invoices").header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(java.util.Map.of("contractorId","demo","description","Payment test",
                "amountMinor","2000000","dueDate",java.time.LocalDate.now().plusDays(7).toString()))))
            .andExpect(status().isConflict());
    }
}
