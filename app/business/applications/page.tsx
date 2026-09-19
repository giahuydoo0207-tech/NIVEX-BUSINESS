import { ApplicationsView } from "@/components/business/ApplicationsView";
import { BusinessShell } from "@/components/business/BusinessShell";

export default async function BusinessApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ candidate?: string; jobId?: string }>;
}) {
  const { candidate, jobId } = await searchParams;
  return (
    <BusinessShell active="applications">
      <ApplicationsView initialCandidateId={candidate} filterJobId={jobId} />
    </BusinessShell>
  );
}
