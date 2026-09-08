import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BusinessShell } from "@/components/business/BusinessShell";
import { demoContractors } from "@/lib/business-demo-data";

export default function ContractorsPage() {
  return (
    <BusinessShell active="contractors">
      <div className="page-heading-row"><div><p className="eyebrow">NHÂN SỰ</p><h1>Contractor đã liên kết</h1><p>Kiểm tra danh tính và khả năng nhận payout trước khi thanh toán.</p></div><span className="feature-status">Mời contractor: sắp có</span></div>
      <section className="contractor-grid">
        {demoContractors.map((contractor) => <article className="contractor-card" key={contractor.id}><div className="contractor-profile"><i>{contractor.displayName.slice(0, 1)}</i><div><h2>{contractor.displayName}</h2><p>{contractor.role} · Việt Nam</p></div></div><div className="verification-list"><span><ShieldCheck size={17} />Email đã xác minh</span><span><ShieldCheck size={17} />{contractor.verificationStatus === "IDENTITY_VERIFIED" ? "Danh tính đã xác minh" : "Thông tin cơ bản đã xác minh"}</span><span className={contractor.payoutReadiness === "READY" ? "ready-text" : "attention-text"}>{contractor.payoutReadiness === "READY" ? "Tài khoản nhận VND sẵn sàng" : "Cần bổ sung tài khoản nhận VND"}</span></div><Link className="business-secondary-button" href="/business/invoices/new">Tạo hóa đơn</Link></article>)}
      </section>
    </BusinessShell>
  );
}
