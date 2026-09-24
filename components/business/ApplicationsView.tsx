"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlignLeft,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  Code2,
  ExternalLink,
  FilterX,
  GraduationCap,
  Landmark,
  Layers,
  LayoutGrid,
  Languages,
  MapPin,
  MessageCircle,
  Search,
  Shield,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useApplications } from "@/components/business/useApplications";
import { useJobs } from "@/components/business/useJobs";
import { NEXT_ACTIONS, statusCopy } from "@/lib/application-status";
import type { ApplicationStatus } from "@/types/application";

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

  return (
    <div className="applications-view">
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
        {/* ========================================================
            CỘT TRÁI: HÀNG CHỜ XÉT DUYỆT / DANH SÁCH ỨNG VIÊN
            ======================================================== */}
        <aside className="application-queue" aria-label="Danh sách ứng viên">
          <div className="application-queue-sticky-top">
            <div className="application-queue-head">
              <div className="application-queue-title-row">
                <strong>Hàng chờ xét duyệt</strong>
                <span className="application-count-pill">
                  {visibleApplications.length} hồ sơ
                </span>
              </div>
              <label className="application-search">
                <Search size={14} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Tìm ứng viên"
                  placeholder="Tìm ứng viên..."
                />
                {query && (
                  <button
                    type="button"
                    className="application-search-clear"
                    onClick={() => setQuery("")}
                    aria-label="Xóa tìm kiếm"
                  >
                    <X size={13} />
                  </button>
                )}
              </label>
            </div>

            {/* 8 BỘ LỌC TRẠNG THÁI STICKY */}
            <div
              className="application-tabs"
              role="tablist"
              aria-label="Lọc hồ sơ theo trạng thái"
            >
              {filters.map((item) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === item.value}
                  className={`application-tab-btn ${
                    filter === item.value ? "active" : ""
                  }`}
                  onClick={() => setFilter(item.value)}
                  key={item.value}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* VÙNG LƯỚT VÔ HÌNH: DANH SÁCH ỨNG VIÊN */}
          <div className="application-list-scroll">
            <div className="application-list">
              {visibleApplications.map((application) => {
                const status = statusCopy[application.status];
                const isSelected = application.id === selected?.id;
                return (
                  <button
                    type="button"
                    className={`application-card-item ${
                      isSelected ? "active" : ""
                    }`}
                    onClick={() => setSelectedId(application.id)}
                    key={application.id}
                  >
                    <div className="application-card-avatar-wrap">
                      {application.avatarUrl ? (
                        <img
                          src={application.avatarUrl}
                          alt={application.candidateName}
                          className="application-card-avatar-img"
                        />
                      ) : (
                        <span className="application-avatar">
                          {application.initials}
                        </span>
                      )}
                      {(application.statusBadge === "Sẵn sàng" ||
                        application.status === "submitted") && (
                        <span className="avatar-online-dot" />
                      )}
                    </div>
                    <div className="application-list-copy">
                      <div className="application-list-top-row">
                        <strong className="candidate-name">
                          {application.candidateName}
                        </strong>
                        <span className="candidate-time">
                          {application.submittedAt.includes("·")
                            ? application.submittedAt.split(" · ")[1]
                            : application.submittedAt}
                        </span>
                      </div>
                      <span className="candidate-headline">
                        {application.headline}
                      </span>
                      <small className="candidate-job-tag">
                        {application.jobTitle}
                      </small>
                      <div className="application-card-badges">
                        <i className={`application-status ${status.tone}`}>
                          {status.label}
                        </i>
                        {application.statusBadge &&
                          application.statusBadge !== status.label && (
                            <span className="application-readiness-badge">
                              {application.statusBadge}
                            </span>
                          )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {visibleApplications.length === 0 && (
                <div className="application-empty">
                  <Search size={24} />
                  <strong>Không có hồ sơ phù hợp</strong>
                  <small>Thử đổi từ khóa hoặc bộ lọc trạng thái.</small>
                </div>
              )}
            </div>
          </div>
          <div className="application-queue-fade" aria-hidden="true" />
        </aside>

        {/* ========================================================
            CỘT PHẢI: PROFILE ỨNG VIÊN CHI TIẾT (CHUẨN MOBILE PARITY)
            ======================================================== */}
        {selected ? (
          <div
            className="candidate-profile-scroll"
            id="candidate-profile-container"
          >
            {/* STICKY HEADER ACTIONS BAR */}
            <header className="candidate-sticky-header">
              <div className="candidate-header-meta">
                <span className="candidate-header-prefix">ỨNG TUYỂN</span>
                <span className="candidate-header-dot">·</span>
                <Link
                  href={`/business/jobs/${selected.jobId}`}
                  className="candidate-header-job-link"
                  title="Xem chi tiết cơ hội việc làm"
                >
                  {selected.jobTitle}
                </Link>
                <span
                  className={`application-status ${statusCopy[selected.status].tone}`}
                >
                  {statusCopy[selected.status].label}
                </span>
              </div>

              <div className="candidate-header-actions">
                <Link
                  href={`/business/messages?candidate=${selected.id}`}
                  className="candidate-action-btn message-btn"
                  title={`Nhắn tin với ${selected.candidateName}`}
                >
                  <MessageCircle size={15} />
                  <span>Nhắn tin</span>
                </Link>

                {selected.status !== "withdrawn" &&
                  selected.status !== "rejected" &&
                  selected.status !== "accepted" && (
                    <>
                      <button
                        type="button"
                        className="candidate-action-btn reject-btn"
                        onClick={() => updateStatus(selected.id, "rejected")}
                      >
                        <X size={15} />
                        <span>Từ chối</span>
                      </button>

                      {NEXT_ACTIONS[selected.status]?.map((action) => (
                        <button
                          type="button"
                          key={action.next}
                          className={`candidate-action-btn ${
                            action.tone === "primary"
                              ? "primary-action-btn"
                              : "secondary-action-btn"
                          }`}
                          onClick={() => updateStatus(selected.id, action.next)}
                        >
                          {action.next === "accepted" && <Check size={15} />}
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </>
                  )}
              </div>
            </header>

            {/* VÙNG LƯỚT VÔ HÌNH: NỘI DUNG PROFILE CHI TIẾT */}
            <div className="candidate-profile-content">
              {/* THÔNG BÁO TRẠNG THÁI CUỐI CÙNG NẾU CÓ */}
              {selected.status === "withdrawn" && (
                <div className="profile-banner-notice withdrawn">
                  <span>Ứng viên đã chủ động rút hồ sơ ứng tuyển.</span>
                </div>
              )}
              {selected.status === "rejected" && (
                <div className="profile-banner-notice rejected">
                  <span>Hồ sơ đã được đánh dấu từ chối.</span>
                </div>
              )}
              {selected.status === "accepted" && (
                <div className="profile-banner-notice accepted">
                  <Check size={16} />
                  <span>Ứng viên đã được nhận chính thức (Hired).</span>
                </div>
              )}

              {/* 1. HERO PROFILE CARD */}
              <div className="mobile-profile-hero-card">
                <div className="hero-top-row">
                  <div className="hero-avatar-area">
                    <div className="hero-avatar-ring">
                      {selected.avatarUrl ? (
                        <img
                          src={selected.avatarUrl}
                          alt={selected.candidateName}
                          className="hero-avatar-image"
                        />
                      ) : (
                        <span className="hero-avatar-initials">
                          {selected.initials}
                        </span>
                      )}
                      <span className="hero-online-badge" />
                    </div>
                    <div className="hero-names">
                      <h2 className="hero-candidate-name">
                        {selected.candidateName}
                      </h2>
                      <span className="hero-username">
                        {selected.username ||
                          `@${selected.initials.toLowerCase()}.nova`}
                      </span>
                    </div>
                  </div>
                  <div className="hero-readiness-badge">
                    <span className="readiness-dot" />
                    <span>{selected.statusBadge || "Sẵn sàng"}</span>
                  </div>
                </div>

                <div className="hero-headline">{selected.headline}</div>

                <div className="hero-meta-chips">
                  <span className="hero-meta-item">
                    <MapPin size={13} />
                    <span>{selected.location}</span>
                  </span>
                  <span className="hero-meta-item">
                    <Clock size={13} />
                    <span>{selected.timezone || "UTC+7"}</span>
                  </span>
                  <span className="hero-meta-item">
                    <Languages size={13} />
                    <span>{selected.languages || "Tiếng Việt · English"}</span>
                  </span>
                </div>

                <div className="hero-card-divider" />

                <div className="hero-work-specs">
                  <div className="spec-item">
                    <span className="spec-label">Hình thức</span>
                    <strong className="spec-val">
                      {selected.workType || "Remote · Theo dự án"}
                    </strong>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Năng lực</span>
                    <strong className="spec-val">
                      {selected.capacity ||
                        selected.availability ||
                        "20 giờ/tuần"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. MỨC ĐỘ HOÀN THIỆN HỒ SƠ */}
              <div className="mobile-profile-completion-card">
                <div className="completion-header">
                  <span className="completion-title">
                    Mức độ hoàn thiện hồ sơ
                  </span>
                  <strong className="completion-percent">
                    {selected.profileCompletion || selected.matchScore || 86}%
                  </strong>
                </div>
                <div
                  className="completion-track"
                  role="progressbar"
                  aria-valuenow={
                    selected.profileCompletion || selected.matchScore || 86
                  }
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="completion-fill"
                    style={{
                      width: `${
                        selected.profileCompletion || selected.matchScore || 86
                      }%`,
                    }}
                  />
                </div>
                <p className="completion-tip">
                  {selected.completionTip ||
                    "Bổ sung chứng chỉ để doanh nghiệp có thêm cơ sở đánh giá."}
                </p>
              </div>

              {/* 3. CẤP BẬC UY TÍN */}
              <div className="mobile-profile-reputation-card">
                <div className="reputation-left">
                  <div className="reputation-icon-wrap">
                    <Shield size={18} />
                  </div>
                  <div className="reputation-text">
                    <strong className="reputation-title">
                      {selected.trustRank || "Chưa xếp hạng"}
                    </strong>
                    <span className="reputation-subtitle">
                      {selected.trustRankSubtitle || "Cấp bậc uy tín Nova"}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="reputation-chevron" />
              </div>

              {/* 4. GIỚI THIỆU */}
              <div className="mobile-profile-section">
                <div className="section-title-row">
                  <AlignLeft size={16} />
                  <h3>Giới thiệu</h3>
                </div>
                <div className="section-card-surface">
                  <p className="bio-text">
                    {selected.bio ||
                      selected.coverNote ||
                      selected.coverLetter ||
                      "Tôi xây dựng ứng dụng Flutter cho fintech và các sản phẩm thanh toán. Tôi tập trung vào giao diện responsive, code dễ bảo trì và tiến độ minh bạch theo từng giai đoạn."}
                  </p>
                </div>
              </div>

              {/* 5. KỸ NĂNG */}
              <div className="mobile-profile-section">
                <div className="section-title-row">
                  <Code2 size={16} />
                  <h3>Kỹ năng</h3>
                </div>
                <div className="skills-chip-wrap">
                  {(selected.detailedSkills || selected.skills).map(
                    (skill, idx) => {
                      const isEmphasized = idx === 0 || skill === "Flutter";
                      return (
                        <span
                          key={skill}
                          className={`mobile-skill-chip ${
                            isEmphasized ? "emphasized" : ""
                          }`}
                        >
                          {skill}
                        </span>
                      );
                    },
                  )}
                </div>
              </div>

              {/* 6. PORTFOLIO NỔI BẬT */}
              <div className="mobile-profile-section">
                <div className="section-title-row">
                  <LayoutGrid size={16} />
                  <h3>Portfolio nổi bật</h3>
                </div>
                <div className="portfolio-cards-stack">
                  {(
                    selected.detailedPortfolio || [
                      {
                        id: "p1",
                        title:
                          selected.portfolioPreview[0]?.title ||
                          "Nova Mobile Prototype",
                        role: "Flutter Developer",
                        description:
                          selected.portfolioPreview[0]?.description ||
                          "Ứng dụng hỗ trợ freelancer tìm việc, trao đổi và theo dõi thanh toán quốc tế.",
                        badge: "Prototype",
                        badgeTone: "amber" as const,
                        url:
                          selected.portfolioPreview[0]?.url ||
                          "https://github.com",
                        techTags: ["Flutter", "Dart", "Solana Devnet"],
                      },
                      {
                        id: "p2",
                        title:
                          selected.portfolioPreview[1]?.title ||
                          "Nova Business",
                        role: "Product & Frontend Developer",
                        description:
                          selected.portfolioPreview[1]?.description ||
                          "Không gian doanh nghiệp để đăng cơ hội, xét duyệt ứng viên và quản lý yêu cầu thanh toán.",
                        badge: "Đang phát triển",
                        badgeTone: "amber" as const,
                        url:
                          selected.portfolioPreview[1]?.url ||
                          "https://business.novapay.dev",
                        techTags: ["Next.js", "TypeScript", "UI/UX"],
                      },
                    ]
                  ).map((project) => (
                    <div key={project.id} className="mobile-project-card">
                      <div className="project-card-header">
                        <div className="project-title-area">
                          <div className="project-icon-box">
                            <Layers size={18} />
                          </div>
                          <div className="project-headings">
                            <h4 className="project-name">{project.title}</h4>
                            {project.role && (
                              <span className="project-role">
                                {project.role}
                              </span>
                            )}
                          </div>
                        </div>
                        {project.badge && (
                          <span
                            className={`project-status-badge ${
                              project.badgeTone || "amber"
                            }`}
                          >
                            {project.badge}
                          </span>
                        )}
                      </div>

                      {project.description && (
                        <p className="project-desc">{project.description}</p>
                      )}

                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link"
                        >
                          <ExternalLink size={13} />
                          <span>Xem sản phẩm</span>
                        </a>
                      )}

                      {project.techTags && project.techTags.length > 0 && (
                        <div className="project-tech-tags">
                          {project.techTags.map((tag) => (
                            <span key={tag} className="tech-tag-chip">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. KINH NGHIỆM */}
              <div className="mobile-profile-section">
                <div className="section-title-row">
                  <Briefcase size={16} />
                  <h3>Kinh nghiệm</h3>
                </div>
                <div className="section-card-surface experience-surface">
                  {(
                    selected.experiences || [
                      {
                        id: "exp-default",
                        role: "Flutter Developer",
                        company: "Independent Freelancer",
                        period: "2024 - nay",
                        description:
                          "Xây dựng auth flow, wallet, payment request và kiểm thử responsive trên thiết bị Android thật.",
                      },
                    ]
                  ).map((exp, index, arr) => (
                    <div key={exp.id || exp.role} className="experience-item">
                      <div className="experience-timeline">
                        <span className="timeline-dot" />
                        {index < arr.length - 1 && (
                          <span className="timeline-line" />
                        )}
                      </div>
                      <div className="experience-content">
                        <h4 className="experience-role">{exp.role}</h4>
                        <span className="experience-company-period">
                          {exp.company} · {exp.period}
                        </span>
                        <p className="experience-desc">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 8. HỌC VẤN & CHỨNG CHỈ */}
              <div className="mobile-profile-section">
                <div className="section-title-row">
                  <GraduationCap size={16} />
                  <h3>Học vấn & chứng chỉ</h3>
                </div>
                <div className="section-card-surface education-surface">
                  <div className="education-icon-box">
                    <Landmark size={20} />
                  </div>
                  <div className="education-content">
                    <h4 className="education-degree">
                      {selected.education?.degree || "Kỹ thuật phần mềm"}
                    </h4>
                    <span className="education-institution">
                      {selected.education?.institution ||
                        "Đại học FPT Đà Nẵng"}{" "}
                      ·{" "}
                      {selected.education?.years || "Sinh viên · 2023 - 2027"}
                    </span>
                    <span className="education-note">
                      {selected.education?.note ||
                        "Thông tin do người dùng tự khai"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 9. QUYỀN RIÊNG TƯ */}
              <div className="mobile-privacy-card">
                <div className="privacy-icon-box">
                  <ShieldCheck size={18} />
                </div>
                <div className="privacy-content">
                  <strong className="privacy-title">
                    Hiển thị: Người dùng Nova
                  </strong>
                  <p className="privacy-desc">
                    {selected.privacyNotice ||
                      "Email, số điện thoại, tài khoản ngân hàng và địa chỉ ví không xuất hiện trong hồ sơ này."}
                  </p>
                </div>
              </div>
            </div>

            {/* FADE NHẸ DƯỚI ĐÁY BÁO HIỆU CÒN NỘI DUNG CUỘN */}
            <div className="candidate-profile-fade" aria-hidden="true" />
          </div>
        ) : (
          <div className="application-empty workspace">
            <UserRoundCheck size={36} />
            <strong>Chọn một hồ sơ để bắt đầu</strong>
            <small>Nhấp vào bất kỳ ứng viên nào bên trái để xem hồ sơ chi tiết</small>
          </div>
        )}
      </section>
    </div>
  );
}
