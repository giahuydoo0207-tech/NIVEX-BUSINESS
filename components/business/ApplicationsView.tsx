"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  Clock3,
  ExternalLink,
  FilterX,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Search,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useApplications } from "@/components/business/useApplications";
import { useJobs } from "@/components/business/useJobs";
import { NEXT_ACTIONS, statusCopy } from "@/lib/application-status";
import type {
  ApplicationStatus,
  CandidateApplication,
  PortfolioPreviewItem,
} from "@/types/application";

type ApplicationFilter = "ALL" | ApplicationStatus;

const filters: Array<{ value: ApplicationFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "submitted", label: "Mới gửi" },
  { value: "viewed", label: "Đang xem" },
  { value: "shortlisted", label: "Shortlist" },
  { value: "interview", label: "Phỏng vấn" },
  { value: "accepted", label: "Đã nhận" },
  { value: "rejected", label: "Từ chối" },
  { value: "withdrawn", label: "Đã rút" },
];

function PortfolioItemCard({ item }: { item: PortfolioPreviewItem }) {
  const [imgError, setImgError] = useState(false);
  const initials =
    item.title
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PF";

  const showThumb = Boolean(item.thumbnailUrl) && !imgError;

  return (
    <a
      href={item.url || "#"}
      target={item.url ? "_blank" : undefined}
      rel={item.url ? "noopener noreferrer" : undefined}
      className="portfolio-preview-card"
    >
      <div className="portfolio-card-thumb-wrapper">
        {showThumb ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="portfolio-preview-thumbnail"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="portfolio-preview-fallback">
            <span>{initials}</span>
          </div>
        )}
      </div>
      <div className="portfolio-preview-meta">
        <strong className="portfolio-preview-title">
          <span>{item.title}</span>
          {item.url && <ExternalLink size={13} />}
        </strong>
        {item.description && (
          <p className="portfolio-preview-desc">{item.description}</p>
        )}
      </div>
    </a>
  );
}

interface ApplicationsViewProps {
  initialCandidateId?: string;
  filterJobId?: string;
}

export function ApplicationsView({
  initialCandidateId,
  filterJobId,
}: ApplicationsViewProps) {
  const { applications, updateStatus } = useApplications();
  const { jobs } = useJobs();
  const [filter, setFilter] = useState<ApplicationFilter>("ALL");
  const [query, setQuery] = useState("");

  const filteredJob = useMemo(() => {
    if (!filterJobId) return null;
    return jobs.find((j) => j.id === filterJobId) ?? null;
  }, [jobs, filterJobId]);

  const jobApplications = useMemo(() => {
    if (!filterJobId) return applications;
    return applications.filter((app) => app.jobId === filterJobId);
  }, [applications, filterJobId]);

  const [selectedId, setSelectedId] = useState(() => {
    if (
      initialCandidateId &&
      applications.some((app) => app.id === initialCandidateId)
    ) {
      return initialCandidateId;
    }
    if (filterJobId) {
      const match = applications.find((app) => app.jobId === filterJobId);
      if (match) return match.id;
    }
    return applications[0]?.id ?? "";
  });

  const visibleApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return jobApplications.filter((application) => {
      const matchStatus = filter === "ALL" || application.status === filter;
      const matchQuery =
        !normalizedQuery ||
        `${application.candidateName} ${application.jobTitle} ${application.headline} ${application.skills.join(" ")}`
          .toLocaleLowerCase("vi")
          .includes(normalizedQuery);
      return matchStatus && matchQuery;
    });
  }, [jobApplications, filter, query]);

  const selected = useMemo(() => {
    return (
      jobApplications.find((app) => app.id === selectedId) ??
      visibleApplications[0] ??
      null
    );
  }, [jobApplications, selectedId, visibleApplications]);

  const newCount = jobApplications.filter(
    (app) => app.status === "submitted",
  ).length;
  const reviewCount = jobApplications.filter(
    (app) => app.status === "viewed" || app.status === "shortlisted",
  ).length;
  const interviewCount = jobApplications.filter(
    (app) => app.status === "interview",
  ).length;
  const acceptedCount = jobApplications.filter(
    (app) => app.status === "accepted",
  ).length;

  return (
    <div className="applications-view">
      <div className="page-heading-row">
        <div>
          <h1>Ứng viên</h1>
          <p>Đánh giá năng lực, kinh nghiệm và mức độ phù hợp của từng hồ sơ.</p>
        </div>
      </div>

      <section className="application-command-strip" aria-label="Tổng quan ứng viên">
        <article>
          <span className="jobs-command-icon blue">
            <Sparkles size={18} />
          </span>
          <span>
            <small>HỒ SƠ MỚI</small>
            <strong>{newCount} cần mở</strong>
          </span>
        </article>
        <article>
          <span className="jobs-command-icon amber">
            <Clock3 size={18} />
          </span>
          <span>
            <small>ĐANG XEM & SHORTLIST</small>
            <strong>{reviewCount} hồ sơ</strong>
          </span>
        </article>
        <article>
          <span className="jobs-command-icon blue">
            <MessagesSquare size={18} />
          </span>
          <span>
            <small>PHỎNG VẤN</small>
            <strong>{interviewCount} ứng viên</strong>
          </span>
        </article>
        <article>
          <span className="jobs-command-icon green">
            <UserRoundCheck size={18} />
          </span>
          <span>
            <small>ĐÃ NHẬN (HIRED)</small>
            <strong>{acceptedCount} người</strong>
          </span>
        </article>
      </section>

      {filterJobId && (
        <div className="application-filter-banner">
          <div>
            <span>Đang lọc ứng viên cho vị trí: </span>
            <strong>
              {filteredJob?.title ??
                visibleApplications[0]?.jobTitle ??
                filterJobId}
            </strong>
          </div>
          <Link href="/business/applications" className="clear-filter-button">
            <FilterX size={15} />
            <span>Xem tất cả ứng viên</span>
          </Link>
        </div>
      )}

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
          <div
            className="application-tabs"
            role="tablist"
            aria-label="Lọc hồ sơ"
          >
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
                  className={
                    application.id === selected?.id ? "active" : undefined
                  }
                  onClick={() => setSelectedId(application.id)}
                  key={application.id}
                >
                  <span className="application-avatar">
                    {application.initials}
                  </span>
                  <span className="application-list-copy">
                    <span>
                      <strong>{application.candidateName}</strong>
                      <small>{application.submittedAt.split(" · ")[1]}</small>
                    </span>
                    <b>{application.headline}</b>
                    <small>{application.jobTitle}</small>
                    <i className={`application-status ${status.tone}`}>
                      {status.label}
                    </i>
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
                <span className="application-avatar large">
                  {selected.initials}
                </span>
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
                  <span
                    className={`application-status ${statusCopy[selected.status].tone}`}
                  >
                    {statusCopy[selected.status].label}
                  </span>
                  <small>{statusCopy[selected.status].description}</small>
                </div>
              </div>
            </header>

            <div className="candidate-body candidate-body-profile-only">
              <section
                className="candidate-profile"
                aria-label="Thông tin ứng viên"
              >
                <div className="candidate-contact-grid">
                  <span>
                    <Mail size={14} />
                    {selected.email}
                  </span>
                  <span>
                    <MapPin size={14} />
                    {selected.location}
                  </span>
                  {selected.portfolioLabel && (
                    <span>
                      <ExternalLink size={14} />
                      <a
                        href={
                          selected.portfolioLabel.startsWith("http")
                            ? selected.portfolioLabel
                            : `https://${selected.portfolioLabel}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {selected.portfolioLabel}
                      </a>
                    </span>
                  )}
                </div>
                <div className="candidate-match-row">
                  <span>
                    <Sparkles size={16} />
                    Mức phù hợp hồ sơ
                  </span>
                  <strong>{selected.matchScore}%</strong>
                  <i>
                    <span style={{ width: `${selected.matchScore}%` }} />
                  </i>
                </div>
                <div className="candidate-copy-block">
                  <small>LỜI NHẮN ỨNG TUYỂN</small>
                  <p>{selected.coverNote || selected.coverLetter}</p>
                </div>
                <div className="candidate-copy-block split">
                  <span>
                    <small>KỸ NĂNG</small>
                    <span className="job-skill-list">
                      {selected.skills.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </span>
                  </span>
                  <span>
                    <small>THỜI GIAN BẮT ĐẦU</small>
                    <p>{selected.availability}</p>
                  </span>
                </div>

                {selected.portfolioPreview &&
                  selected.portfolioPreview.length > 0 && (
                    <div className="candidate-copy-block portfolio-section">
                      <small>DỰ ÁN / PORTFOLIO TIÊU BIỂU</small>
                      <div className="portfolio-preview-grid">
                        {selected.portfolioPreview.map((item) => (
                          <PortfolioItemCard key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  )}

                <div className="candidate-review-actions">
                  {selected.status === "withdrawn" && (
                    <div className="application-status-notice withdrawn">
                      <span>Ứng viên đã chủ động rút hồ sơ ứng tuyển.</span>
                    </div>
                  )}

                  {selected.status === "rejected" && (
                    <div className="application-status-notice rejected">
                      <span>Hồ sơ đã được đánh dấu từ chối.</span>
                    </div>
                  )}

                  {selected.status === "accepted" && (
                    <div className="application-status-notice accepted">
                      <Check size={16} />
                      <span>Ứng viên đã được nhận chính thức (Hired).</span>
                    </div>
                  )}

                  {selected.status !== "withdrawn" &&
                    selected.status !== "rejected" &&
                    selected.status !== "accepted" && (
                      <>
                        <button
                          type="button"
                          className="business-secondary-button button-danger"
                          onClick={() => updateStatus(selected.id, "rejected")}
                        >
                          <X size={16} /> Từ chối
                        </button>

                        {NEXT_ACTIONS[selected.status]?.map((action) => (
                          <button
                            type="button"
                            key={action.next}
                            className={
                              action.tone === "primary"
                                ? "business-primary-button"
                                : "business-secondary-button"
                            }
                            onClick={() =>
                              updateStatus(selected.id, action.next)
                            }
                          >
                            {action.next === "accepted" && <Check size={16} />}
                            {action.label}
                          </button>
                        ))}
                      </>
                    )}
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
