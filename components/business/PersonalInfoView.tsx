"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { PortalDialog } from "@/components/ui/PortalDialog";
import { BUSINESS_REPRESENTATIVE } from "@/lib/business-navigation";
import { liveBackend, proxiedMediaUrl, workspaceRequest } from "@/lib/workspace-api";
import {
  NOVA_CREDENTIALS_PATH,
  NOVA_KEY_PATH,
  formatCredentialTime,
  issueKeyNeedsConfirmation,
  lastKeyChange,
  maskedNovaKey,
  novaKeyStatusLabel,
  type IssuedNovaKey,
  type NovaCredential,
} from "@/lib/nova-credentials";

type LoadState = "loading" | "ready" | "error";
type Confirm = "rotate" | "revoke" | null;

const NOT_SET = "Chưa cập nhật";

export function PersonalInfoView() {
  const [credential, setCredential] = useState<NovaCredential | null>(null);
  const [loadState, setLoadState] = useState<LoadState>(liveBackend ? "loading" : "ready");
  const [busy, setBusy] = useState<"issue" | "revoke" | null>(null);
  const busyRef = useRef(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  // The plaintext key lives only here, and only until the one-time dialog is acknowledged.
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState<string>("—");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  }, []);

  const load = useCallback(async () => {
    if (!liveBackend) return;
    setLoadState("loading");
    try {
      setCredential(await workspaceRequest<NovaCredential>(NOVA_CREDENTIALS_PATH));
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    load();
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "—");
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [load]);

  const copy = async (value: string, onDone: () => void) => {
    try {
      await navigator.clipboard.writeText(value);
      onDone();
    } catch {
      showNotice("Trình duyệt không cho phép sao chép. Hãy chọn và sao chép thủ công.");
    }
  };

  const runOnce = async (kind: "issue" | "revoke", action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(kind);
    try {
      await action();
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const issueKey = () =>
    runOnce("issue", async () => {
      try {
        const issued = await workspaceRequest<IssuedNovaKey>(NOVA_KEY_PATH, { method: "POST" });
        setCredential(issued.credential);
        setKeyCopied(false);
        setIssuedKey(issued.novaKey);
      } catch {
        showNotice("Không thể tạo Nova Key. Vui lòng thử lại.");
      }
    });

  const revokeKey = () =>
    runOnce("revoke", async () => {
      try {
        setCredential(await workspaceRequest<NovaCredential>(NOVA_KEY_PATH, { method: "DELETE" }));
        showNotice("Đã thu hồi Nova Key.");
      } catch {
        showNotice("Không thể thu hồi Nova Key. Vui lòng tải lại trang.");
      }
    });

  const acknowledgeKey = () => {
    setIssuedKey(null);
    setKeyCopied(false);
  };

  const keyStatus = credential?.key.status ?? "NOT_CREATED";
  const org = credential?.organization;
  const orgAvatar = proxiedMediaUrl(org?.avatarUrl);

  return (
    <div className="personal-info-view">
      {notice && (
        <div className="community-toast" role="status">
          <span>{notice}</span>
        </div>
      )}

      <header className="personal-info-account">
        <span className="avatar personal-info-avatar">{BUSINESS_REPRESENTATIVE.initials}</span>
        <div className="personal-info-account-copy">
          <h1>{BUSINESS_REPRESENTATIVE.name}</h1>
          <p>
            {BUSINESS_REPRESENTATIVE.role}
            {org ? ` · ${org.name}` : ""}
          </p>
          <p className="personal-info-muted">Email: chưa liên kết</p>
        </div>
        <span className="personal-info-pill neutral">Truy cập demo</span>
      </header>

      <section className="personal-info-section" aria-labelledby="pi-representative">
        <div className="personal-info-section-head">
          <h2 id="pi-representative">Thông tin người đại diện</h2>
          <span className="personal-info-muted">Chỉ xem · chưa hỗ trợ chỉnh sửa</span>
        </div>
        <dl className="personal-info-fields">
          <Field label="Họ và tên" value={BUSINESS_REPRESENTATIVE.name} />
          <Field label="Chức danh" value={BUSINESS_REPRESENTATIVE.role} />
          <Field label="Email công việc" value={NOT_SET} muted />
          <Field label="Số điện thoại" value={NOT_SET} muted />
          <Field label="Ngôn ngữ" value="Tiếng Việt" />
          <Field label="Múi giờ" value={timeZone} />
        </dl>
      </section>

      {!liveBackend ? (
        <section className="personal-info-section">
          <div className="personal-info-empty">
            <KeyRound size={22} />
            <p>Nova ID và Nova Key chỉ được cấp khi Nova Business kết nối với Nova backend.</p>
          </div>
        </section>
      ) : loadState === "loading" ? (
        <section className="personal-info-section" aria-busy="true">
          <div className="personal-info-empty">
            <Loader2 size={22} className="personal-info-spin" />
            <p>Đang tải định danh Nova…</p>
          </div>
        </section>
      ) : loadState === "error" || !credential || !org ? (
        <section className="personal-info-section">
          <div className="personal-info-empty" role="alert">
            <AlertTriangle size={22} />
            <p>Không tải được định danh Nova.</p>
            <button type="button" className="business-secondary-button" onClick={load}>
              <RefreshCw size={15} />
              Thử lại
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="personal-info-section" aria-labelledby="pi-organization">
            <div className="personal-info-section-head">
              <h2 id="pi-organization">Doanh nghiệp đang quản lý</h2>
            </div>
            <div className="personal-info-org">
              <span className="personal-info-org-logo">
                {orgAvatar ? <img src={orgAvatar} alt="" /> : <Building2 size={20} />}
              </span>
              <div className="personal-info-org-copy">
                <strong>
                  {org.name}
                  {org.verified && <BadgeCheck size={16} aria-label="Đã xác minh" />}
                </strong>
                <span>@{org.handle}</span>
                <span className="personal-info-muted">
                  {BUSINESS_REPRESENTATIVE.role} · {org.verified ? "Đã xác minh" : "Chưa xác minh"}
                </span>
              </div>
              <Link href="/business/profile" className="business-secondary-button personal-info-org-link">
                Xem trang doanh nghiệp
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </section>

          <section className="personal-info-section" aria-labelledby="pi-nova-id">
            <div className="personal-info-section-head">
              <h2 id="pi-nova-id">Định danh Nova</h2>
              <span className="personal-info-pill success">Đang hoạt động</span>
            </div>
            <p className="personal-info-help">
              Nova ID dùng để nhận diện Business khi kết nối các dịch vụ thuộc hệ sinh thái Nova. Đây là mã công
              khai, không phải mật khẩu và không đủ để đăng nhập một mình.
            </p>
            <div className="personal-info-id-row">
              <span className="personal-info-label">Nova ID</span>
              <code className="personal-info-code">{credential.novaId}</code>
              <button
                type="button"
                className="icon-button"
                title="Sao chép Nova ID"
                aria-label="Sao chép Nova ID"
                onClick={() => copy(credential.novaId, () => showNotice("Đã sao chép Nova ID."))}
              >
                <Copy size={16} />
              </button>
            </div>
            <dl className="personal-info-fields">
              <Field label="Ngày cấp" value={formatCredentialTime(credential.novaIdIssuedAt)} />
            </dl>
          </section>

          <section className="personal-info-section" aria-labelledby="pi-nova-key">
            <div className="personal-info-section-head">
              <h2 id="pi-nova-key">Khóa kết nối Nova</h2>
              <span className={`personal-info-pill ${keyStatus === "ACTIVE" ? "success" : keyStatus === "REVOKED" ? "danger" : "neutral"}`}>
                {novaKeyStatusLabel(keyStatus)}
              </span>
            </div>
            <p className="personal-info-help">
              Nova Key là khóa bí mật đi kèm Nova ID. Khóa chỉ hiển thị một lần khi tạo; Nova chỉ lưu bản băm.
            </p>
            {keyStatus === "ACTIVE" && (
              <dl className="personal-info-fields">
                <Field label="Khóa" value={maskedNovaKey(credential.key.hint)} mono />
                <Field label="Ngày tạo" value={formatCredentialTime(credential.key.createdAt)} />
                <Field label="Lần dùng gần nhất" value={credential.key.lastUsedAt ? formatCredentialTime(credential.key.lastUsedAt) : "Chưa sử dụng"} />
              </dl>
            )}
            {keyStatus === "REVOKED" && (
              <dl className="personal-info-fields">
                <Field label="Khóa đã thu hồi" value={maskedNovaKey(credential.key.hint)} mono />
                <Field label="Thu hồi lúc" value={formatCredentialTime(credential.key.revokedAt)} />
              </dl>
            )}
            <div className="personal-info-actions">
              <button
                type="button"
                className="business-primary-button"
                disabled={busy !== null}
                onClick={() => (issueKeyNeedsConfirmation(keyStatus) ? setConfirm("rotate") : issueKey())}
              >
                {busy === "issue" ? <Loader2 size={15} className="personal-info-spin" /> : <KeyRound size={15} />}
                {keyStatus === "ACTIVE" ? "Tạo khóa mới" : "Tạo Nova Key"}
              </button>
              {keyStatus === "ACTIVE" && (
                <button
                  type="button"
                  className="business-secondary-button personal-info-danger"
                  disabled={busy !== null}
                  onClick={() => setConfirm("revoke")}
                >
                  {busy === "revoke" ? <Loader2 size={15} className="personal-info-spin" /> : <ShieldOff size={15} />}
                  Thu hồi
                </button>
              )}
            </div>
          </section>

          <section className="personal-info-section" aria-labelledby="pi-security">
            <div className="personal-info-section-head">
              <h2 id="pi-security">Trạng thái bảo mật</h2>
            </div>
            <dl className="personal-info-fields">
              <Field label="Nova Key" value={novaKeyStatusLabel(keyStatus)} />
              <Field label="Thay đổi khóa gần nhất" value={formatCredentialTime(lastKeyChange(credential.key))} />
              <Field label="Email tài khoản" value="Chưa liên kết" muted />
              <Field label="Doanh nghiệp liên kết" value={`${org.name} · @${org.handle}`} />
            </dl>
            <p className="personal-info-help personal-info-note">
              <ShieldCheck size={15} />
              Quản lý khóa hiện được bảo vệ bởi khóa demo phía máy chủ. Cần xác thực thành viên Business trước khi
              dùng cho môi trường thật.
            </p>
          </section>
        </>
      )}

      <PortalDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={confirm === "revoke" ? "Thu hồi Nova Key?" : "Tạo khóa mới?"}
        description={
          confirm === "revoke"
            ? "Khóa hiện tại sẽ ngừng hoạt động ngay. Các dịch vụ đang dùng khóa này sẽ mất kết nối cho đến khi bạn tạo khóa mới."
            : "Khóa hiện tại sẽ ngừng hoạt động ngay khi khóa mới được tạo. Nova ID không thay đổi."
        }
      >
        <div className="personal-info-dialog-actions">
          <button type="button" className="business-secondary-button" onClick={() => setConfirm(null)}>
            Hủy
          </button>
          <button
            type="button"
            className={confirm === "revoke" ? "business-primary-button personal-info-danger-solid" : "business-primary-button"}
            disabled={busy !== null}
            onClick={() => {
              const action = confirm;
              setConfirm(null);
              if (action === "revoke") revokeKey();
              else issueKey();
            }}
          >
            {confirm === "revoke" ? "Thu hồi khóa" : "Tạo khóa mới"}
          </button>
        </div>
      </PortalDialog>

      <PortalDialog
        open={issuedKey !== null}
        onOpenChange={(open) => {
          if (!open) acknowledgeKey();
        }}
        dismissible={false}
        title="Nova Key mới"
        description="Sao chép và lưu khóa ở nơi an toàn trước khi đóng."
      >
        <div className="personal-info-key-dialog">
          <p className="personal-info-warning" role="alert">
            <AlertTriangle size={16} />
            Khóa này chỉ hiển thị một lần.
          </p>
          <div className="personal-info-secret-row">
            <code className="personal-info-secret">{issuedKey}</code>
            <button
              type="button"
              className="icon-button"
              title="Sao chép Nova Key"
              aria-label="Sao chép Nova Key"
              onClick={() => issuedKey && copy(issuedKey, () => setKeyCopied(true))}
            >
              {keyCopied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <p className="personal-info-muted" aria-live="polite">
            {keyCopied ? "Đã sao chép vào bộ nhớ tạm." : `Nova ID: ${credential?.novaId ?? ""}`}
          </p>
          <button type="button" className="business-primary-button personal-info-ack" onClick={acknowledgeKey}>
            Tôi đã lưu khóa
          </button>
        </div>
      </PortalDialog>
    </div>
  );
}

function Field({ label, value, muted, mono }: { label: string; value: string; muted?: boolean; mono?: boolean }) {
  return (
    <div className="personal-info-field">
      <dt>{label}</dt>
      <dd className={[muted ? "personal-info-muted" : "", mono ? "personal-info-mono" : ""].join(" ").trim() || undefined}>
        {value}
      </dd>
    </div>
  );
}
