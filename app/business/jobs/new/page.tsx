import { BusinessShell } from "@/components/business/BusinessShell";
import { JobPostForm } from "@/components/business/JobPostForm";

export default function NewJobPage() {
  return (
    <BusinessShell
      active="jobs"
      breadcrumbLabel="Đăng cơ hội"
      activeAction="newJob"
    >
      <div className="page-heading-row job-create-heading">
        <div>
          <p className="eyebrow">CƠ HỘI MỚI</p>
          <h1>Đăng công việc remote</h1>
          <p>Tạo một bài tuyển rõ ngân sách, kỹ năng và thời hạn ứng tuyển.</p>
        </div>
      </div>
      <JobPostForm />
    </BusinessShell>
  );
}
