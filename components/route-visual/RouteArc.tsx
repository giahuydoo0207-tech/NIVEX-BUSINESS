import { Plane } from "lucide-react";

export function RouteArc({ watermark = false }: { watermark?: boolean }) {
  if (watermark) {
    return (
      <svg className="route-watermark" viewBox="0 0 300 180" fill="none" aria-hidden="true">
        <path d="M22 132 Q144 -8 276 132" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="8 12" strokeLinecap="round" />
        <circle cx="22" cy="132" r="8" fill="#FFFFFF" />
        <circle cx="276" cy="132" r="8" fill="#FFFFFF" />
      </svg>
    );
  }

  return (
    <div className="route-arc" aria-label="Tuyến USDC sang AUD">
      <svg width="100%" height="104" viewBox="0 0 300 104" fill="none" aria-hidden="true">
        <path d="M42 76 Q150 0 258 76" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" />
      </svg>
      <div className="route-node from">USDC</div>
      <Plane className="plane" size={20} />
      <div className="route-node to">AUD</div>
    </div>
  );
}
