"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BellRing,
  BriefcaseBusiness,
  FilePlus2,
  Radio,
  Search,
  UsersRound,
} from "lucide-react";
import { useJobs } from "@/components/business/useJobs";
import { useApplications } from "@/components/business/useApplications";
import { jobStatusLabels, jobStatusTone } from "@/lib/jobs";
import { formatMinorAmount } from "@/lib/money";
import { formatDate } from "@/lib/portal-data";
import type { JobPost, JobPostStatus } from "@/types/job";

const tabs: Array<{ value: "ALL" | JobPostStatus; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "PUBLISHED", label: "Đang tuyển" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "CLOSED", label: "Đã đóng" },
];

function budgetLabel(job: JobPost) {
  const minimum = formatMinorAmount(job.budgetMinMinor, 6, 2);
  const maximum = formatMinorAmount(job.budgetMaxMinor, 6, 2);
  return `${minimum}-${maximum} USDC${job.paymentType === "HOURLY" ? "/giờ" : ""}`;
}

export function JobsView() {
  const { jobs, storageError } = useJobs();
  const { getJobApplicationCount } = useApplications();
  const [status, setStatus] = useState<"ALL" | JobPostStatus>("ALL");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      jobs.filter(
        (job) =>
          (status === "ALL" || job.status === status) &&
          `${job.title} ${job.category} ${job.skills.join(" ")}`
            .toLocaleLowerCase("vi")
            .includes(query.toLocaleLowerCase("vi")),
      ),
    [jobs, query, status],
  );

  const published = jobs.filter((job) => job.status === "PUBLISHED");
  const applicants = published.reduce(
    (sum, job) => sum + getJobApplicationCount(job.id),
    0,
  );
  const matches = published.reduce(
    (sum, job) => sum + job.matchedTalentCount,
    0,
  );

  return (
    <div className="jobs-view">
      <div className="page-heading-row">
        <div>
          <h1>Cơ hội việc làm</h1>
          <p>Đăng công việc remote và quản lý lượt ứng tuyển từ Nova.</p>
        </div>
        <div className="jobs-heading-actions">
          <Link className="business-secondary-button" href="/business/applications">
            <UsersRound size={17} />
            Xem ứng viên
          </Link>
          <Link className="business-primary-button" href="/business/jobs/new">
            <FilePlus2 size={17} />
            Đăng cơ hội
          </Link>
        </div>
      </div>

      <section className="jobs-command-strip" aria-label="Tổng quan tuyển dụng">
        <article>
          <span className="jobs-command-icon blue">
            <Radio size={18} />
          </span>
          <span>
            <small>ĐANG TUYỂN</small>
            <strong>{published.length} bài</strong>
          </span>
        </article>
        <article>
          <span className="jobs-command-icon green">
            <UsersRound size={18} />
          </span>
          <span>
            <small>ỨNG VIÊN</small>
            <strong>{applicants} hồ sơ</strong>
          </span>
        </article>
        <article>
          <span className="jobs-command-icon amber">
            <BellRing size={18} />
          </span>
          <span>
            <small>PHÙ HỢP</small>
            <strong>{matches} người</strong>
          </span>
        </article>
        <div className="mobile-delivery-status">
          <i />
          <span>
            <small>MOBILE DELIVERY</small>
            <strong>Chờ kết nối FCM</strong>
          </span>
        </div>
      </section>

      {storageError && (
        <p className="form-error" role="alert">
          Không đọc được bài đăng đã lưu trên trình duyệt này.
        </p>
      )}

      <section className="jobs-list-section">
        <div className="jobs-toolbar">
          <div
            className="table-tabs"
            role="tablist"
            aria-label="Trạng thái bài đăng"
          >
            {tabs.map((tab) => (
              <button
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                className={status === tab.value ? "active" : undefined}
                onClick={() => setStatus(tab.value)}
                key={tab.value}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label className="search-input">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm vị trí hoặc kỹ năng..."
              aria-label="Tìm cơ hội"
            />
          </label>
        </div>

        <div className="job-post-list">
          {rows.map((job) => (
            <article className="job-post-row" key={job.id}>
              <span className="job-post-mark">
                <BriefcaseBusiness size={20} />
              </span>
              <div className="job-post-copy">
                <div className="job-post-title-line">
                  <Link href={`/business/jobs/${job.id}`} className="job-post-title-link">
                    {job.title}
                  </Link>
                  <span className={`status-badge ${jobStatusTone(job.status)}`}>
                    <i />
                    {jobStatusLabels[job.status]}
                  </span>
                </div>
                <p>{job.summary}</p>
                <div className="job-skill-list">
                  {job.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
              <dl className="job-post-metrics">
                <div>
                  <dt>Ngân sách</dt>
                  <dd>{budgetLabel(job)}</dd>
                </div>
                <div>
                  <dt>Ứng viên</dt>
                  <dd>{getJobApplicationCount(job.id)}</dd>
                </div>
                <div>
                  <dt>Hạn ứng tuyển</dt>
                  <dd>{formatDate(job.applicationDeadline)}</dd>
                </div>
              </dl>
              <Link
                href={`/business/jobs/${job.id}`}
                className="icon-button job-row-action"
                aria-label={`Xem chi tiết ${job.title}`}
              >
                <ArrowUpRight size={17} />
              </Link>
            </article>
          ))}
        </div>

        {rows.length === 0 && (
          <div className="empty-state">
            <Search size={28} />
            <h3>Không tìm thấy bài đăng</h3>
            <p>Thử từ khóa khác hoặc chuyển về tất cả trạng thái.</p>
          </div>
        )}
      </section>
    </div>
  );
}
