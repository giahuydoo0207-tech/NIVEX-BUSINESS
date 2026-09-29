package com.nova.backend;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

/** Creates an accepted application so the contractor may be invoiced. */
public final class TestRecipients {
    public static final UUID ORG = UUID.fromString("00000000-0000-0000-0000-000000000001");
    public static final String CONTRACTOR = "contractor-minh-anh";

    private TestRecipients() {}

    public static UUID acceptedApplication(JdbcTemplate jdbc, String status) {
        UUID jobId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        jdbc.update("insert into jobs(id,organization_id,title,category,summary,budget_min_minor,budget_max_minor,location_scope,application_deadline,status) "
            + "values(?,?,'Invoice test job','Engineering','Summary',100,200,'Remote',current_date+7,'PUBLISHED')", jobId, ORG);
        jdbc.update("insert into job_applications(id,job_id,organization_id,contractor_id,cover_note,profile_snapshot,status) values(?,?,?,?,'note','{}'::jsonb,?)",
            applicationId, jobId, ORG, CONTRACTOR, status);
        return applicationId;
    }
}
