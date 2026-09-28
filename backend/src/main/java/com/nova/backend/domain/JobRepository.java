package com.nova.backend.domain;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nova.backend.api.JobController.CreateJobRequest;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Repository
public class JobRepository {
    public static final UUID DEFAULT_ORGANIZATION = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final Map<String, List<String>> STATUS_TRANSITIONS = Map.of(
        "DRAFT", List.of("PUBLISHED", "CLOSED"),
        "PUBLISHED", List.of("PAUSED", "CLOSED"),
        "PAUSED", List.of("PUBLISHED", "CLOSED"),
        "CLOSED", List.of()
    );
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public JobRepository(JdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    /** Jobs that talent can see and apply to. */
    public List<Job> findPublished() {
        return jdbc.query(select() + " where j.status = 'PUBLISHED' and j.application_deadline >= current_date " +
            "order by coalesce(j.published_at, j.created_at) desc, j.id desc", this::map);
    }

    /** Every job owned by the organization, including drafts, for the business workspace. */
    public List<Job> forOrganization(UUID organizationId) {
        return jdbc.query(select() + " where j.organization_id = ? order by j.created_at desc, j.id desc", this::map, organizationId);
    }

    public Job find(UUID id) {
        return jdbc.query(select() + " where j.id = ?", this::map, id).stream().findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
    }

    @Transactional
    public Job create(CreateJobRequest request) {
        UUID organizationId = request.organizationId() == null ? DEFAULT_ORGANIZATION : request.organizationId();
        if (request.budgetMaxMinor() < request.budgetMinMinor()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum budget must not be lower than minimum budget");
        }
        LocalDate applicationDeadline;
        try {
            applicationDeadline = LocalDate.parse(request.applicationDeadline());
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "applicationDeadline must be YYYY-MM-DD");
        }
        boolean publish = Boolean.TRUE.equals(request.publish());
        UUID id = UUID.randomUUID();
        jdbc.update(
            "insert into jobs (id, organization_id, title, category, summary, skills, engagement, payment_type, duration, " +
                "budget_min_minor, budget_max_minor, currency, location_scope, application_deadline, status, published_at) " +
                "values (?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?, ?, ?, 'USDC', ?, ?, ?, ?)",
            id, organizationId, request.title().trim(), request.category().trim(), request.summary().trim(),
            skillsJson(request.skills()),
            oneOf(request.engagement(), "PROJECT", List.of("PROJECT", "CONTRACT", "PART_TIME")),
            oneOf(request.paymentType(), "FIXED", List.of("FIXED", "MILESTONE", "HOURLY")),
            request.duration() == null ? "" : request.duration().trim(),
            request.budgetMinMinor(), request.budgetMaxMinor(), request.locationScope().trim(), applicationDeadline,
            publish ? "PUBLISHED" : "DRAFT", publish ? Timestamp.from(Instant.now()) : null
        );
        return find(id);
    }

    @Transactional
    public Job changeStatus(UUID id, UUID organizationId, String nextStatus) {
        Job current = find(id);
        if (!current.organizationId().equals(organizationId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Job belongs to another organization");
        }
        if (!STATUS_TRANSITIONS.getOrDefault(current.status(), List.of()).contains(nextStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid job status transition");
        }
        jdbc.update("update jobs set status=?, published_at=case when ?='PUBLISHED' then coalesce(published_at, now()) else published_at end where id=?",
            nextStatus, nextStatus, id);
        return find(id);
    }

    private String select() {
        return "select j.id, j.organization_id, coalesce(b.display_name, o.trading_name) organization_name, j.title, j.category, j.summary, " +
            "j.skills::text skills, j.engagement, j.payment_type, j.duration, j.budget_min_minor, j.budget_max_minor, j.currency, " +
            "j.location_scope, j.application_deadline, j.status, " +
            "(select count(*) from job_applications a where a.job_id=j.id and a.status<>'withdrawn') applicant_count, " +
            "j.created_at, j.published_at from jobs j join organizations o on o.id=j.organization_id " +
            "left join business_profiles b on b.organization_id=j.organization_id";
    }

    private String skillsJson(List<String> skills) {
        List<String> cleaned = skills == null ? List.of() : skills.stream()
            .filter(skill -> skill != null && !skill.isBlank()).map(String::trim).distinct().limit(12).toList();
        if (cleaned.stream().anyMatch(skill -> skill.length() > 60)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Skills must be at most 60 characters");
        }
        try {
            return json.writeValueAsString(cleaned);
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private List<String> skills(String value) {
        try {
            return json.readValue(value, new TypeReference<List<String>>() {});
        } catch (Exception exception) {
            return List.of();
        }
    }

    private static String oneOf(String value, String fallback, List<String> allowed) {
        if (value == null || value.isBlank()) return fallback;
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (!allowed.contains(normalized)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid value " + value);
        return normalized;
    }

    private Job map(ResultSet rs, int row) throws SQLException {
        Timestamp publishedAt = rs.getTimestamp("published_at");
        return new Job(
            rs.getObject("id", UUID.class),
            rs.getObject("organization_id", UUID.class),
            rs.getString("organization_name"),
            rs.getString("title"),
            rs.getString("category"),
            rs.getString("summary"),
            skills(rs.getString("skills")),
            rs.getString("engagement"),
            rs.getString("payment_type"),
            rs.getString("duration"),
            rs.getLong("budget_min_minor"),
            rs.getLong("budget_max_minor"),
            rs.getString("currency"),
            rs.getString("location_scope"),
            rs.getDate("application_deadline").toLocalDate(),
            rs.getString("status"),
            rs.getInt("applicant_count"),
            rs.getTimestamp("created_at").toInstant(),
            publishedAt == null ? null : publishedAt.toInstant()
        );
    }
}
