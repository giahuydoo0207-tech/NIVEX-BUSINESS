package com.nova.backend.replyn;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nova.backend.notification.NotificationRepository;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Replyn proposals between the two parties of a Nova conversation. Every state change locks the
 * proposal row and is guarded by a conditional UPDATE, so a double click, a replay or two devices
 * responding at once can never apply two transitions. Callers pass identities taken from the
 * authenticated session; nothing here trusts an id sent by a client.
 */
@Service
public class ReplynProposalService {
    /** A sent proposal waits this long for the talent before it expires. */
    static final int PENDING_DAYS = 7;
    static final int MAX_DELIVERABLES = 20;
    static final int MAX_MILESTONES = 10;
    static final BigDecimal MAX_AMOUNT = new BigDecimal("1000000000");
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String SELECT = "select id, thread_id, status, project_name, scope, deliverables::text, revision_limit, currency, "
        + "total_amount, start_date, deadline, review_period_days, milestones::text, notes, supersedes_id, workspace_id, rejection_reason, "
        + "created_at, updated_at, sent_at, expires_at, accepted_at, rejected_at, cancelled_at from replyn_proposals";
    private static final TypeReference<List<String>> STRINGS = new TypeReference<>() {};
    private static final TypeReference<List<ReplynProposal.Milestone>> MILESTONES = new TypeReference<>() {};

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final NotificationRepository notifications;

    public ReplynProposalService(JdbcTemplate jdbc, ObjectMapper json, NotificationRepository notifications) {
        this.jdbc = jdbc;
        this.json = json;
        this.notifications = notifications;
    }

    /** Proposals of one conversation, oldest first. Overdue pending proposals are expired first. */
    @Transactional
    public List<ReplynProposal> forThread(UUID threadId, boolean includeDrafts) {
        jdbc.update("update replyn_proposals set status='EXPIRED', updated_at=now() where thread_id=? and status='PENDING' and expires_at<=now()", threadId);
        return jdbc.query(SELECT + " where thread_id=?" + (includeDrafts ? "" : " and status<>'DRAFT'") + " order by created_at, id",
            this::map, threadId);
    }

    @Transactional
    public ReplynProposal create(UUID threadId, UUID organizationId, ProposalInput input, boolean send) {
        ThreadRow thread = lockThread(threadId);
        if (!thread.organizationId().equals(organizationId)) throw forbidden();
        if (!"ACCEPTED".equals(thread.status())) {
            throw new ReplynProposalException(HttpStatus.CONFLICT, "THREAD_NOT_ACTIVE", "Chỉ gửi được đề xuất trong cuộc trò chuyện đang hoạt động.");
        }
        forThread(threadId, true);
        Integer open = jdbc.queryForObject("select count(*) from replyn_proposals where thread_id=? and status in ('DRAFT','PENDING','ACCEPTED')",
            Integer.class, threadId);
        if (open != null && open > 0) {
            throw new ReplynProposalException(HttpStatus.CONFLICT, "PROPOSAL_EXISTS", "Cuộc trò chuyện này đã có một đề xuất Replyn đang mở.");
        }
        Valid valid = validate(input, send);
        UUID supersedes = input.supersedesId();
        if (supersedes != null) {
            Boolean replaceable = jdbc.queryForObject("select exists(select 1 from replyn_proposals where id=? and thread_id=? and status in ('REJECTED','CANCELLED','EXPIRED'))",
                Boolean.class, supersedes, threadId);
            if (!Boolean.TRUE.equals(replaceable)) {
                throw new ReplynProposalException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Đề xuất trước không thuộc cuộc trò chuyện này.");
            }
        }
        UUID id = UUID.randomUUID();
        try {
            jdbc.update("insert into replyn_proposals (id, thread_id, organization_id, contractor_id, project_name, scope, deliverables, revision_limit, "
                    + "currency, total_amount, start_date, deadline, review_period_days, milestones, notes, supersedes_id) "
                    + "values (?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
                id, threadId, organizationId, thread.contractorId(), valid.projectName(), valid.scope(), write(valid.deliverables()),
                valid.revisionLimit(), valid.currency(), valid.totalAmount(), valid.startDate(), valid.deadline(), valid.reviewPeriodDays(),
                write(valid.milestones()), valid.notes(), supersedes);
        } catch (DuplicateKeyException race) {
            throw new ReplynProposalException(HttpStatus.CONFLICT, "PROPOSAL_EXISTS", "Cuộc trò chuyện này đã có một đề xuất Replyn đang mở.");
        }
        return send ? markSent(id, thread) : find(id);
    }

    /** Only a draft can change; a sent proposal is never edited in place. */
    @Transactional
    public ReplynProposal updateDraft(UUID threadId, UUID proposalId, UUID organizationId, ProposalInput input) {
        Locked locked = lockForBusiness(threadId, proposalId, organizationId);
        if (!locked.proposal().draft()) throw sentIsFinal();
        Valid valid = validate(input, false);
        jdbc.update("update replyn_proposals set project_name=?, scope=?, deliverables=?::jsonb, revision_limit=?, currency=?, total_amount=?, "
                + "start_date=?, deadline=?, review_period_days=?, milestones=?::jsonb, notes=?, updated_at=now() where id=? and status='DRAFT'",
            valid.projectName(), valid.scope(), write(valid.deliverables()), valid.revisionLimit(), valid.currency(), valid.totalAmount(),
            valid.startDate(), valid.deadline(), valid.reviewPeriodDays(), write(valid.milestones()), valid.notes(), proposalId);
        return find(proposalId);
    }

    @Transactional
    public ReplynProposal send(UUID threadId, UUID proposalId, UUID organizationId) {
        Locked locked = lockForBusiness(threadId, proposalId, organizationId);
        if (!locked.proposal().draft()) throw sentIsFinal();
        if (!"ACCEPTED".equals(locked.thread().status())) {
            throw new ReplynProposalException(HttpStatus.CONFLICT, "THREAD_NOT_ACTIVE", "Chỉ gửi được đề xuất trong cuộc trò chuyện đang hoạt động.");
        }
        validate(ProposalInput.of(locked.proposal()), true);
        return markSent(proposalId, locked.thread());
    }

    /** Withdraws a pending proposal, or discards a draft (which is deleted). Empty when a draft was discarded. */
    // Not rolled back on a refusal, so an overdue proposal is still recorded as EXPIRED.
    @Transactional(noRollbackFor = ReplynProposalException.class)
    public Optional<ReplynProposal> cancel(UUID threadId, UUID proposalId, UUID organizationId) {
        Locked locked = lockForBusiness(threadId, proposalId, organizationId);
        ReplynProposal proposal = locked.proposal();
        if (proposal.draft()) {
            jdbc.update("delete from replyn_proposals where id=? and status='DRAFT'", proposalId);
            return Optional.empty();
        }
        if (!"PENDING".equals(proposal.status())) throw alreadyDecided(proposal.status());
        if (expired(proposalId)) throw expire(proposalId);
        int changed = jdbc.update("update replyn_proposals set status='CANCELLED', cancelled_at=now(), updated_at=now() "
            + "where id=? and status='PENDING' and expires_at>now()", proposalId);
        if (changed != 1) throw alreadyDecided("CANCELLED");
        touch(threadId);
        notifications.talent(locked.thread().contractorId(), "REPLYN_PROPOSAL_CANCELLED", "Đề xuất Replyn đã bị hủy",
            organizationName(organizationId) + " đã hủy đề xuất “" + proposal.projectName() + "”.", data(threadId, proposalId));
        return Optional.of(find(proposalId));
    }

    /** The talent of the conversation accepts; this is the only place a Replyn workspace id is allocated. */
    @Transactional(noRollbackFor = ReplynProposalException.class)
    public ReplynProposal accept(UUID threadId, UUID proposalId, String contractorId) {
        Locked locked = lockForTalent(threadId, proposalId, contractorId);
        ReplynProposal proposal = locked.proposal();
        // A retried accept by the talent it was accepted for (double tap, lost response, race) returns the same workspace.
        if ("ACCEPTED".equals(proposal.status()) && proposal.workspaceId() != null && acceptedFor(proposalId, contractorId)) {
            return proposal;
        }
        if (!"PENDING".equals(proposal.status())) throw alreadyDecided(proposal.status());
        if (expired(proposalId)) throw expire(proposalId);
        int changed = jdbc.update("update replyn_proposals set status='ACCEPTED', workspace_id=?, accepted_at=now(), updated_at=now() "
            + "where id=? and status='PENDING' and expires_at>now()", UUID.randomUUID(), proposalId);
        if (changed != 1) throw alreadyDecided("ACCEPTED");
        touch(threadId);
        notifyBusiness(threadId, locked.thread().organizationId(), "REPLYN_PROPOSAL_ACCEPTED", "Đề xuất Replyn đã được chấp nhận",
            talentName(contractorId) + " đã chấp nhận “" + proposal.projectName() + "”. Workspace Replyn đã sẵn sàng.", data(threadId, proposalId));
        return find(proposalId);
    }

    @Transactional(noRollbackFor = ReplynProposalException.class)
    public ReplynProposal reject(UUID threadId, UUID proposalId, String contractorId, String reason) {
        String cleanReason = reason == null ? "" : reason.strip();
        if (cleanReason.length() > 500) {
            throw new ReplynProposalException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Lý do tối đa 500 ký tự.",
                Map.of("reason", "Lý do tối đa 500 ký tự."));
        }
        Locked locked = lockForTalent(threadId, proposalId, contractorId);
        ReplynProposal proposal = locked.proposal();
        if (!"PENDING".equals(proposal.status())) throw alreadyDecided(proposal.status());
        if (expired(proposalId)) throw expire(proposalId);
        int changed = jdbc.update("update replyn_proposals set status='REJECTED', rejected_at=now(), rejection_reason=?, updated_at=now() "
            + "where id=? and status='PENDING' and expires_at>now()", cleanReason.isEmpty() ? null : cleanReason, proposalId);
        if (changed != 1) throw alreadyDecided("REJECTED");
        touch(threadId);
        notifyBusiness(threadId, locked.thread().organizationId(), "REPLYN_PROPOSAL_REJECTED", "Đề xuất Replyn bị từ chối",
            talentName(contractorId) + " đã từ chối “" + proposal.projectName() + "”.", data(threadId, proposalId));
        return find(proposalId);
    }

    /** Blocking a candidate withdraws what is still open; accepted proposals and their workspaces stay intact. */
    public void closeOpenOnBlock(UUID threadId) {
        jdbc.update("delete from replyn_proposals where thread_id=? and status='DRAFT'", threadId);
        jdbc.update("update replyn_proposals set status='CANCELLED', cancelled_at=now(), updated_at=now() where thread_id=? and status='PENDING'", threadId);
    }

    /** Accepted workspaces the given Replyn identity is a party to; optionally only one workspace. */
    @Transactional(readOnly = true)
    public List<WorkspaceView> workspacesFor(String subjectType, String subjectId, UUID workspaceId) {
        String member = "ORGANIZATION".equals(subjectType) ? "p.organization_id=?::uuid" : "p.contractor_id=?";
        String role = "ORGANIZATION".equals(subjectType) ? "business" : "freelancer";
        List<Object> args = new ArrayList<>(List.of(subjectId));
        String only = "";
        if (workspaceId != null) {
            only = " and p.workspace_id=?";
            args.add(workspaceId);
        }
        return jdbc.query("select p.workspace_id, p.id, p.project_name, p.scope, p.deliverables::text, p.revision_limit, p.currency, p.total_amount, "
                + "p.start_date, p.deadline, p.review_period_days, p.milestones::text, p.notes, p.accepted_at, "
                + "coalesce(b.display_name, o.trading_name), t.display_name, p.thread_id from replyn_proposals p "
                + "join organizations o on o.id=p.organization_id left join business_profiles b on b.organization_id=p.organization_id "
                + "join talent_profiles t on t.contractor_id=p.contractor_id "
                + "where p.status='ACCEPTED' and " + member + only + " order by p.accepted_at desc limit 50",
            (rs, row) -> new WorkspaceView(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3), rs.getString(4),
                read(rs.getString(5), STRINGS), rs.getObject(6, Integer.class), rs.getString(7), rs.getBigDecimal(8),
                rs.getObject(9, LocalDate.class), rs.getObject(10, LocalDate.class), rs.getObject(11, Integer.class),
                read(rs.getString(12), MILESTONES), rs.getString(13), rs.getTimestamp(14).toInstant(), rs.getString(15), rs.getString(16), role,
                "business".equals(role) ? rs.getObject(17, UUID.class) : null),
            args.toArray());
    }

    /* ---------- validation ---------- */

    private Valid validate(ProposalInput in, boolean complete) {
        Map<String, String> errors = new LinkedHashMap<>();
        String projectName = clean(in.projectName());
        if (projectName.isEmpty()) errors.put("projectName", "Nhập tên dự án.");
        else if (projectName.length() > 160) errors.put("projectName", "Tên dự án tối đa 160 ký tự.");
        String scope = clean(in.scope());
        if (scope.length() > 4000) errors.put("scope", "Phạm vi tối đa 4.000 ký tự.");
        else if (complete && scope.isEmpty()) errors.put("scope", "Mô tả phạm vi công việc.");

        List<String> deliverables = new ArrayList<>();
        for (String item : in.deliverables() == null ? List.<String>of() : in.deliverables()) {
            String value = clean(item);
            if (value.isEmpty()) continue;
            if (value.length() > 300) errors.put("deliverables", "Mỗi sản phẩm bàn giao tối đa 300 ký tự.");
            deliverables.add(value);
        }
        if (deliverables.size() > MAX_DELIVERABLES) errors.put("deliverables", "Tối đa " + MAX_DELIVERABLES + " sản phẩm bàn giao.");
        else if (complete && deliverables.isEmpty()) errors.put("deliverables", "Thêm ít nhất một sản phẩm bàn giao.");

        Integer revisionLimit = in.revisionLimit();
        if (revisionLimit != null && (revisionLimit < 0 || revisionLimit > 20)) errors.put("revisionLimit", "Số lần chỉnh sửa từ 0 đến 20.");
        else if (complete && revisionLimit == null) errors.put("revisionLimit", "Nhập số lần chỉnh sửa.");

        String currency = in.currency() == null || in.currency().isBlank() ? "USDC" : in.currency().strip().toUpperCase();
        if (!"USDC".equals(currency)) errors.put("currency", "Hiện chỉ hỗ trợ USDC (mô phỏng).");

        BigDecimal total = in.totalAmount();
        if (total != null && !validAmount(total)) errors.put("totalAmount", "Ngân sách phải lớn hơn 0, tối đa 2 chữ số thập phân.");
        else if (complete && total == null) errors.put("totalAmount", "Nhập tổng ngân sách.");

        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        LocalDate start = in.startDate();
        LocalDate deadline = in.deadline();
        if (complete && deadline == null) errors.put("deadline", "Chọn deadline.");
        else if (complete && deadline.isBefore(today)) errors.put("deadline", "Deadline không được ở quá khứ.");
        if (start != null && deadline != null && start.isAfter(deadline)) errors.put("startDate", "Ngày bắt đầu phải trước deadline.");

        Integer reviewDays = in.reviewPeriodDays();
        if (reviewDays != null && (reviewDays < 1 || reviewDays > 30)) errors.put("reviewPeriodDays", "Thời gian nghiệm thu từ 1 đến 30 ngày.");
        else if (complete && reviewDays == null) errors.put("reviewPeriodDays", "Nhập thời gian nghiệm thu.");

        List<ReplynProposal.Milestone> milestones = new ArrayList<>();
        List<MilestoneInput> rawMilestones = in.milestones() == null ? List.of() : in.milestones();
        if (rawMilestones.size() > MAX_MILESTONES) errors.put("milestones", "Tối đa " + MAX_MILESTONES + " milestone.");
        else if (complete && rawMilestones.isEmpty()) errors.put("milestones", "Thêm ít nhất một milestone.");
        BigDecimal sum = BigDecimal.ZERO;
        boolean amountsComplete = true;
        LocalDate previous = null;
        for (int i = 0; i < Math.min(rawMilestones.size(), MAX_MILESTONES); i++) {
            MilestoneInput raw = rawMilestones.get(i) == null ? new MilestoneInput(null, null, null) : rawMilestones.get(i);
            String key = "milestones." + i + ".";
            String title = clean(raw.title());
            if (title.length() > 160) errors.put(key + "title", "Tên milestone tối đa 160 ký tự.");
            else if (complete && title.isEmpty()) errors.put(key + "title", "Nhập tên milestone.");
            if (raw.amount() == null) {
                amountsComplete = false;
                if (complete) errors.put(key + "amount", "Nhập số tiền.");
            } else if (!validAmount(raw.amount())) {
                amountsComplete = false;
                errors.put(key + "amount", "Số tiền phải lớn hơn 0, tối đa 2 chữ số thập phân.");
            } else {
                sum = sum.add(raw.amount());
            }
            LocalDate due = raw.deadline();
            if (due == null) {
                if (complete) errors.put(key + "deadline", "Chọn deadline.");
            } else if (start != null && due.isBefore(start)) {
                errors.put(key + "deadline", "Deadline milestone phải sau ngày bắt đầu.");
            } else if (deadline != null && due.isAfter(deadline)) {
                errors.put(key + "deadline", "Deadline milestone không được sau deadline dự án.");
            } else if (previous != null && due.isBefore(previous)) {
                errors.put(key + "deadline", "Deadline phải theo thứ tự các milestone.");
            } else if (complete && due.isBefore(today)) {
                errors.put(key + "deadline", "Deadline không được ở quá khứ.");
            }
            if (due != null) previous = due;
            milestones.add(new ReplynProposal.Milestone(title, raw.amount(), due));
        }
        if (complete && total != null && validAmount(total) && amountsComplete && !rawMilestones.isEmpty() && sum.compareTo(total) != 0) {
            errors.put("milestones", "Tổng các milestone (" + sum.stripTrailingZeros().toPlainString() + ") phải bằng tổng ngân sách ("
                + total.stripTrailingZeros().toPlainString() + ").");
        }

        String notes = clean(in.notes());
        if (notes.length() > 2000) errors.put("notes", "Ghi chú tối đa 2.000 ký tự.");

        if (!errors.isEmpty()) {
            throw new ReplynProposalException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Đề xuất chưa hợp lệ.", errors);
        }
        return new Valid(projectName, scope, deliverables, revisionLimit, currency, total, start, deadline, reviewDays, milestones, notes);
    }

    private static boolean validAmount(BigDecimal value) {
        return value.signum() > 0 && value.compareTo(MAX_AMOUNT) <= 0 && value.stripTrailingZeros().scale() <= 2;
    }

    private static String clean(String value) {
        return value == null ? "" : value.replaceAll("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]", "").strip();
    }

    /* ---------- state helpers ---------- */

    private ReplynProposal markSent(UUID proposalId, ThreadRow thread) {
        jdbc.update("update replyn_proposals set status='PENDING', sent_at=now(), expires_at=now() + make_interval(days => ?), updated_at=now() "
            + "where id=? and status='DRAFT'", PENDING_DAYS, proposalId);
        ReplynProposal sent = find(proposalId);
        touch(sent.threadId());
        notifications.talent(thread.contractorId(), "REPLYN_PROPOSAL", "Đề xuất Replyn mới",
            organizationName(thread.organizationId()) + " gửi đề xuất “" + sent.projectName() + "”. Xem và phản hồi trong cuộc trò chuyện.",
            data(sent.threadId(), proposalId));
        return sent;
    }

    private boolean expired(UUID proposalId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("select expires_at<=now() from replyn_proposals where id=?", Boolean.class, proposalId));
    }

    private ReplynProposalException expire(UUID proposalId) {
        jdbc.update("update replyn_proposals set status='EXPIRED', updated_at=now() where id=? and status='PENDING'", proposalId);
        return new ReplynProposalException(HttpStatus.GONE, "PROPOSAL_EXPIRED", "Đề xuất đã hết hạn.");
    }

    private Locked lockForBusiness(UUID threadId, UUID proposalId, UUID organizationId) {
        ThreadRow thread = lockThread(threadId);
        if (!thread.organizationId().equals(organizationId)) throw forbidden();
        return new Locked(thread, lockProposal(threadId, proposalId, true));
    }

    private Locked lockForTalent(UUID threadId, UUID proposalId, String contractorId) {
        ThreadRow thread = lockThread(threadId);
        if (!thread.contractorId().equals(contractorId)) throw forbidden();
        if ("BLOCKED".equals(thread.status())) {
            throw new ReplynProposalException(HttpStatus.FORBIDDEN, "THREAD_BLOCKED", "Doanh nghiệp không còn nhận phản hồi từ bạn.");
        }
        // Drafts are invisible to the talent, so they look like a proposal that does not exist.
        return new Locked(thread, lockProposal(threadId, proposalId, false));
    }

    private ThreadRow lockThread(UUID threadId) {
        return jdbc.query("select organization_id, contractor_id, request_status from message_threads where id=? for update",
                (rs, row) -> new ThreadRow(rs.getObject(1, UUID.class), rs.getString(2), rs.getString(3)), threadId)
            .stream().findFirst()
            .orElseThrow(() -> new ReplynProposalException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy cuộc trò chuyện."));
    }

    private ReplynProposal lockProposal(UUID threadId, UUID proposalId, boolean includeDrafts) {
        return jdbc.query(SELECT + " where id=? and thread_id=?" + (includeDrafts ? "" : " and status<>'DRAFT'") + " for update",
                this::map, proposalId, threadId)
            .stream().findFirst()
            .orElseThrow(() -> new ReplynProposalException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy đề xuất."));
    }

    private ReplynProposal find(UUID id) {
        return jdbc.query(SELECT + " where id=?", this::map, id).getFirst();
    }

    private void touch(UUID threadId) {
        jdbc.update("update message_threads set updated_at=now() where id=?", threadId);
    }

    private void notifyBusiness(UUID threadId, UUID organizationId, String type, String title, String body, String data) {
        Boolean muted = jdbc.queryForObject("select business_muted_at is not null from message_threads where id=?", Boolean.class, threadId);
        if (!Boolean.TRUE.equals(muted)) notifications.business(organizationId, type, title, body, data);
    }

    private static ReplynProposalException forbidden() {
        return new ReplynProposalException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không thuộc cuộc trò chuyện này.");
    }

    private static ReplynProposalException sentIsFinal() {
        return new ReplynProposalException(HttpStatus.CONFLICT, "PROPOSAL_NOT_EDITABLE",
            "Đề xuất đã gửi không thể sửa. Hãy hủy và gửi đề xuất mới.");
    }

    private boolean acceptedFor(UUID proposalId, String contractorId) {
        Integer matches = jdbc.queryForObject("select count(*) from replyn_proposals where id=? and status='ACCEPTED' and contractor_id=?",
            Integer.class, proposalId, contractorId);
        return matches != null && matches == 1;
    }

    private static ReplynProposalException alreadyDecided(String status) {
        return new ReplynProposalException(HttpStatus.CONFLICT, "PROPOSAL_" + status, switch (status) {
            case "ACCEPTED" -> "Đề xuất đã được chấp nhận.";
            case "REJECTED" -> "Đề xuất đã bị từ chối.";
            case "CANCELLED" -> "Đề xuất đã bị hủy.";
            case "EXPIRED" -> "Đề xuất đã hết hạn.";
            default -> "Đề xuất không còn chờ phản hồi.";
        });
    }

    private String organizationName(UUID organizationId) {
        return jdbc.query("select coalesce(b.display_name,o.trading_name) from organizations o left join business_profiles b on b.organization_id=o.id where o.id=?",
            (rs, row) -> rs.getString(1), organizationId).stream().findFirst().orElse("Doanh nghiệp");
    }

    private String talentName(String contractorId) {
        return jdbc.query("select display_name from talent_profiles where contractor_id=?", (rs, row) -> rs.getString(1), contractorId)
            .stream().findFirst().orElse("Ứng viên");
    }

    private String data(UUID threadId, UUID proposalId) {
        return write(Map.of("threadId", threadId.toString(), "proposalId", proposalId.toString()));
    }

    private String write(Object value) {
        try {
            return json.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private <T> T read(String value, TypeReference<T> type) {
        try {
            return json.readValue(value, type);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private ReplynProposal map(ResultSet rs, int row) throws SQLException {
        return new ReplynProposal(rs.getObject("id", UUID.class), rs.getObject("thread_id", UUID.class), rs.getString("status"),
            rs.getString("project_name"), rs.getString("scope"), read(rs.getString("deliverables"), STRINGS),
            rs.getObject("revision_limit", Integer.class), rs.getString("currency"), rs.getBigDecimal("total_amount"),
            rs.getObject("start_date", LocalDate.class), rs.getObject("deadline", LocalDate.class),
            rs.getObject("review_period_days", Integer.class), read(rs.getString("milestones"), MILESTONES), rs.getString("notes"),
            rs.getObject("supersedes_id", UUID.class), rs.getObject("workspace_id", UUID.class), rs.getString("rejection_reason"),
            instant(rs, "created_at"), instant(rs, "updated_at"), instant(rs, "sent_at"), instant(rs, "expires_at"),
            instant(rs, "accepted_at"), instant(rs, "rejected_at"), instant(rs, "cancelled_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    public record MilestoneInput(String title, BigDecimal amount, LocalDate deadline) {}

    public record ProposalInput(String projectName, String scope, List<String> deliverables, Integer revisionLimit, String currency,
                                BigDecimal totalAmount, LocalDate startDate, LocalDate deadline, Integer reviewPeriodDays,
                                List<MilestoneInput> milestones, String notes, UUID supersedesId) {
        static ProposalInput of(ReplynProposal p) {
            return new ProposalInput(p.projectName(), p.scope(), p.deliverables(), p.revisionLimit(), p.currency(), p.totalAmount(),
                p.startDate(), p.deadline(), p.reviewPeriodDays(),
                p.milestones().stream().map(m -> new MilestoneInput(m.title(), m.amount(), m.deadline())).toList(), p.notes(), p.supersedesId());
        }
    }

    /**
     * What Replyn's server receives for a workspace: the accepted agreement and display names, no internal profile ids.
     * {@code sourceThreadId} is the Nova message thread the proposal was sent in, so Replyn can link back to that conversation.
     * Only the business viewer receives it; the freelancer continues the conversation on Nova Mobile.
     */
    public record WorkspaceView(UUID workspaceId, UUID proposalId, String projectName, String scope, List<String> deliverables,
                                Integer revisionLimit, String currency, BigDecimal totalAmount, LocalDate startDate, LocalDate deadline,
                                Integer reviewPeriodDays, List<ReplynProposal.Milestone> milestones, String notes, Instant acceptedAt,
                                String businessName, String freelancerName, String viewerRole, UUID sourceThreadId) {}

    private record ThreadRow(UUID organizationId, String contractorId, String status) {}
    private record Locked(ThreadRow thread, ReplynProposal proposal) {}
    private record Valid(String projectName, String scope, List<String> deliverables, Integer revisionLimit, String currency,
                         BigDecimal totalAmount, LocalDate startDate, LocalDate deadline, Integer reviewPeriodDays,
                         List<ReplynProposal.Milestone> milestones, String notes) {}
}
