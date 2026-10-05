"use client";

import { useEffect, useId, useState } from "react";
import { CalendarClock, ExternalLink, FileText, Info, Layers, ShieldCheck, Wallet, X, XCircle } from "lucide-react";
import {
  SIMULATION_NOTICE,
  businessStatusLabel,
  formatAmount,
  formatDate,
  statusTone,
  workspaceUrl,
  type ReplynProposal,
} from "@/lib/replyn-proposals";

/** A proposal inside the Nova conversation: a card of its own, never a text message. */
export function ProposalCard({ proposal, onOpen }: { proposal: ReplynProposal; onOpen: () => void }) {
  const tone = statusTone(proposal.status);
  return (
    <article className={`replyn-proposal-card tone-${tone}`} aria-label={`Đề xuất Replyn: ${proposal.projectName}`}>
      <header>
        <span className="replyn-proposal-badge"><ShieldCheck size={14} />Đề xuất Replyn</span>
        <span className={`replyn-status tone-${tone}`}>{businessStatusLabel(proposal.status)}</span>
      </header>
      <strong className="replyn-proposal-title">{proposal.projectName}</strong>
      <dl className="replyn-proposal-facts">
        <div><dt><Wallet size={14} />Ngân sách</dt><dd>{formatAmount(proposal.totalAmount, proposal.currency)}</dd></div>
        <div><dt><Layers size={14} />Milestone</dt><dd>{proposal.milestones.length}</dd></div>
        <div><dt><CalendarClock size={14} />Deadline</dt><dd>{formatDate(proposal.deadline)}</dd></div>
      </dl>
      <footer>
        <button type="button" className="business-secondary-button compact" onClick={onOpen}><FileText size={15} />Xem chi tiết</button>
        {proposal.status === "ACCEPTED" && proposal.workspaceId && (
          <a className="business-primary-button compact" href={workspaceUrl(proposal.workspaceId)} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={15} />Mở workspace Replyn
          </a>
        )}
      </footer>
    </article>
  );
}

interface DetailsProps {
  proposal: ReplynProposal;
  previous?: ReplynProposal;
  candidateName: string;
  demo: boolean;
  onCancel: () => Promise<string | null>;
  onClose: () => void;
}

/** Read-only agreement as sent; a pending proposal can only be withdrawn, not edited. */
export function ProposalDetailsDialog({ proposal, previous, candidateName, demo, onCancel, onClose }: DetailsProps) {
  const titleId = useId();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function cancel() {
    setBusy(true);
    setError(await onCancel());
    setBusy(false);
  }

  const tone = statusTone(proposal.status);
  return (
    <div className="action-dialog-backdrop" onClick={() => !busy && onClose()}>
      <section className="action-dialog-content replyn-proposal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <header className="action-dialog-header">
          <div className="action-dialog-icon-wrap primary"><ShieldCheck size={22} /></div>
          <div className="replyn-confirm-text">
            <h3 id={titleId} className="action-dialog-title">{proposal.projectName}</h3>
            <p className="action-dialog-desc">
              Đề xuất Replyn gửi {candidateName}
              {proposal.sentAt ? ` · ${new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(proposal.sentAt))}` : ""}
              {demo ? " · Dữ liệu minh họa" : ""}
            </p>
          </div>
          <button type="button" className="action-dialog-close" onClick={onClose} disabled={busy} aria-label="Đóng"><X size={18} /></button>
        </header>
        <div className="replyn-proposal-body">
          <p className={`replyn-status tone-${tone} block`}>{businessStatusLabel(proposal.status)}</p>
          {proposal.status === "REJECTED" && (
            <p className="replyn-detail-note">Lý do: {proposal.rejectionReason || "Ứng viên không để lại lý do."}</p>
          )}
          {proposal.status === "PENDING" && proposal.expiresAt && (
            <p className="replyn-detail-note">Hết hạn nếu chưa phản hồi trước {formatDate(proposal.expiresAt)}.</p>
          )}
          {previous && <p className="replyn-detail-note">Phiên bản mới của đề xuất “{previous.projectName}” ({businessStatusLabel(previous.status).toLowerCase()}).</p>}

          <h4>Phạm vi công việc</h4>
          <p className="replyn-detail-text">{proposal.scope}</p>
          <h4>Sản phẩm bàn giao</h4>
          <ul className="replyn-detail-list">{proposal.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
          <dl className="replyn-detail-grid">
            <div><dt>Ngân sách</dt><dd>{formatAmount(proposal.totalAmount, proposal.currency)}</dd></div>
            <div><dt>Bắt đầu</dt><dd>{formatDate(proposal.startDate)}</dd></div>
            <div><dt>Deadline</dt><dd>{formatDate(proposal.deadline)}</dd></div>
            <div><dt>Số lần chỉnh sửa</dt><dd>{proposal.revisionLimit ?? "—"}</dd></div>
            <div><dt>Nghiệm thu</dt><dd>{proposal.reviewPeriodDays ? `${proposal.reviewPeriodDays} ngày` : "—"}</dd></div>
          </dl>
          <h4>Milestone</h4>
          <ol className="replyn-detail-milestones">
            {proposal.milestones.map((m, i) => (
              <li key={i}><span>{m.title}</span><span>{formatAmount(m.amount, proposal.currency)}</span><span>{formatDate(m.deadline)}</span></li>
            ))}
          </ol>
          {proposal.notes && (<><h4>Ghi chú</h4><p className="replyn-detail-text">{proposal.notes}</p></>)}
          <p className="replyn-simulation"><Info size={15} />{SIMULATION_NOTICE}</p>
          {error && <p className="replyn-form-error" role="alert">{error}</p>}
        </div>
        <footer className="action-dialog-footer">
          {proposal.status === "PENDING" && !confirming && (
            <button type="button" className="action-dialog-btn secondary danger-text" onClick={() => setConfirming(true)}><XCircle size={16} />Hủy đề xuất</button>
          )}
          {confirming && (
            <>
              <span className="replyn-confirm-inline">Hủy đề xuất này? Ứng viên sẽ thấy đề xuất đã bị hủy.</span>
              <button type="button" className="action-dialog-btn secondary" onClick={() => setConfirming(false)} disabled={busy}>Không</button>
              <button type="button" className="action-dialog-btn danger" onClick={cancel} disabled={busy}>{busy ? "Đang hủy…" : "Hủy đề xuất"}</button>
            </>
          )}
          {proposal.status === "ACCEPTED" && proposal.workspaceId && (
            <a className="action-dialog-btn primary" href={workspaceUrl(proposal.workspaceId)} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} />Mở workspace Replyn</a>
          )}
          {!confirming && <button type="button" className="action-dialog-btn secondary" onClick={onClose}>Đóng</button>}
        </footer>
      </section>
    </div>
  );
}
