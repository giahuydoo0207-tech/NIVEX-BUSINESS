import Link from "next/link";
import { Delete, MapPin } from "lucide-react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";

export default function RemitPage() {
  return (
    <PhoneShell>
      <div className="content">
        <TopBar title="Gửi tiền quốc tế" />
        <p className="muted" style={{ textAlign: "center", marginTop: 10 }}>Bạn gửi</p>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, margin: "14px 0" }}>
          <input className="amount-input" value="100" readOnly aria-label="Số USDC gửi" />
          <strong className="mono">USDC</strong>
        </div>
        <p className="muted mono" style={{ textAlign: "center", marginTop: -10 }}>Số dư: 100 USDC</p>

        <div className="chip-row">
          <button className="chip">50</button>
          <button className="chip active">100</button>
          <button className="chip">200</button>
          <button className="chip">Tối đa</button>
        </div>

        <section className="card">
          <div className="route-row">
            <div>
              <div className="muted">Điểm đến</div>
              <strong>Australia</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="currency-chip" style={{ borderColor: "#6366F1", color: "#6366F1" }}>AUD</span>
              <MapPin size={18} color="#6366F1" />
            </div>
          </div>
        </section>

        <div className="keypad" aria-label="Bàn phím số demo">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((key) => <button className="key" key={key}>{key}</button>)}
          <button className="key" aria-label="Xóa"><Delete size={20} /></button>
        </div>

        <div style={{ marginTop: 16 }}>
          <Link className="btn-primary" href="/quote">Tiếp tục</Link>
        </div>
      </div>
    </PhoneShell>
  );
}
