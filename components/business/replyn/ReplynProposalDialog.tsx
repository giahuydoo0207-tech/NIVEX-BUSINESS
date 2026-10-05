"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { Info, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import {
  SIMULATION_NOTICE,
  formatAmount,
  payload,
  todayIso,
  validate,
  type FieldErrors,
  type ProposalForm,
} from "@/lib/replyn-proposals";

export type ProposalSubmit = (form: ProposalForm, send: boolean) => Promise<{ ok: true } | { ok: false; message: string; errors?: FieldErrors }>;

interface Props {
  candidateName: string;
  initial: ProposalForm;
  /** A saved draft can be discarded; a new form is only closed. */
  hasDraft: boolean;
  replacesRejected: boolean;
  onSubmit: ProposalSubmit;
  onDiscardDraft: () => void;
  onClose: () => void;
}

/**
 * Drafts and sends a Replyn proposal. Once sent the agreement cannot be edited, so the form says so
 * next to the send button; a change later means withdrawing it and sending a new version.
 */
export function ReplynProposalDialog({ candidateName, initial, hasDraft, replacesRejected, onSubmit, onDiscardDraft, onClose }: Props) {
  const titleId = useId();
  const [form, setForm] = useState<ProposalForm>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touchedSend, setTouchedSend] = useState(false);
  const [busy, setBusy] = useState<"draft" | "send" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  // After a failed send, errors follow the edits so a fixed field clears at once.
  useEffect(() => {
    if (touchedSend) setErrors(validate(form, true));
  }, [form, touchedSend]);

  const allocated = useMemo(() => {
    const body = payload(form);
    return body.milestones.reduce((sum, m) => sum + (m.amount && Number.isFinite(m.amount) ? m.amount : 0), 0);
  }, [form]);
  const total = payload(form).totalAmount;

  const set = <K extends keyof ProposalForm>(key: K, value: ProposalForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setMilestone = (index: number, patch: Partial<ProposalForm["milestones"][number]>) =>
    set("milestones", form.milestones.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  const setDeliverable = (index: number, value: string) => set("deliverables", form.deliverables.map((d, i) => (i === index ? value : d)));

  async function submit(send: boolean) {
    const found = validate(form, send);
    if (send) setTouchedSend(true);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) {
      setFormError(send ? "Hãy sửa các trường được đánh dấu trước khi gửi." : null);
      document.querySelector<HTMLElement>(`[data-field="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    setBusy(send ? "send" : "draft");
    const result = await onSubmit(form, send);
    setBusy(null);
    if (!result.ok) {
      setFormError(result.message);
      if (result.errors) setErrors(result.errors);
    }
  }

  const err = (key: string) => errors[key];

  return (
    <div className="action-dialog-backdrop" onClick={() => !busy && onClose()}>
      <section className="action-dialog-content replyn-proposal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <header className="action-dialog-header">
          <div className="action-dialog-icon-wrap primary"><ShieldCheck size={22} /></div>
          <div className="replyn-confirm-text">
            <h3 id={titleId} className="action-dialog-title">Đề xuất Replyn cho {candidateName}</h3>
            <p className="action-dialog-desc">
              {replacesRejected ? "Phiên bản mới thay cho đề xuất trước; lịch sử vẫn được giữ trong cuộc trò chuyện. " : ""}
              Ứng viên xem và chấp nhận trên Nova Mobile. Chỉ sau khi được chấp nhận, hai bên mới mở cùng một workspace Replyn.
            </p>
          </div>
          <button type="button" className="action-dialog-close" onClick={onClose} disabled={!!busy} aria-label="Đóng"><X size={18} /></button>
        </header>

        <div className="replyn-proposal-body">
          <p className="replyn-simulation"><Info size={15} />{SIMULATION_NOTICE}</p>

          <Field id="projectName" label="Tên dự án" required error={err("projectName")}>
            <input data-field="projectName" id="projectName" value={form.projectName} maxLength={160} onChange={(e) => set("projectName", e.target.value)} aria-invalid={!!err("projectName")} />
          </Field>
          <Field id="scope" label="Mô tả / phạm vi công việc" required error={err("scope")}>
            <textarea data-field="scope" id="scope" rows={4} value={form.scope} maxLength={4000} onChange={(e) => set("scope", e.target.value)} aria-invalid={!!err("scope")} />
          </Field>

          <fieldset className="replyn-fieldset" data-field="deliverables" tabIndex={-1}>
            <legend>Sản phẩm bàn giao <span aria-hidden>*</span></legend>
            {form.deliverables.map((item, index) => (
              <div className="replyn-row" key={index}>
                <input value={item} maxLength={300} placeholder={`Sản phẩm ${index + 1}`} aria-label={`Sản phẩm bàn giao ${index + 1}`} onChange={(e) => setDeliverable(index, e.target.value)} />
                {form.deliverables.length > 1 && (
                  <button type="button" className="icon-button" aria-label={`Xóa sản phẩm ${index + 1}`} onClick={() => set("deliverables", form.deliverables.filter((_, i) => i !== index))}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
            {err("deliverables") && <p className="replyn-field-error" role="alert">{err("deliverables")}</p>}
            {form.deliverables.length < 20 && (
              <button type="button" className="replyn-add" onClick={() => set("deliverables", [...form.deliverables, ""])}><Plus size={15} />Thêm sản phẩm</button>
            )}
          </fieldset>

          <div className="replyn-grid">
            <Field id="startDate" label="Ngày bắt đầu dự kiến" error={err("startDate")}>
              <input data-field="startDate" id="startDate" type="date" min={todayIso()} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} aria-invalid={!!err("startDate")} />
            </Field>
            <Field id="deadline" label="Deadline" required error={err("deadline")}>
              <input data-field="deadline" id="deadline" type="date" min={form.startDate || todayIso()} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} aria-invalid={!!err("deadline")} />
            </Field>
            <Field id="revisionLimit" label="Số lần chỉnh sửa" required error={err("revisionLimit")}>
              <input data-field="revisionLimit" id="revisionLimit" type="number" min={0} max={20} step={1} value={form.revisionLimit} onChange={(e) => set("revisionLimit", e.target.value)} aria-invalid={!!err("revisionLimit")} />
            </Field>
            <Field id="reviewPeriodDays" label="Thời gian nghiệm thu (ngày)" required error={err("reviewPeriodDays")}>
              <input data-field="reviewPeriodDays" id="reviewPeriodDays" type="number" min={1} max={30} step={1} value={form.reviewPeriodDays} onChange={(e) => set("reviewPeriodDays", e.target.value)} aria-invalid={!!err("reviewPeriodDays")} />
            </Field>
            <Field id="totalAmount" label="Tổng ngân sách" required error={err("totalAmount")}>
              <input data-field="totalAmount" id="totalAmount" inputMode="decimal" value={form.totalAmount} onChange={(e) => set("totalAmount", e.target.value)} placeholder="2500" aria-invalid={!!err("totalAmount")} />
            </Field>
            <Field id="currency" label="Đơn vị tiền tệ" error={err("currency")}>
              <select id="currency" value={form.currency} onChange={() => set("currency", "USDC")}>
                <option value="USDC">USDC (mô phỏng)</option>
              </select>
            </Field>
          </div>

          <fieldset className="replyn-fieldset" data-field="milestones" tabIndex={-1}>
            <legend>Milestone <span aria-hidden>*</span></legend>
            {form.milestones.map((m, index) => {
              const key = `milestones.${index}.`;
              return (
                <div className="replyn-milestone" key={index}>
                  <span className="replyn-milestone-index">{index + 1}</span>
                  <div className="replyn-milestone-fields">
                    <label>
                      <span>Tên milestone</span>
                      <input data-field={`${key}title`} value={m.title} maxLength={160} onChange={(e) => setMilestone(index, { title: e.target.value })} aria-invalid={!!err(`${key}title`)} />
                      {err(`${key}title`) && <small className="replyn-field-error">{err(`${key}title`)}</small>}
                    </label>
                    <label>
                      <span>Số tiền</span>
                      <input data-field={`${key}amount`} inputMode="decimal" value={m.amount} onChange={(e) => setMilestone(index, { amount: e.target.value })} aria-invalid={!!err(`${key}amount`)} />
                      {err(`${key}amount`) && <small className="replyn-field-error">{err(`${key}amount`)}</small>}
                    </label>
                    <label>
                      <span>Deadline</span>
                      <input data-field={`${key}deadline`} type="date" value={m.deadline} min={form.startDate || todayIso()} max={form.deadline || undefined} onChange={(e) => setMilestone(index, { deadline: e.target.value })} aria-invalid={!!err(`${key}deadline`)} />
                      {err(`${key}deadline`) && <small className="replyn-field-error">{err(`${key}deadline`)}</small>}
                    </label>
                  </div>
                  {form.milestones.length > 1 && (
                    <button type="button" className="icon-button" aria-label={`Xóa milestone ${index + 1}`} onClick={() => set("milestones", form.milestones.filter((_, i) => i !== index))}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
            <div className="replyn-allocation" aria-live="polite">
              Đã phân bổ {formatAmount(allocated)} / {total && Number.isFinite(total) ? formatAmount(total) : "—"}
            </div>
            {err("milestones") && <p className="replyn-field-error" role="alert">{err("milestones")}</p>}
            {form.milestones.length < 10 && (
              <button type="button" className="replyn-add" onClick={() => set("milestones", [...form.milestones, { title: "", amount: "", deadline: "" }])}><Plus size={15} />Thêm milestone</button>
            )}
          </fieldset>

          <Field id="notes" label="Ghi chú bổ sung" error={err("notes")}>
            <textarea data-field="notes" id="notes" rows={3} value={form.notes} maxLength={2000} onChange={(e) => set("notes", e.target.value)} />
          </Field>
          {formError && <p className="replyn-form-error" role="alert">{formError}</p>}
        </div>

        <footer className="action-dialog-footer replyn-proposal-footer">
          <small>Sau khi gửi, đề xuất không thể chỉnh sửa. Muốn thay đổi, hãy hủy và gửi phiên bản mới.</small>
          <div>
            {hasDraft && (
              <button type="button" className="action-dialog-btn secondary danger-text" onClick={onDiscardDraft} disabled={!!busy}>Bỏ bản nháp</button>
            )}
            <button type="button" className="action-dialog-btn secondary" onClick={() => submit(false)} disabled={!!busy}>
              {busy === "draft" ? "Đang lưu…" : "Lưu nháp"}
            </button>
            <button type="button" className="action-dialog-btn primary" onClick={() => submit(true)} disabled={!!busy}>
              {busy === "send" ? "Đang gửi…" : "Gửi đề xuất"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className={`replyn-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden> *</span>}</label>
      {children}
      {error && <small className="replyn-field-error" role="alert">{error}</small>}
    </div>
  );
}
