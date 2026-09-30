"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CreditCard,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { demoContractors, demoOrganization } from "@/lib/business-demo-data";
import { formatUsdc, parseUsdcToMinor } from "@/lib/money";
import type { Invoice } from "@/types/invoice";
import { devnetApi, DevnetApiError } from "@/lib/devnet-api";
import { isFutureInvoiceDueDate, minimumInvoiceDueDate } from "@/lib/invoice-due-date";
import { liveBackend, proxiedMediaUrl, workspaceRequest } from "@/lib/workspace-api";
import { normalizeApplicationStatus, statusCopy } from "@/lib/application-status";
import {
  parseRecipients, paymentBlockReason, readinessLabel, shortAddress, walletErrorMessage,
  type PayoutReadiness,
} from "@/lib/payout-wallet";

type RecipientOption = {
  id: string;
  applicationId?: string;
  displayName: string;
  subtitle: string;
  avatarUrl?: string;
  /** Live backend only. */
  applicationStatus?: string;
  payoutReadiness?: PayoutReadiness;
  walletAddress?: string | null;
};

const demoRecipients: RecipientOption[] = demoContractors.map((item) => ({
  id: item.id,
  displayName: item.displayName,
  subtitle: item.role,
}));

export function InvoiceAmountForm({
  initialContractorId,
}: {
  initialContractorId?: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  // Live: only accepted candidates from the backend; never the demo list.
  const [recipients, setRecipients] = useState<RecipientOption[] | null>(liveBackend ? null : demoRecipients);
  const [recipientsError, setRecipientsError] = useState("");
  const [contractorId, setContractorId] = useState(
    liveBackend
      ? ""
      : demoContractors.find((item) => item.id === initialContractorId)?.id ?? demoContractors[0].id,
  );
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const retry = useRef<{ body: string; key: string } | null>(null);
  const devnet = liveBackend;

  useEffect(() => {
    if (!liveBackend) return;
    let cancelled = false;
    workspaceRequest<unknown>("business/recipients")
      .then((value) => {
        if (cancelled) return;
        const options = parseRecipients(value).map((row) => ({
          id: row.contractorId,
          applicationId: row.applicationId,
          displayName: row.displayName,
          subtitle: row.jobTitle,
          avatarUrl: proxiedMediaUrl(row.avatarUrl),
          applicationStatus: row.applicationStatus,
          payoutReadiness: row.payoutReadiness,
          walletAddress: row.walletAddress,
        }));
        setRecipients(options);
        setContractorId(
          options.find((item) => item.id === initialContractorId)?.id ?? options[0]?.id ?? "",
        );
      })
      .catch((reason) => {
        if (!cancelled) setRecipientsError(reason instanceof Error ? reason.message : "Không tải được danh sách người nhận.");
      });
    return () => {
      cancelled = true;
    };
  }, [initialContractorId]);

  const parsedAmount = parseUsdcToMinor(amount);
  const selectedContractor = recipients?.find((item) => item.id === contractorId) ?? null;
  // Live: a draft may be saved for anyone accepted; a payment request needs a ready wallet.
  const walletBlock = devnet && selectedContractor ? paymentBlockReason(selectedContractor) : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedContractor) return setError("Chọn người nhận hóa đơn.");
    if (!parsedAmount.ok) return setError(parsedAmount.message);
    if (!description.trim())
      return setError("Nhập nội dung công việc hoặc dịch vụ.");
    if (!dueDate) return setError("Chọn hạn thanh toán cho hóa đơn.");
    if (devnet && !isFutureInvoiceDueDate(dueDate))
      return setError("Hạn thanh toán phải sau hôm nay. Vui lòng chọn từ ngày mai trở đi.");

    if (devnet) {
      if (pending.current) return;
      pending.current = true; setBusy(true); setError("");
      const body = {
        contractorId,
        applicationId: selectedContractor.applicationId,
        description: description.trim(),
        amountMinor: parsedAmount.minor,
        dueDate,
      };
      const serialized = JSON.stringify(body);
      if (retry.current?.body !== serialized) retry.current = { body: serialized, key: crypto.randomUUID() };
      let draftSaved = false;
      try {
        const created = await devnetApi<{ id: string }>("invoices", body, retry.current.key);
        draftSaved = true;
        if (walletBlock) {
          router.push("/business/invoices");
          return;
        }
        const issued = await devnetApi<{ paymentRequest: { id: string } }>(`invoices/${created.id}/issue`, {}, `issue-${created.id}`);
        router.push(`/pay/${issued.paymentRequest.id}`);
      } catch (e) {
        const message = e instanceof DevnetApiError ? walletErrorMessage(e.code, e.message)
          : e instanceof Error ? e.message : "Không tạo được hóa đơn.";
        setError(draftSaved ? `${message} Hóa đơn đã được lưu ở dạng nháp.` : message);
      }
      finally { pending.current = false; setBusy(false); }
      return;
    }

    const randomPart = crypto.randomUUID().slice(0, 8).toUpperCase();
    const invoice: Invoice = {
      id: `invoice-${randomPart.toLowerCase()}`,
      organizationId: demoOrganization.id,
      contractorId,
      description: description.trim(),
      sourceAmountMinor: parsedAmount.minor,
      sourceCurrency: "USDC",
      dueDate,
      invoiceNumber: `NOVA-${new Date().getFullYear()}-${randomPart.slice(0, 5)}`,
      paymentRequestId: `pay-${randomPart.toLowerCase()}`,
      status: "AWAITING_PAYMENT",
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        `nivex.demo.invoice.${invoice.paymentRequestId}`,
        JSON.stringify(invoice),
      );
    } catch {
      return setError(
        "Không lưu được hóa đơn. Kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt.",
      );
    }
    router.push(`/pay/${invoice.paymentRequestId}`);
  }

  return (
    <form className="invoice-form" onSubmit={submit}>
      <section className="invoice-form-main">
        <div className="form-back-nav">
          <Link href="/business/invoices" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Quay lại danh sách hóa đơn</span>
          </Link>
        </div>

        <div className="section-heading">
          <FileText size={20} />
          <div>
            <h2>Thông tin người nhận & dịch vụ</h2>
            <p>Chọn đối tác nhận thanh toán và tóm tắt nội dung công việc.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="field full">
            <span>{devnet ? "Ứng viên đã được nhận" : "Người nhận"}</span>
            {recipientsError ? (
              <p className="form-error" role="alert">{recipientsError}</p>
            ) : recipients === null ? (
              <small>Đang tải người nhận…</small>
            ) : recipients.length === 0 ? (
              <p className="completion-tip">
                Chưa có ứng viên được nhận để tạo hóa đơn.{" "}
                <Link href="/business/applications">Xem ứng viên</Link>
              </p>
            ) : devnet ? null : (
              <select
                aria-label="Người nhận"
                value={contractorId}
                onChange={(event) => setContractorId(event.target.value)}
              >
                {recipients.map((recipient) => (
                  <option value={recipient.id} key={recipient.id}>
                    {recipient.displayName} · {recipient.subtitle}
                  </option>
                ))}
              </select>
            )}
          </label>
          {devnet && recipients && recipients.length > 0 && (
            <fieldset className="field full recipient-choice-list">
              <legend className="sr-only">Người nhận</legend>
              {recipients.map((recipient) => {
                const status = normalizeApplicationStatus(recipient.applicationStatus ?? "");
                const ready = recipient.payoutReadiness === "READY";
                return (
                  <label className="recipient-choice" key={recipient.id}>
                    <input
                      type="radio"
                      name="recipient"
                      value={recipient.id}
                      checked={recipient.id === contractorId}
                      onChange={() => { setContractorId(recipient.id); setError(""); }}
                    />
                    {recipient.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={recipient.avatarUrl} alt="" />
                    ) : (
                      <span className="recipient-initial" aria-hidden="true">{recipient.displayName.slice(0, 1)}</span>
                    )}
                    <span>
                      <strong>{recipient.displayName}</strong>
                      <small>
                        {recipient.subtitle} · {status ? statusCopy[status].label : recipient.applicationStatus}
                      </small>
                    </span>
                    <span className={"status-badge " + (ready ? "success" : "warning")}>
                      {readinessLabel(recipient.payoutReadiness ?? "NOT_CONFIGURED")}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}
          <label className="field full">
            <span>Nội dung công việc</span>
            <textarea
              rows={4}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setError("");
              }}
              placeholder="Ví dụ: Phát triển ứng dụng Flutter tháng 09/2026"
            />
          </label>
        </div>

        <div className="job-form-divider" />

        <div className="section-heading">
          <CreditCard size={20} />
          <div>
            <h2>Số tiền & thời hạn thanh toán</h2>
            <p>Khoản thanh toán bằng USDC sẽ được chuyển trực tiếp trên mạng Solana Devnet.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="field invoice-amount-field">
            <span>Số tiền</span>
            <div className="amount-field">
              <input
                aria-label="Số tiền"
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
                placeholder="0.00"
                aria-describedby="amount-help"
              />
              <strong>USDC</strong>
            </div>
            <small id="amount-help">
              Nhập số bất kỳ lớn hơn 0, tối đa 6 chữ số thập phân.
            </small>
          </label>
          <label className="field invoice-due-date-field">
            <span>Hạn thanh toán</span>
            <div className="field-with-icon">
              <CalendarDays size={18} />
              <input
                type="date"
                min={devnet ? minimumInvoiceDueDate() : undefined}
                value={dueDate}
                onInvalid={(event) => event.currentTarget.setCustomValidity("Hạn thanh toán phải sau hôm nay. Vui lòng chọn từ ngày mai trở đi.")}
                onChange={(event) => {
                  event.target.setCustomValidity("");
                  setDueDate(event.target.value);
                  setError("");
                }}
              />
            </div>
          </label>
        </div>
      </section>

      <aside className="invoice-summary">
        <div className="job-preview-status">
          <i /> BẢN XEM TRƯỚC HÓA ĐƠN
        </div>
        {selectedContractor?.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="invoice-recipient-avatar" src={selectedContractor.avatarUrl} alt="" />
        )}
        <h2>{selectedContractor?.displayName ?? "Chưa chọn người nhận"}</h2>
        <p>{selectedContractor ? `${selectedContractor.subtitle} · Solana Devnet` : "Solana Devnet"}</p>
        <strong className="job-preview-budget">
          {amount && parsedAmount.ok
            ? formatUsdc(parsedAmount.minor)
            : "0 USDC"}
        </strong>
        <dl>
          <div>
            <dt>Người nhận</dt>
            <dd>{selectedContractor?.displayName ?? "—"}</dd>
          </div>
          <div>
            <dt>Hạn thanh toán</dt>
            <dd>{dueDate || "Chưa đặt"}</dd>
          </div>
          <div>
            <dt>Mạng xử lý</dt>
            <dd>Solana Devnet</dd>
          </div>
          {devnet && selectedContractor && (
            <div>
              <dt>Ví nhận USDC</dt>
              <dd className={selectedContractor.walletAddress ? "mono" : undefined} title={selectedContractor.walletAddress ?? undefined}>
                {selectedContractor.walletAddress
                  ? shortAddress(selectedContractor.walletAddress)
                  : readinessLabel(selectedContractor.payoutReadiness ?? "NOT_CONFIGURED")}
              </dd>
            </div>
          )}
          <div>
            <dt>Trạng thái</dt>
            <dd>{walletBlock ? "Bản nháp" : "Chờ thanh toán"}</dd>
          </div>
        </dl>
        <div className="job-publish-assurance">
          <ShieldCheck size={18} />
          <span>
            {devnet ? "Hóa đơn được lưu ở backend. Bước tiếp theo hiển thị ví nhận của ứng viên, token và mạng để bạn kiểm tra trước khi ký trên Devnet." : "Kiểm tra người nhận và số tiền trước khi tiếp tục. Hóa đơn thử nghiệm được lưu trên trình duyệt này."}
          </span>
        </div>
        {walletBlock && (
          <p className="form-error" role="status">
            {walletBlock} Bạn có thể lưu hóa đơn nháp và tạo yêu cầu thanh toán sau khi ứng viên thêm ví trong ứng dụng Nova.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="business-primary-button wide" type="submit" disabled={busy || !selectedContractor}>
          <span>{walletBlock ? "Lưu hóa đơn nháp" : "Tạo yêu cầu thanh toán"}</span>
          <ArrowRight size={18} />
        </button>
      </aside>
    </form>
  );
}
