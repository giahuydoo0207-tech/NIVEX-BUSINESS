package com.nova.backend.application;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.nova.backend.notification.NotificationRepository;

@Repository
public class JobApplicationRepository {
    private final JdbcTemplate jdbc;
    private final NotificationRepository notifications;
    public JobApplicationRepository(JdbcTemplate jdbc, NotificationRepository notifications) { this.jdbc = jdbc; this.notifications = notifications; }

    public List<JobApplication> forOrganization(UUID organizationId, int offset, int limit) {
        return jdbc.query(select() + " where a.organization_id=? order by a.submitted_at desc, a.id desc limit ? offset ?", this::map, organizationId, limit, offset);
    }
    public List<JobApplication> forContractor(String contractorId, int offset, int limit) {
        return jdbc.query(select() + " where a.contractor_id=? order by a.submitted_at desc, a.id desc limit ? offset ?", this::map, contractorId, limit, offset);
    }
    public Optional<JobApplication> find(UUID id) { return jdbc.query(select() + " where a.id=?", this::map, id).stream().findFirst(); }

    @Transactional
    public JobApplication submit(UUID jobId, String contractorId, String coverNote) {
        var job = jdbc.query("select organization_id, title, status, application_deadline < current_date from jobs where id=?", (rs, row) -> new Object[] {rs.getObject(1, UUID.class), rs.getString(2), rs.getString(3), rs.getBoolean(4)}, jobId);
        if (job.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found");
        if (!"PUBLISHED".equals(job.getFirst()[2]) || Boolean.TRUE.equals(job.getFirst()[3])) throw new ResponseStatusException(HttpStatus.CONFLICT, "This job is not accepting applications");
        if (jdbc.queryForObject("select exists(select 1 from job_applications where job_id=? and contractor_id=?)", Boolean.class, jobId, contractorId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already applied to this job");
        }
        UUID id = UUID.randomUUID();
        int inserted;
        try {
            inserted = jdbc.update("insert into job_applications (id, job_id, organization_id, contractor_id, cover_note, profile_snapshot) " +
                    "select ?, ?, ?, t.contractor_id, ?, jsonb_build_object('displayName',t.display_name,'headline',t.headline,'email',t.email,'location',t.location,'skills',t.skills) from talent_profiles t where t.contractor_id=?",
                id, jobId, job.getFirst()[0], coverNote.trim(), contractorId);
        } catch (DuplicateKeyException exception) {
            // Two taps racing past the exists check hit the (job_id, contractor_id) unique key.
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already applied to this job");
        }
        if (inserted == 0) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Talent profile not found for this session");
        jdbc.update("insert into application_status_events (id, application_id, next_status, actor_type, note) values (?, ?, 'submitted', 'TALENT', 'Đã gửi ứng tuyển')", UUID.randomUUID(), id);
        String applicant = jdbc.query("select display_name from talent_profiles where contractor_id=?", (rs, row) -> rs.getString(1), contractorId)
            .stream().findFirst().orElse("Ứng viên");
        notifications.business((UUID) job.getFirst()[0], "APPLICATION_SUBMITTED", "Có hồ sơ ứng tuyển mới", applicant + " đã ứng tuyển: " + job.getFirst()[1], "{\"applicationId\":\"" + id + "\"}");
        return find(id).orElseThrow();
    }

    @Transactional
    public JobApplication transition(UUID id, UUID organizationId, String nextStatus, String note) {
        JobApplication current = find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        if (!organizationOwns(id, organizationId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Application belongs to another organization");
        if (!allowed(current.status(), nextStatus)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid application status transition");
        jdbc.update("update job_applications set status=?, updated_at=now() where id=?", nextStatus, id);
        jdbc.update("insert into application_status_events (id, application_id, previous_status, next_status, actor_type, note) values (?, ?, ?, ?, 'BUSINESS', ?)", UUID.randomUUID(), id, current.status(), nextStatus, blankToNull(note));
        String title = switch (nextStatus) {
            case "accepted" -> "Bạn đã được nhận";
            case "rejected" -> "Hồ sơ chưa được chọn";
            default -> "Hồ sơ đã được cập nhật";
        };
        String data = "{\"applicationId\":\"" + id + "\",\"jobId\":\"" + current.jobId() + "\",\"status\":\"" + nextStatus
            + "\",\"organizationName\":" + jsonString(current.organizationName()) + ",\"jobTitle\":" + jsonString(current.jobTitle()) + "}";
        notifications.talent(current.contractorId(), "APPLICATION_STATUS", title,
            current.organizationName() + " · " + current.jobTitle() + ": " + label(nextStatus), data);
        return find(id).orElseThrow();
    }

    @Transactional
    public JobApplication withdraw(UUID id, String contractorId) {
        JobApplication current = find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        if (!current.contractorId().equals(contractorId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Application belongs to another contractor");
        if (!("submitted".equals(current.status()) || "viewed".equals(current.status()) || "shortlisted".equals(current.status()))) throw new ResponseStatusException(HttpStatus.CONFLICT, "This application can no longer be withdrawn");
        jdbc.update("update job_applications set status='withdrawn', withdrawn_at=now(), updated_at=now() where id=?", id);
        jdbc.update("insert into application_status_events (id, application_id, previous_status, next_status, actor_type, note) values (?, ?, ?, 'withdrawn', 'TALENT', 'Ứng viên đã rút hồ sơ')", UUID.randomUUID(), id, current.status());
        notifications.business(organizationOf(id), "APPLICATION_WITHDRAWN", "Ứng viên đã rút hồ sơ", current.candidateName() + " đã rút hồ sơ: " + current.jobTitle(), "{\"applicationId\":\"" + id + "\"}");
        return find(id).orElseThrow();
    }

    private UUID organizationOf(UUID id) { return jdbc.queryForObject("select organization_id from job_applications where id=?", UUID.class, id); }
    private static String label(String status) {
        return switch (status) {
            case "viewed" -> "Doanh nghiệp đã xem hồ sơ";
            case "shortlisted" -> "Hồ sơ được đưa vào danh sách chọn";
            case "interview" -> "Bạn được mời phỏng vấn";
            case "accepted" -> "Chúc mừng, bạn đã được nhận";
            case "rejected" -> "Hồ sơ chưa phù hợp lần này";
            default -> status;
        };
    }
    private boolean organizationOwns(UUID id, UUID organizationId) { return Boolean.TRUE.equals(jdbc.queryForObject("select exists(select 1 from job_applications where id=? and organization_id=?)", Boolean.class, id, organizationId)); }
    private boolean allowed(String from, String to) { return switch (from) { case "submitted" -> List.of("viewed","shortlisted","accepted","rejected").contains(to); case "viewed" -> List.of("shortlisted","accepted","rejected").contains(to); case "shortlisted" -> List.of("interview","accepted","rejected").contains(to); case "interview" -> List.of("accepted","rejected").contains(to); default -> false; }; }
    private static String jsonString(String value) {
        if (value == null) return "null";
        StringBuilder out = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                default -> { if (c < 0x20) out.append(String.format("\\u%04x", (int) c)); else out.append(c); }
            }
        }
        return out.append('"').toString();
    }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String select() { return "select a.id, a.job_id, j.title, a.contractor_id, t.display_name, t.headline, t.email, t.location, t.skills::text, a.cover_note, a.status, a.submitted_at, a.updated_at, a.withdrawn_at, " +
        "a.organization_id, coalesce(b.display_name, o.trading_name), cp.avatar_url from job_applications a join jobs j on j.id=a.job_id join talent_profiles t on t.contractor_id=a.contractor_id " +
        "join organizations o on o.id=a.organization_id left join business_profiles b on b.organization_id=a.organization_id left join community_profiles cp on cp.id=a.contractor_id"; }
    private JobApplication map(ResultSet rs, int row) throws SQLException { return new JobApplication(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), rs.getString(9), rs.getString(10), rs.getString(11), rs.getTimestamp(12).toInstant(), rs.getTimestamp(13).toInstant(), rs.getTimestamp(14) == null ? null : rs.getTimestamp(14).toInstant(), rs.getObject(15, UUID.class), rs.getString(16), rs.getString(17)); }
}
