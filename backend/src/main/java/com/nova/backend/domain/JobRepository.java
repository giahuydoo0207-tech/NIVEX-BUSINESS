package com.nova.backend.domain;

import com.nova.backend.api.JobController.CreateJobRequest;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JobRepository {
    private final JdbcTemplate jdbc;

    public JobRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Job> findPublished() {
        return jdbc.query(
            "select id, organization_id, title, category, summary, budget_min_minor, budget_max_minor, currency, location_scope, application_deadline, status, created_at from jobs where status = 'PUBLISHED' order by created_at desc",
            this::map
        );
    }

    public Job create(CreateJobRequest request) {
        UUID organizationId = request.organizationId() == null
            ? UUID.fromString("00000000-0000-0000-0000-000000000001")
            : request.organizationId();
        UUID id = UUID.randomUUID();
        LocalDate applicationDeadline = LocalDate.parse(request.applicationDeadline());
        jdbc.update(
            "insert into jobs (id, organization_id, title, category, summary, budget_min_minor, budget_max_minor, currency, location_scope, application_deadline, status) values (?, ?, ?, ?, ?, ?, ?, 'USDC', ?, ?, 'DRAFT')",
            id, organizationId, request.title(), request.category(), request.summary(),
            request.budgetMinMinor(), request.budgetMaxMinor(), request.locationScope(),
            applicationDeadline
        );
        return jdbc.queryForObject(
            "select id, organization_id, title, category, summary, budget_min_minor, budget_max_minor, currency, location_scope, application_deadline, status, created_at from jobs where id = ?",
            this::map,
            id
        );
    }

    private Job map(ResultSet rs, int row) throws SQLException {
        return new Job(
            rs.getObject("id", UUID.class),
            rs.getObject("organization_id", UUID.class),
            rs.getString("title"),
            rs.getString("category"),
            rs.getString("summary"),
            rs.getLong("budget_min_minor"),
            rs.getLong("budget_max_minor"),
            rs.getString("currency"),
            rs.getString("location_scope"),
            rs.getDate("application_deadline").toLocalDate(),
            rs.getString("status"),
            rs.getTimestamp("created_at").toInstant()
        );
    }
}
