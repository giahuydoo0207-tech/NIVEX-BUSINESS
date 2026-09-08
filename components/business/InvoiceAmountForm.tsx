"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, FileText, ShieldCheck } from "lucide-react";
import { demoContractors, demoOrganization } from "@/lib/business-demo-data";
import { formatUsdc, parseUsdcToMinor } from "@/lib/money";
import type { Invoice } from "@/types/invoice";

export function InvoiceAmountForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [contractorId, setContractorId] = useState(demoContractors[0].id);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const parsedAmount = parseUsdcToMinor(amount);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parsedAmount.ok) return setError(parsedAmount.message);
    if (!description.trim()) return setError("Nhập nội dung công việc hoặc dịch vụ.");
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
      invoiceNumber: `NVX-${new Date().getFullYear()}-${randomPart.slice(0, 5)}`,
      paymentRequestId: `pay-${randomPart.toLowerCase()}`,
      status: "AWAITING_PAYMENT",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(`nivex.demo.invoice.${invoice.paymentRequestId}`, JSON.stringify(invoice));
    router.push(`/pay/${invoice.paymentRequestId}`);
  }

  return (
    <form className="invoice-form" onSubmit={submit}>
      <section className="invoice-form-main">
        <div className="section-heading"><FileText size={20} /><div><h2>Thông tin hóa đơn</h2><p>Thông tin này sẽ xuất hiện trên trang thanh toán.</p></div></div>
        <div className="form-grid">
          <label className="field full"><span>Người nhận</span><select value={contractorId} onChange={(event) => setContractorId(event.target.value)}>{demoContractors.map((contractor) => <option value={contractor.id} key={contractor.id}>{contractor.displayName} · {contractor.role}</option>)}</select></label>
          <label className="field full"><span>Nội dung công việc</span><textarea rows={4} value={description} onChange={(event) => { setDescription(event.target.value); setError(""); }} placeholder="Ví dụ: Phát triển ứng dụng Flutter tháng 09/2026" /></label>
          <label className="field full"><span>Số tiền</span><div className="amount-field"><input inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setError(""); }} placeholder="0.00" aria-describedby="amount-help" /><strong>USDC</strong></div><small id="amount-help">Nhập số bất kỳ lớn hơn 0, tối đa 6 chữ số thập phân.</small></label>
          <label className="field full"><span>Hạn thanh toán</span><div className="field-with-icon"><CalendarDays size={18} /><input type="date" value={dueDate} onChange={(event) => { setDueDate(event.target.value); setError(""); }} /></div></label>
        </div>
      </section>
      <aside className="invoice-summary">
        <p className="eyebrow">XEM TRƯỚC</p>
        <h2>{amount && parsedAmount.ok ? formatUsdc(parsedAmount.minor) : "0 USDC"}</h2>
        <dl><div><dt>Mạng</dt><dd>Solana Devnet</dd></div><div><dt>Trạng thái</dt><dd>Chờ thanh toán</dd></div><div><dt>Phí</dt><dd>Hiển thị trước khi ký</dd></div></dl>
        <div className="summary-assurance"><ShieldCheck size={18} /><span>Backend sẽ đối chiếu đúng mint, số tiền, người nhận và reference.</span></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="business-primary-button wide" type="submit">Tạo payment link<ArrowRight size={18} /></button>
      </aside>
    </form>
  );
}
