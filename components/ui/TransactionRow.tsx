import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";

type Tone = "done" | "pending" | "refund";

export function TransactionRow({
  href,
  name,
  sub,
  status,
  tone,
  amount,
}: {
  href?: string;
  name: string;
  sub: string;
  status: string;
  tone: Tone;
  amount?: string;
}) {
  const body = (
    <div className="tx-row">
      <div className="tx-left">
        <div className="tx-icon">{tone === "refund" ? <X size={17} /> : <ArrowUpRight size={17} />}</div>
        <div>
          <div className="tx-name">{name}</div>
          <div className="tx-sub">{sub}</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        {amount ? <div className="mono" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{amount}</div> : null}
        <span className={`status-pill pill-${tone === "done" ? "done" : tone === "pending" ? "pending" : "refund"}`}>{status}</span>
      </div>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
