"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Coins,
  MapPin,
  Search,
  UsersRound,
  Clock,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { useJobs } from "@/components/business/useJobs";
import { useApplications } from "@/components/business/useApplications";
import { jobStatusLabels, jobStatusTone } from "@/lib/jobs";
import { formatMinorAmount } from "@/lib/money";
import type { JobEngagement, JobPaymentType } from "@/types/job";

const engagementLabels: Record<JobEngagement, string> = {
  PROJECT: "Theo dự án",
  CONTRACT: "Hợp đồng",
  PART_TIME: "Bán thời gian",
};

const paymentLabels: Record<JobPaymentType, string> = {
  FIXED: "Trọn gói",
  MILESTONE: "Theo cột mốc",
  HOURLY: "Theo giờ",
};

function formatDate(value: string) {
  if (!value) return "Chưa xác định";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function JobDetailView({ jobId }: { jobId: string }) {
  const { jobs } = useJobs();
  const { getJobApplicationCount } = useApplications();

  const job = jobs.find((j) => j.id === jobId);
  const applicationCount = getJobApplicationCount(jobId);

  if (!job) {
    return (
      <div className="job-detail-not-found">
        <div className="job-detail-not-found-card">
          <Search size={36} className="not-found-icon" />
          <h2>Không tìm thấy cơ hội việc làm này.</h2>
          <p>
            Cơ hội việc làm này có thể đã bị đóng hoặc đường dẫn không còn chính xác.
          </p>
          <Link href="/business/jobs" className="business-secondary-button">
            <ArrowLeft size={16} />
            <span>Quay lại danh sách cơ hội</span>
          </Link>
        </div>
      </div>
    );
  }

  const budgetText = `${formatMinorAmount(job.budgetMinMinor, 6, 2)} - ${formatMinorAmount(job.budgetMaxMinor, 6, 2)} USDC`;

  return (
    <div className="job-detail-page-container">
      <div className="job-detail-nav">
        <Link href="/business/jobs" className="job-detail-back-link">
          <ArrowLeft size={16} />
          <span>Danh sách việc làm</span>
        </Link>
        <div className="job-detail-top-actions">
          <Link
            href={`/business/applications?jobId=${job.id}`}
            className="business-primary-button"
          >
            <UsersRound size={17} />
            <span>Xem ứng viên ({applicationCount})</span>
          </Link>
        </div>
      </div>

      <article className="job-detail-card">
        {job.coverImageUrl && (
          <div className="job-detail-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={job.coverImageUrl} alt={job.title} />
          </div>
        )}

        <header className="job-detail-header">
          <div className="job-detail-title-group">
            <div className="job-detail-badge-line">
              <span className={`status-badge ${jobStatusTone(job.status)}`}>
                <i />
                {jobStatusLabels[job.status]}
              </span>
              <span className="job-detail-category-badge">{job.category}</span>
              <span className="job-detail-scope-badge">
                <MapPin size={13} />
                {job.locationScope} · Remote
              </span>
            </div>
            <h1>{job.title}</h1>
          </div>
        </header>

        <section className="job-detail-metrics-grid">
          <div className="metric-box">
            <Coins size={18} className="metric-icon" />
            <div>
              <small>NGÂN SÁCH</small>
              <strong>{budgetText}</strong>
            </div>
          </div>
          <div className="metric-box">
            <BriefcaseBusiness size={18} className="metric-icon" />
            <div>
              <small>HÌNH THỨC</small>
              <strong>{engagementLabels[job.engagement]}</strong>
            </div>
          </div>
          <div className="metric-box">
            <Clock size={18} className="metric-icon" />
            <div>
              <small>THỜI LƯỢNG</small>
              <strong>{job.duration}</strong>
            </div>
          </div>
          <div className="metric-box">
            <CalendarDays size={18} className="metric-icon" />
            <div>
              <small>HẠN ỨNG TUYỂN</small>
              <strong>{formatDate(job.applicationDeadline)}</strong>
            </div>
          </div>
          <div className="metric-box">
            <UsersRound size={18} className="metric-icon" />
            <div>
              <small>ỨNG VIÊN ĐÃ NỘP</small>
              <strong>{applicationCount} hồ sơ</strong>
            </div>
          </div>
          <div className="metric-box">
            <CheckCircle2 size={18} className="metric-icon" />
            <div>
              <small>THANH TOÁN</small>
              <strong>{paymentLabels[job.paymentType]}</strong>
            </div>
          </div>
        </section>

        <div className="job-detail-divider" />

        <section className="job-detail-section">
          <h2>Mô tả công việc & Trách nhiệm</h2>
          <p className="job-detail-summary">{job.summary}</p>
        </section>

        <section className="job-detail-section">
          <h2>Kỹ năng yêu cầu</h2>
          <div className="job-skill-list">
            {job.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </section>

        {job.hashtags && job.hashtags.length > 0 && (
          <section className="job-detail-section">
            <h2>Hashtag cộng đồng</h2>
            <div className="job-detail-hashtags">
              {job.hashtags.map((tag) => (
                <span className="job-detail-hashtag-chip" key={tag}>
                  <Tag size={12} />
                  #{tag}
                </span>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
