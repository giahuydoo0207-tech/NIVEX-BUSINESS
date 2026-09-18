"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, ShieldCheck, UsersRound } from "lucide-react";
import { demoContractors } from "@/lib/business-demo-data";
export function ContractorsView() {
  const [query, setQuery] = useState("");
  const [readiness, setReadiness] = useState("ALL");
  const rows = demoContractors.filter(
    (item) =>
      (readiness === "ALL" || item.payoutReadiness === readiness) &&
      (item.displayName + " " + item.role)
        .toLocaleLowerCase("vi")
        .includes(query.toLocaleLowerCase("vi")),
  );
  return (
    <>
      <div className="page-heading-row">
        <div>
          <h1>Nhân sự</h1>
          <p>Đội ngũ của bạn, kết nối qua Nova.</p>
        </div>
        <span className="status-badge neutral">
          <UsersRound size={14} />
          {demoContractors.length} người nhận
        </span>
      </div>
      <div className="contractor-toolbar">
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="Tìm nhân sự"
            placeholder="Tìm tên hoặc chuyên môn..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="Trạng thái người nhận"
          value={readiness}
          onChange={(event) => setReadiness(event.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="READY">Sẵn sàng nhận VND</option>
          <option value="ACTION_REQUIRED">Cần bổ sung thông tin</option>
        </select>
      </div>
      <section className="contractor-grid">
        {rows.map((contractor) => (
          <article className="contractor-card" key={contractor.id}>
            <div className="contractor-profile">
              <i>
                {contractor.displayName
                  .split(" ")
                  .slice(-2)
                  .map((word) => word[0])
                  .join("")}
              </i>
              <div>
                <h2>{contractor.displayName}</h2>
                <p>
                  {contractor.role}
                  <br />
                  Việt Nam
                </p>
              </div>
            </div>
            <div className="verification-list">
              <span>
                <ShieldCheck size={15} />
                Email đã xác minh
              </span>
              <span>
                <ShieldCheck size={15} />
                {contractor.verificationStatus === "IDENTITY_VERIFIED"
                  ? "Danh tính đã xác minh"
                  : "Thông tin cơ bản đã xác minh"}
              </span>
              <span
                className={
                  contractor.payoutReadiness === "READY"
                    ? "ready-text"
                    : "attention-text"
                }
              >
                {contractor.payoutReadiness === "READY"
                  ? "Sẵn sàng nhận VND"
                  : "Cần bổ sung tài khoản nhận VND"}
              </span>
            </div>
            <Link
              className="business-secondary-button"
              href={
                "/business/invoices/new?contractor=" +
                encodeURIComponent(contractor.id)
              }
            >
              Tạo hóa đơn
              <ArrowUpRight size={14} />
            </Link>
          </article>
        ))}
      </section>
      {rows.length === 0 && (
        <div className="empty-state">
          <Search size={28} />
          <h3>Không tìm thấy nhân sự</h3>
          <p>Thử tên khác hoặc chọn tất cả trạng thái.</p>
          <button
            className="business-secondary-button"
            onClick={() => {
              setQuery("");
              setReadiness("ALL");
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </>
  );
}
