"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Search,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";
import { demoApplications } from "@/lib/application-demo-data";
import type { ApplicationStatus, CandidateApplication } from "@/types/application";

const statusCopy: Record<
  ApplicationStatus,
  { label: string; description: string; tone: string }
> = {
  SUBMITTED: {
    label: "Mới gửi",
    description: "Chờ đội ngũ mở hồ sơ",
    tone: "new",
  },
  IN_REVIEW: {
    label: "Đang xem xét",
    description: "Đội ngũ đang đánh giá",
    tone: "review",
  },
  APPROVED: {
    label: "Đã duyệt",
    description: "Sẵn sàng trao đổi bước tiếp theo",
    tone: "approved",
  },
  REJECTED: {
    label: "Đã từ chối",
    description: "Hồ sơ đã được khép lại",
    tone: "rejected",
  },
};

type ApplicationFilter = "ALL" | ApplicationStatus;

const filters: Array<{ value: ApplicationFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "SUBMITTED", label: "Mới" },
  { value: "IN_REVIEW", label: "Đang xem" },
  { value: "APPROVED", label: "Đã duyệt" },
];

export function ApplicationsView({ initialCandidateId }: { initialCandidateId?: string }) {
  const [applications, setApplications] = useState<CandidateApplication[]>(
    () => structuredClone(demoApplications),
  );
  const [selectedId, setSelectedId] = useState(
    initialCandidateId && demoApplications.some((item) => item.id === initialCandidateId)
      ? initialCandidateId
      : demoApplications[0]?.id ?? "",
  );
  const [filter, setFilter] = useState<ApplicationFilter>("ALL");
  const [query, setQuery] = useState("");

  const visibleApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return applications.filter(
      (application) =>
        (filter === "ALL" || application.status === filter) &&
        (!normalizedQuery ||
          `${application.candidateName} ${application.jobTitle} ${application.headline}`
            .toLocaleLowerCase("vi")
            .includes(normalizedQuery)),
    );
  }, [applications, filter, query]);

  const selected =
    applications.find((application) => application.id === selectedId) ??
    visibleApplications[0] ??
    null;
  const newCount = applications.filter(
    (application) => application.status === "SUBMITTED",
  ).length;
  const reviewCount = applications.filter(
    (application) => application.status === "IN_REVIEW",
  ).length;
  const approvedCount = applications.filter(
    (application) => application.status === "APPROVED",
  ).length;

  function updateStatus(status: ApplicationStatus) {
    if (!selected) return;
    setApplications((current) =>
      current.map((application) => {
        if (application.id !== selected.id || application.status === status) {
          return application;
        }
        return {
          ...application,
          status,
        };
      }),
    );
  }

  return (
    <div className="applications-view">
      <div className="page-heading-row">
        <div>
          <h1>Ứng viên</h1>
          <p>Đánh giá năng lực, kinh nghiệm và mức độ phù hợp của từng hồ sơ.</p>
        </div>
        <span className="application-session-label">
          <span />
          UI PROTOTYPE · CHƯA ĐỒNG BỘ
        </span>
      </div>

      <section className="application-command-strip" aria-label="Tổng quan ứng viên">
        <article>
          <span className="jobs-command-icon blue"><Sparkles size={18} /></span>
          <span><small>HỒ SƠ MỚI</small><strong>{newCount} cần mở</strong></span>
        </article>
        <article>
          <span className="jobs-command-icon amber"><Clock3 size={18} /></span>
          <span><small>ĐANG XEM XÉT</small><strong>{reviewCount} hồ sơ</strong></span>
        </article>
        <article>
          <span className="jobs-command-icon green"><UserRoundCheck size={18} /></span>
          <span><small>ĐÃ DUYỆT</small><strong>{approvedCount} ứng viên</strong></span>
        </article>
        <article>
          <span className="jobs-command-icon blue"><MessagesSquare size={18} /></span>
          <span><small>TIN NHẮN</small><strong>2 hội thoại chưa đọc</strong></span>
        </article>
      </section>

      <section className="application-workbench">
        <aside className="application-queue" aria-label="Danh sách ứng viên">
          <div className="application-queue-head">
            <div>
              <strong>Hàng chờ xét duyệt</strong>
              <small>{visibleApplications.length} hồ sơ</small>
            </div>
            <label className="application-search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Tìm ứng viên"
                placeholder="Tìm ứng viên..."
              />
            </label>
          </div>
          <div className="application-tabs" role="tablist" aria-label="Lọc hồ sơ">
            {filters.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={filter === item.value}
                className={filter === item.value ? "active" : undefined}
                onClick={() => setFilter(item.value)}
                key={item.value}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="application-list">
            {visibleApplications.map((application) => {
              const status = statusCopy[application.status];
              return (
                <button
                  type="button"
                  className={application.id === selected?.id ? "active" : undefined}
                  onClick={() => setSelectedId(application.id)}
                  key={application.id}
                >
                  <span className="application-avatar">{application.initials}</span>
                  <span className="application-list-copy">
                    <span>
                      <strong>{application.candidateName}</strong>
                      <small>{application.submittedAt.split(" · ")[1]}</small>
                    </span>
                    <b>{application.headline}</b>
                    <small>{application.jobTitle}</small>
                    <i className={`application-status ${status.tone}`}>{status.label}</i>
                  </span>
                </button>
              );
            })}
            {visibleApplications.length === 0 && (
              <div className="application-empty">
                <Search size={24} />
                <strong>Không có hồ sơ phù hợp</strong>
                <small>Thử đổi từ khóa hoặc trạng thái.</small>
              </div>
            )}
          </div>
        </aside>

        {selected ? (
          <div className="candidate-workspace">
            <header className="candidate-header">
              <div className="candidate-identity">
                <span className="application-avatar large">{selected.initials}</span>
                <span>
                  <small>ỨNG TUYỂN · {selected.jobTitle}</small>
                  <strong>{selected.candidateName}</strong>
                  <p>{selected.headline}</p>
                </span>
              </div>
              <div className="candidate-status-block">
                <Link
                  href={`/business/messages?candidate=${selected.id}`}
                  className="candidate-message-button"
                  aria-label={`Nhắn tin với ${selected.candidateName}`}
                  title="Nhắn tin"
                >
                  <MessageCircle size={19} />
                  <span>Nhắn tin</span>
                </Link>
                <div>
                  <span className={`application-status ${statusCopy[selected.status].tone}`}>
                    {statusCopy[selected.status].label}
                  </span>
                  <small>{statusCopy[selected.status].description}</small>
                </div>
              </div>
            </header>

            <div className="candidate-body candidate-body-profile-only">
              <section className="candidate-profile" aria-label="Thông tin ứng viên">
                <div className="candidate-contact-grid">
                  <span><Mail size={14} />{selected.email}</span>
                  <span><MapPin size={14} />{selected.location}</span>
                  <span><ExternalLink size={14} />{selected.portfolioLabel}</span>
                </div>
                <div className="candidate-match-row">
                  <span><Sparkles size={16} />Mức phù hợp hồ sơ</span>
                  <strong>{selected.matchScore}%</strong>
                  <i><span style={{ width: `${selected.matchScore}%` }} /></i>
                </div>
                <div className="candidate-copy-block">
                  <small>LỜI NHẮN ỨNG TUYỂN</small>
                  <p>{selected.coverNote}</p>
                </div>
                <div className="candidate-copy-block split">
                  <span>
                    <small>KỸ NĂNG</small>
                    <span className="job-skill-list">
                      {selected.skills.map((skill) => <span key={skill}>{skill}</span>)}
                    </span>
                  </span>
                  <span>
                    <small>THỜI GIAN BẮT ĐẦU</small>
                    <p>{selected.availability}</p>
                  </span>
                </div>
                <div className="candidate-review-actions">
                  <button
                    type="button"
                    className="business-secondary-button"
                    onClick={() => updateStatus("REJECTED")}
                    disabled={selected.status === "REJECTED"}
                  >
                    <X size={16} /> Từ chối
                  </button>
                  {selected.status === "SUBMITTED" && (
                    <button
                      type="button"
                      className="business-secondary-button"
                      onClick={() => updateStatus("IN_REVIEW")}
                    >
                      <Clock3 size={16} /> Bắt đầu xem xét
                    </button>
                  )}
                  <button
                    type="button"
                    className="business-primary-button"
                    onClick={() => updateStatus("APPROVED")}
                    disabled={selected.status === "APPROVED"}
                  >
                    <Check size={16} /> Duyệt hồ sơ
                  </button>
                </div>
              </section>

            </div>
          </div>
        ) : (
          <div className="application-empty workspace">
            <UserRoundCheck size={30} />
            <strong>Chọn một hồ sơ để bắt đầu</strong>
          </div>
        )}
      </section>
    </div>
  );
}
