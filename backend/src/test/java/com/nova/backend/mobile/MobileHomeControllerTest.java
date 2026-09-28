package com.nova.backend.mobile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MobileHomeControllerTest {
    private static final UUID ORG = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String TOKEN = "h".repeat(43);

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @Test
    void returnsSessionScopedHomeSummaryWithNoStoreCaching() throws Exception {
        session("alice-home");
        talent("alice-home", "Alice Home");
        talent("bob-home", "Bob Home");
        notification("alice-home", false);
        notification("alice-home", true);
        notification("bob-home", false);
        finalizedIncome("alice-home", 123456);
        publishedHighlight();

        mvc.perform(get("/api/v1/mobile/home")
                .param("contractorId", "bob-home")
                .header("Authorization", "Bearer " + TOKEN))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.profile.displayName").value("Alice Home"))
            .andExpect(jsonPath("$.finalizedIncomeMinor").value("123456"))
            .andExpect(jsonPath("$.finalizedIncomeLast7DaysMinor").value("123456"))
            .andExpect(jsonPath("$.activeApplicationCount").value(0))
            .andExpect(jsonPath("$.completedProjectCount").value(0))
            .andExpect(jsonPath("$.unreadNotificationCount").value(1))
            .andExpect(jsonPath("$.communityHighlight.authorName").value("Home Author"))
            .andExpect(jsonPath("$.communityHighlight.reactionCount").value(2));
    }

    @Test
    void rejectsMissingMobileSession() throws Exception {
        mvc.perform(get("/api/v1/mobile/home"))
            .andExpect(status().isUnauthorized());
    }

    private void session(String contractorId) {
        jdbc.update(
            "insert into mobile_sessions(token_hash, organization_id, contractor_id, expires_at) values (?, ?, ?, now() + interval '1 hour')",
            MobileSessionAuthenticator.hashToken(TOKEN), ORG, contractorId
        );
    }

    private void talent(String contractorId, String displayName) {
        jdbc.update(
            "insert into talent_profiles(contractor_id, display_name, headline) values (?, ?, 'Developer')",
            contractorId,
            displayName
        );
    }

    private void notification(String contractorId, boolean read) {
        jdbc.update(
            "insert into notifications(id, recipient_type, contractor_id, type, title, body, read_at) values (?, 'TALENT', ?, 'HOME', 'Title', 'Body', ?)",
            UUID.randomUUID(),
            contractorId,
            read ? java.sql.Timestamp.from(java.time.Instant.now()) : null
        );
    }

    private void finalizedIncome(String contractorId, long amountMinor) {
        UUID invoice = UUID.randomUUID();
        UUID payment = UUID.randomUUID();
        jdbc.update(
            "insert into invoices(id, organization_id, contractor_id, invoice_number, description, amount_minor, due_date, status, idempotency_key) values (?, ?, ?, ?, 'Home income', ?, current_date, 'PAID_ON_CHAIN', ?)",
            invoice, ORG, contractorId, "home-" + invoice, amountMinor, "home-" + invoice
        );
        jdbc.update("insert into payment_requests(id, invoice_id) values (?, ?)", payment, invoice);
        jdbc.update(
            "insert into payment_ledger_entries(payment_request_id, commitment, signature, recipient, mint, amount_minor, reference) values (?, 'finalized', ?, 'recipient', 'mint', ?, ?)",
            payment, "signature-" + payment, amountMinor, "home:" + payment
        );
    }

    private void publishedHighlight() {
        String author = "home-author-" + UUID.randomUUID();
        String reactorOne = "home-reactor-" + UUID.randomUUID();
        String reactorTwo = "home-reactor-" + UUID.randomUUID();
        UUID post = UUID.randomUUID();
        communityProfile(author, "Home Author", "author-" + author);
        communityProfile(reactorOne, "Reactor One", "reactor-" + reactorOne);
        communityProfile(reactorTwo, "Reactor Two", "reactor-" + reactorTwo);
        jdbc.update(
            "insert into community_posts(id, author_id, content, privacy) values (?, ?, 'Bài viết cộng đồng nổi bật', 'PUBLIC')",
            post, author
        );
        jdbc.update(
            "insert into community_post_reactions(post_id, actor_id, reaction_type) values (?, ?, 'LIKE'), (?, ?, 'LOVE')",
            post, reactorOne, post, reactorTwo
        );
    }

    private void communityProfile(String id, String name, String handle) {
        jdbc.update(
            "insert into community_profiles(id, kind, display_name, handle, headline) values (?, 'FREELANCER', ?, ?, 'Builder')",
            id, name, handle
        );
    }
}
