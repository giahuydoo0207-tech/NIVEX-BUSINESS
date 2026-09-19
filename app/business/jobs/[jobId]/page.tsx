import { BusinessShell } from "@/components/business/BusinessShell";
import { JobDetailView } from "@/components/business/JobDetailView";

export default async function BusinessJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return (
    <BusinessShell active="jobs">
      <JobDetailView jobId={jobId} />
    </BusinessShell>
  );
}
