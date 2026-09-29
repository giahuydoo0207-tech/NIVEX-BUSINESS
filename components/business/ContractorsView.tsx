"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Search, ShieldCheck, UsersRound } from "lucide-react";
import { demoContractors } from "@/lib/business-demo-data";
import { statusCopy } from "@/lib/application-status";
import { liveBackend } from "@/lib/workspace-api";
import type { CandidateApplication } from "@/types/application";
import { useApplications } from "./useApplications";

export function ContractorsView() {
  return liveBackend ? <LiveContractors /> : <DemoContractors />;
}

type Person = { key: string; latest: CandidateApplication; applications: CandidateApplication[] };

/** Live mode: people are the candidates who actually applied, grouped by user. */
function LiveContractors() {
  const { applications, error } = useApplications();
  const [query, setQuery] = useState("");
  const people = useMemo(() => {
    const byUser = new Map<string, Person>();
    for (const application of applications) {
      const key = application.applicantUserId ?? application.id;
      const person = byUser.get(key);
      if (person) person.applications.push(application);
      else byUser.set(key, { key, latest: application, applications: [application] });
    }
    return [...byUser.values()];
  }, [applications]);
  const value = query.trim().toLocaleLowerCase("vi");
  const rows = people.filter(
    ({ latest }) => !value || `${latest.candidateName} ${latest.headline}`.toLocaleLowerCase("vi").includes(value),
  );
  return (
    <>
      <div className="page-heading-row">
        <div>
          <h1>Nhân sự</h1>
          <p>Ứng viên đã ứng tuyển công việc của bạn trên Nova.</p>
        </div>
        <span className="status-badge neutral">
          <UsersRound size={14} />
          {people.length} người
        </span>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
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
      </div>
      <section className="contractor-grid">
        {rows.map(({ key, latest, applications: mine }) => (
          <article className="contractor-card" key={key}>
            <div className="contractor-profile">
              <i>
                {latest.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={latest.avatarUrl} alt="" />
                ) : (
                  latest.initials
                )}
              </i>
              <div>
                <h2>{latest.candidateName}</h2>
                <p>{latest.headline || "Thành viên Nova"}</p>
              </div>
            </div>
            <div className="verification-list">
              {latest.email && (
                <span>
                  <Mail size={15} />
                  {latest.email}
                </span>
              )}
              {latest.location && (
                <span>
                  <MapPin size={15} />
                  {latest.location}
                </span>
              )}
              {mine.map((application) => (
                <span key={application.id}>
                  {application.jobTitle} · {statusCopy[application.status].label}
                </span>
              ))}
            </div>
            <Link
              className="business-secondary-button"
              href={`/business/applications?candidate=${encodeURIComponent(latest.id)}`}
            >
              Xem hồ sơ
              <ArrowUpRight size={14} />
            </Link>
          </article>
        ))}
      </section>
      {rows.length === 0 && (
        <div className="empty-state">
          <UsersRound size={28} />
          <h3>{people.length === 0 ? "Chưa có nhân sự" : "Không tìm thấy nhân sự"}</h3>
          <p>
            {people.length === 0
              ? "Ứng viên sẽ xuất hiện ở đây sau khi ứng tuyển công việc của bạn."
              : "Thử tên hoặc chuyên môn khác."}
          </p>
        </div>
      )}
    </>
  );
}

function DemoContractors() {
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
