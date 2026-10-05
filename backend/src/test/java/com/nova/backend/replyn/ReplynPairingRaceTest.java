package com.nova.backend.replyn;

import static org.assertj.core.api.Assertions.assertThat;

import com.nova.backend.TestRecipients;
import com.nova.backend.replyn.ReplynPairingService.Outcome;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/** Not @Transactional: each call must commit on its own connection for the row locks to race. */
@SpringBootTest(properties = ReplynPairingControllerTest.CLIENT_SECRET_PROPERTY)
@AutoConfigureMockMvc
class ReplynPairingRaceTest {
    private static final String OTHER_CONTRACTOR = "contractor-replyn-race";

    @Autowired ReplynPairingService pairings;
    @Autowired JdbcTemplate jdbc;
    private final List<UUID> created = new ArrayList<>();

    @AfterEach
    void cleanUp() {
        created.forEach(id -> jdbc.update("delete from replyn_pairings where id=?", id));
        jdbc.update("delete from talent_profiles where contractor_id=?", OTHER_CONTRACTOR);
    }

    @Test
    void concurrentApprovalsBindExactlyOneTalent() throws Exception {
        jdbc.update("insert into talent_profiles(contractor_id,display_name,headline) values(?,'Race Talent','Designer')", OTHER_CONTRACTOR);
        var pairing = create();
        List<Outcome> outcomes = race(
            () -> pairings.approve(pairing.pairingId(), pairing.qrSecret(), TestRecipients.CONTRACTOR),
            () -> pairings.approve(pairing.pairingId(), pairing.qrSecret(), OTHER_CONTRACTOR));
        assertThat(outcomes).containsExactlyInAnyOrder(Outcome.APPROVED, Outcome.ALREADY_USED);
        String winner = outcomes.get(0) == Outcome.APPROVED ? TestRecipients.CONTRACTOR : OTHER_CONTRACTOR;
        assertThat(jdbc.queryForObject("select contractor_id from replyn_pairings where id=?", String.class, pairing.pairingId())).isEqualTo(winner);
    }

    @Test
    void concurrentConsumersReceiveTheIdentityOnce() throws Exception {
        var pairing = create();
        assertThat(pairings.approve(pairing.pairingId(), pairing.qrSecret(), TestRecipients.CONTRACTOR)).isEqualTo(Outcome.APPROVED);
        List<Outcome> outcomes = race(
            () -> pairings.consume(pairing.pairingId(), pairing.browserSecret()).outcome(),
            () -> pairings.consume(pairing.pairingId(), pairing.browserSecret()).outcome());
        assertThat(outcomes).containsExactlyInAnyOrder(Outcome.CONSUMED, Outcome.ALREADY_USED);
    }

    private ReplynPairingService.CreatedPairing create() {
        var pairing = pairings.create();
        created.add(pairing.pairingId());
        return pairing;
    }

    private static List<Outcome> race(Callable<Outcome> first, Callable<Outcome> second) throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Outcome>> futures = new ArrayList<>();
            for (Callable<Outcome> task : List.of(first, second)) {
                futures.add(pool.submit(() -> { start.await(); return task.call(); }));
            }
            start.countDown();
            List<Outcome> outcomes = new ArrayList<>();
            for (Future<Outcome> future : futures) outcomes.add(future.get());
            return outcomes;
        } finally {
            pool.shutdownNow();
        }
    }
}
