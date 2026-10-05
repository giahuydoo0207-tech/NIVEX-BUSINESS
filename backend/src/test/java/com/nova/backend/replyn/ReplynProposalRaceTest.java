package com.nova.backend.replyn;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nova.backend.TestRecipients;
import com.nova.backend.replyn.ReplynProposalService.ProposalInput;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/** Not @Transactional: each call commits on its own connection so the row locks really race. */
@SpringBootTest(properties = {ReplynProposalControllerTest.DEMO_KEY_PROPERTY, ReplynPairingControllerTest.CLIENT_SECRET_PROPERTY})
@AutoConfigureMockMvc
class ReplynProposalRaceTest {
    @Autowired ReplynProposalService proposals;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;
    private UUID thread;

    @BeforeEach
    void conversation() {
        thread = UUID.randomUUID();
        jdbc.update("insert into message_threads(id,organization_id,contractor_id,request_status,accepted_at) values(?,?,?,'ACCEPTED',now())",
            thread, TestRecipients.ORG, TestRecipients.CONTRACTOR);
    }

    @AfterEach
    void cleanUp() {
        jdbc.update("delete from notifications where data->>'threadId'=?", thread.toString());
        jdbc.update("delete from replyn_proposals where thread_id=?", thread);
        jdbc.update("delete from message_threads where id=?", thread);
    }

    @Test
    void concurrentAcceptsAllocateExactlyOneWorkspace() throws Exception {
        UUID id = proposals.create(thread, TestRecipients.ORG, input(), true).id();
        List<String> outcomes = race(
            () -> outcome(() -> proposals.accept(thread, id, TestRecipients.CONTRACTOR)),
            () -> outcome(() -> proposals.accept(thread, id, TestRecipients.CONTRACTOR)));
        assertThat(outcomes).containsExactlyInAnyOrder("ACCEPTED", "PROPOSAL_ACCEPTED");
        assertThat(jdbc.queryForObject("select count(*) from replyn_proposals where thread_id=? and workspace_id is not null", Integer.class, thread)).isEqualTo(1);
    }

    @Test
    void acceptAndRejectAtTheSameTimeApplyOnlyOne() throws Exception {
        UUID id = proposals.create(thread, TestRecipients.ORG, input(), true).id();
        List<String> outcomes = race(
            () -> outcome(() -> proposals.accept(thread, id, TestRecipients.CONTRACTOR)),
            () -> outcome(() -> proposals.reject(thread, id, TestRecipients.CONTRACTOR, null)));
        assertThat(outcomes).hasSize(2).anyMatch(o -> o.equals("ACCEPTED") || o.equals("REJECTED"))
            .anyMatch(o -> o.startsWith("PROPOSAL_"));
    }

    @Test
    void concurrentSendsCreateOneProposal() throws Exception {
        List<String> outcomes = race(
            () -> outcome(() -> proposals.create(thread, TestRecipients.ORG, input(), true)),
            () -> outcome(() -> proposals.create(thread, TestRecipients.ORG, input(), true)));
        assertThat(outcomes).containsExactlyInAnyOrder("PENDING", "PROPOSAL_EXISTS");
    }

    private ProposalInput input() throws Exception {
        return json.convertValue(ReplynProposalControllerTest.proposal(), ProposalInput.class);
    }

    private static String outcome(Callable<ReplynProposal> call) throws Exception {
        try {
            return call.call().status();
        } catch (ReplynProposalException refused) {
            return refused.code();
        }
    }

    private static List<String> race(Callable<String> first, Callable<String> second) throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<String>> futures = new ArrayList<>();
            for (Callable<String> task : List.of(first, second)) {
                futures.add(pool.submit(() -> { start.await(); return task.call(); }));
            }
            start.countDown();
            List<String> outcomes = new ArrayList<>();
            for (Future<String> future : futures) outcomes.add(future.get());
            return outcomes;
        } finally {
            pool.shutdownNow();
        }
    }
}
