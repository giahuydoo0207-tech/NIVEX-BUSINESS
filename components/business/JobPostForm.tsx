"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  Check,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { demoOrganization } from "@/lib/business-demo-data";
import { formatMinorAmount, parseUsdcToMinor } from "@/lib/money";
import { ChipInput } from "@/components/ui/ChipInput";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type {
  JobEngagement,
  JobPaymentType,
  JobPost,
  JobPostStatus,
} from "@/types/job";
import {
  normalizeHashtag,
  normalizeSkill,
  validateHashtag,
  validateSkill,
} from "@/lib/hashtag";

const initialForm = {
  title: "",
  category: "Mobile Development",
  summary: "",
  coverPreviewUrl: "" as string | undefined,
  coverFileName: "" as string | undefined,
  skills: ["Flutter", "Dart", "Firebase"] as string[],
  hashtags: [] as string[],
  locationScope: "Việt Nam",
  engagement: "PROJECT" as JobEngagement,
  paymentType: "MILESTONE" as JobPaymentType,
  budgetMin: "",
  budgetMax: "",
  duration: "",
  applicationDeadline: "",
  notifyMatchingTalent: true,
};

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

export function JobPostForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<JobPostStatus | null>(null);

  function update<K extends keyof typeof initialForm>(
    key: K,
    value: (typeof initialForm)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function save(status: "DRAFT" | "PUBLISHED") {
    const minimum = parseUsdcToMinor(form.budgetMin);
    const maximum = parseUsdcToMinor(form.budgetMax);

    if (!form.title.trim()) return setError("Nhập tên vị trí cần tuyển.");
    if (!form.summary.trim()) return setError("Nhập mô tả công việc.");
    if (form.skills.length === 0) return setError("Vui lòng thêm ít nhất 1 kỹ năng.");
    if (!minimum.ok) return setError("Ngân sách tối thiểu: " + minimum.message);
    if (!maximum.ok) return setError("Ngân sách tối đa: " + maximum.message);
    if (BigInt(maximum.minor) < BigInt(minimum.minor)) {
      return setError("Ngân sách tối đa phải lớn hơn hoặc bằng tối thiểu.");
    }
    if (!form.duration.trim()) return setError("Nhập thời lượng dự kiến.");
    if (!form.applicationDeadline) return setError("Chọn hạn ứng tuyển.");

    setSaving(status);
    const now = new Date().toISOString();
    const id = `job-${crypto.randomUUID().slice(0, 8).toLowerCase()}`;
    const job: JobPost = {
      id,
      organizationId: demoOrganization.id,
      title: form.title.trim(),
      category: form.category,
      summary: form.summary.trim(),
      coverImageUrl: undefined,
      coverImageName: form.coverFileName,
      skills: form.skills,
      hashtags: form.hashtags,
      workMode: "REMOTE",
      locationScope: form.locationScope,
      engagement: form.engagement,
      paymentType: form.paymentType,
      budgetMinMinor: minimum.minor,
      budgetMaxMinor: maximum.minor,
      duration: form.duration.trim(),
      applicationDeadline: form.applicationDeadline,
      status,
      notifyMatchingTalent: status === "PUBLISHED" && form.notifyMatchingTalent,
      matchedTalentCount: 0,
      applicantCount: 0,
      createdAt: now,
      publishedAt: status === "PUBLISHED" ? now : undefined,
    };

    try {
      localStorage.setItem(`nivex.demo.job.${job.id}`, JSON.stringify(job));
    } catch {
      setSaving(null);
      return setError("Không lưu được bài đăng trên trình duyệt này.");
    }

    await new Promise((resolve) => setTimeout(resolve, 450));
    router.push("/business/jobs");
  }

  const minimum = parseUsdcToMinor(form.budgetMin);
  const maximum = parseUsdcToMinor(form.budgetMax);
  const previewBudget =
    minimum.ok && maximum.ok
      ? `${formatMinorAmount(minimum.minor, 6, 2)}-${formatMinorAmount(maximum.minor, 6, 2)} USDC`
      : "0 USDC";

  return (
    <div className="job-post-form">
      <section className="job-form-main">
        <div className="form-back-nav">
          <Link href="/business/jobs" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Quay lại danh sách cơ hội</span>
          </Link>
        </div>
        <div className="section-heading">
          <BriefcaseBusiness size={20} />
          <div>
            <h2>Nội dung công việc</h2>
            <p>Thông tin người tìm việc sẽ thấy trong ứng dụng Nova.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field full">
            <span>Tên vị trí</span>
            <input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Ví dụ: Flutter Developer - Payment Experience"
            />
          </label>
          <label className="field">
            <span>Nhóm chuyên môn</span>
            <select
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
            >
              <option>Mobile Development</option>
              <option>Web Development</option>
              <option>Product Design</option>
              <option>Blockchain Engineering</option>
              <option>Operations</option>
              <option>Marketing</option>
            </select>
          </label>
          <label className="field">
            <span>Hình thức cộng tác</span>
            <select
              value={form.engagement}
              onChange={(event) =>
                update("engagement", event.target.value as JobEngagement)
              }
            >
              {Object.entries(engagementLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field full">
            <span>Mô tả ngắn</span>
            <textarea
              rows={4}
              value={form.summary}
              onChange={(event) => update("summary", event.target.value)}
              placeholder="Mô tả kết quả cần bàn giao và trách nhiệm chính..."
            />
          </label>
          <div className="field full">
            <ImageUpload
              label="Ảnh bìa"
              value={form.coverPreviewUrl}
              fileName={form.coverFileName}
              onChange={(url, fileName) => {
                setForm((current) => ({
                  ...current,
                  coverPreviewUrl: url,
                  coverFileName: fileName,
                }));
              }}
              onError={(msg) => setError(msg)}
            />
          </div>
          <div className="field full">
            <span>Kỹ năng</span>
            <ChipInput
              values={form.skills}
              onChange={(skills) => update("skills", skills)}
              placeholder="Ví dụ: Flutter, Dart, Firebase..."
              normalizeItem={normalizeSkill}
              validateItem={validateSkill}
              onError={(msg) => setError(msg)}
            />
            <small>Nhấn Enter hoặc dấu phẩy để tạo từng kỹ năng.</small>
          </div>
          <div className="field full">
            <span>Hashtag</span>
            <ChipInput
              values={form.hashtags}
              onChange={(hashtags) => update("hashtags", hashtags)}
              placeholder="Ví dụ: mobiledev, remote, solana..."
              prefix="#"
              maxItems={5}
              normalizeItem={normalizeHashtag}
              validateItem={validateHashtag}
              onError={(msg) => setError(msg)}
            />
            <small>
              Tối đa 5 hashtag · dùng để hiển thị trên Cộng đồng, không dùng để ghép việc
            </small>
          </div>
        </div>

        <div className="job-form-divider" />

        <div className="section-heading">
          <Radio size={20} />
          <div>
            <h2>Phạm vi và ngân sách</h2>
            <p>Ngân sách được công khai bằng USDC trên bài đăng.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Ngân sách tối thiểu</span>
            <div className="job-budget-field">
              <input
                inputMode="decimal"
                value={form.budgetMin}
                onChange={(event) => update("budgetMin", event.target.value)}
                placeholder="0.00"
              />
              <strong>USDC</strong>
            </div>
          </label>
          <label className="field">
            <span>Ngân sách tối đa</span>
            <div className="job-budget-field">
              <input
                inputMode="decimal"
                value={form.budgetMax}
                onChange={(event) => update("budgetMax", event.target.value)}
                placeholder="0.00"
              />
              <strong>USDC</strong>
            </div>
          </label>
          <label className="field">
            <span>Cách thanh toán</span>
            <select
              value={form.paymentType}
              onChange={(event) =>
                update("paymentType", event.target.value as JobPaymentType)
              }
            >
              {Object.entries(paymentLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Thời lượng dự kiến</span>
            <input
              value={form.duration}
              onChange={(event) => update("duration", event.target.value)}
              placeholder="Ví dụ: 6-8 tuần"
            />
          </label>
          <label className="field">
            <span>Phạm vi ứng viên</span>
            <select
              value={form.locationScope}
              onChange={(event) => update("locationScope", event.target.value)}
            >
              <option>Việt Nam</option>
              <option>Đông Nam Á</option>
              <option>Châu Á - Thái Bình Dương</option>
              <option>Toàn cầu</option>
            </select>
          </label>
          <label className="field">
            <span>Hạn ứng tuyển</span>
            <input
              type="date"
              value={form.applicationDeadline}
              onChange={(event) =>
                update("applicationDeadline", event.target.value)
              }
            />
          </label>
          <label className="check-field full job-notify-check">
            <input
              type="checkbox"
              checked={form.notifyMatchingTalent}
              onChange={(event) =>
                update("notifyMatchingTalent", event.target.checked)
              }
            />
            <BellRing size={18} />
            <span>
              <strong>Thông báo cho ứng viên phù hợp</strong>
              <small>Yêu cầu gửi push sẽ được tạo khi bài được đăng.</small>
            </span>
          </label>
        </div>
      </section>

      <aside className="job-publish-panel">
        {form.coverPreviewUrl && (
          <div className="job-preview-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.coverPreviewUrl} alt="Ảnh bìa bài đăng" />
          </div>
        )}
        <div className="job-preview-status">
          <i /> BẢN XEM TRƯỚC
        </div>
        <h2>{form.title.trim() || "Tên vị trí công việc"}</h2>
        <p>{form.category} · Remote</p>
        <strong className="job-preview-budget">{previewBudget}</strong>
        {form.hashtags.length > 0 && (
          <div className="job-preview-hashtags">
            {form.hashtags.map((tag) => (
              <span className="job-preview-hashtag-item" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}
        <dl>
          <div>
            <dt>Cộng tác</dt>
            <dd>{engagementLabels[form.engagement]}</dd>
          </div>
          <div>
            <dt>Thanh toán</dt>
            <dd>{paymentLabels[form.paymentType]}</dd>
          </div>
          <div>
            <dt>Phạm vi</dt>
            <dd>{form.locationScope}</dd>
          </div>
        </dl>
        <div className="job-publish-assurance">
          <ShieldCheck size={17} />
          <span>
            Chỉ tài khoản doanh nghiệp đã xác minh mới được đăng công việc.
          </span>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="business-primary-button wide"
          disabled={saving !== null}
          onClick={() => save("PUBLISHED")}
        >
          {saving === "PUBLISHED" ? (
            <Check size={17} />
          ) : (
            <ArrowRight size={17} />
          )}
          {saving === "PUBLISHED" ? "Đang đăng..." : "Đăng cơ hội"}
        </button>
        <button
          type="button"
          className="business-secondary-button wide"
          disabled={saving !== null}
          onClick={() => save("DRAFT")}
        >
          <ArrowLeft size={17} />
          {saving === "DRAFT" ? "Đang lưu..." : "Lưu bản nháp"}
        </button>
      </aside>
    </div>
  );
}
