import Link from "next/link";
import { ArrowRight, CircleAlert, FilePlus2, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import { BusinessShell } from "@/components/business/BusinessShell";
import { demoContractors } from "@/lib/business-demo-data";

export default function BusinessDashboardPage() {
  return (
    <BusinessShell active="dashboard">
      <div className="page-heading-row"><div><p className="eyebrow">TỔNG QUAN</p><h1>Thanh toán contractor</h1><p>Theo dõi hóa đơn, phê duyệt và thanh toán USDC từ một nơi.</p></div><Link className="business-primary-button" href="/business/invoices/new"><FilePlus2 size={18} />Tạo hóa đơn</Link></div>
      <section className="kyb-banner"><CircleAlert size={21} /><div><strong>Hồ sơ tổ chức đang được xem xét</strong><p>KYB đang ở chế độ thử nghiệm. Quy trình bổ sung hồ sơ sẽ được kết nối ở giai đoạn tiếp theo.</p></div><span className="kyb-status">Đang xem xét</span></section>
      <section className="metric-grid">
        <article><span><FilePlus2 size={19} /></span><p>Chờ thanh toán</p><strong>0</strong><small>hóa đơn</small></article>
        <article><span><UsersRound size={19} /></span><p>Contractor</p><strong>{demoContractors.length}</strong><small>đang liên kết</small></article>
        <article><span><ShieldCheck size={19} /></span><p>Chờ phê duyệt</p><strong>0</strong><small>giao dịch</small></article>
        <article><span><WalletCards size={19} /></span><p>Ví thanh toán</p><strong>Chưa nối</strong><small>Solana Devnet</small></article>
      </section>
      <section className="business-table-section">
        <div className="section-heading-row"><div><h2>Contractor gần đây</h2><p>Thông tin tối thiểu đã được người nhận đồng ý chia sẻ.</p></div><Link href="/business/contractors">Xem tất cả<ArrowRight size={16} /></Link></div>
        <div className="business-table" role="table" aria-label="Danh sách contractor">
          <div className="business-table-head" role="row"><span>Người nhận</span><span>Xác minh</span><span>Payout</span><span /></div>
          {demoContractors.map((contractor) => <div className="business-table-row" role="row" key={contractor.id}><span><i>{contractor.displayName.slice(0, 1)}</i><span><strong>{contractor.displayName}</strong><small>{contractor.role} · Việt Nam</small></span></span><span className="verified-text"><ShieldCheck size={16} />{contractor.verificationStatus === "IDENTITY_VERIFIED" ? "Danh tính đã xác minh" : "Cơ bản đã xác minh"}</span><span className={contractor.payoutReadiness === "READY" ? "ready-text" : "attention-text"}>{contractor.payoutReadiness === "READY" ? "Sẵn sàng" : "Cần bổ sung"}</span><Link href="/business/invoices/new">Tạo hóa đơn</Link></div>)}
        </div>
      </section>
    </BusinessShell>
  );
}
