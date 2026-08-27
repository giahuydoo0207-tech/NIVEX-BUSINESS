import { BottomNav } from "@/components/layout/BottomNav";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { TransactionRow } from "@/components/ui/TransactionRow";
import { transactions } from "@/lib/demo-data";

export default function HistoryPage() {
  return (
    <PhoneShell>
      <div className="content">
        <TopBar title="Lịch sử giao dịch" />
        <div className="filters">
          {["Tất cả", "Hoàn tất", "Đang xử lý", "Đã hoàn tiền"].map((filter, index) => (
            <button className={`filter ${index === 0 ? "active" : ""}`} key={filter}>{filter}</button>
          ))}
        </div>
        <section className="card transaction-list">
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              href={tx.id === "demo-remit-001" ? "/receipt/demo-remit-001" : undefined}
              name={tx.partner}
              sub={`${tx.usdc} USDC${tx.aud ? ` · ${tx.aud} AUD` : ""} · ${tx.time}`}
              amount={`${tx.usdc} USDC`}
              status={tx.status}
              tone={tx.statusTone}
            />
          ))}
        </section>
      </div>
      <BottomNav active="history" />
    </PhoneShell>
  );
}
