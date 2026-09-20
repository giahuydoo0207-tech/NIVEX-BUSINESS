"use client";

import { FormEvent, useState } from "react";
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

export function InvoiceAmountForm({
  initialContractorId,
}: {
  initialContractorId?: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [contractorId, setContractorId] = useState(
    demoContractors.find((item) => item.id === initialContractorId)?.id ??
      demoContractors[0].id,
  );
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const parsedAmount = parseUsdcToMinor(amount);
  const selectedContractor =
    demoContractors.find((item) => item.id === contractorId) ?? demoContractors[0];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parsedAmount.ok) return setError(parsedAmount.message);
    if (!description.trim())
      return setError("Nhập nội dung công việc hoặc dịch vụ.");
    if (!dueDate) return setError("Chọn hạn thanh toán cho hóa đơn.");

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
            <span>Người nhận</span>
            <select
              aria-label="Người nhận"
              value={contractorId}
              onChange={(event) => setContractorId(event.target.value)}
            >
              {demoContractors.map((contractor) => (
                <option value={contractor.id} key={contractor.id}>
                  {contractor.displayName} · {contractor.role}
                </option>
              ))}
            </select>
          </label>
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
                value={dueDate}
                onChange={(event) => {
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
        <h2>{selectedContractor.displayName}</h2>
        <p>{selectedContractor.role} · Solana Devnet</p>
        <strong className="job-preview-budget">
          {amount && parsedAmount.ok
            ? formatUsdc(parsedAmount.minor)
            : "0 USDC"}
        </strong>
        <dl>
          <div>
            <dt>Người nhận</dt>
            <dd>{selectedContractor.displayName}</dd>
          </div>
          <div>
            <dt>Hạn thanh toán</dt>
            <dd>{dueDate || "Chưa đặt"}</dd>
          </div>
          <div>
            <dt>Mạng xử lý</dt>
            <dd>Solana Devnet</dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>Chờ thanh toán</dd>
          </div>
        </dl>
        <div className="job-publish-assurance">
          <ShieldCheck size={18} />
          <span>
            Kiểm tra người nhận và số tiền trước khi tiếp tục. Hóa đơn thử
            nghiệm được lưu trên trình duyệt này.
          </span>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="business-primary-button wide" type="submit">
          <span>Tạo yêu cầu thanh toán</span>
          <ArrowRight size={18} />
        </button>
      </aside>
    </form>
  );
}
