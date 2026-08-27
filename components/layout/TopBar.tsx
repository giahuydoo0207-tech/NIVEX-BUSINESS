import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function TopBar({ title, backHref = "/home" }: { title: string; backHref?: string }) {
  return (
    <div className="topbar">
      <Link className="icon-btn" href={backHref} aria-label="Quay lại">
        <ChevronLeft size={20} />
      </Link>
      <div className="top-title">{title}</div>
    </div>
  );
}
