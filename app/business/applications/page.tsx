import { ApplicationsView } from "@/components/business/ApplicationsView";
import { BusinessShell } from "@/components/business/BusinessShell";

export default async function BusinessApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ candidate?: string }>;
}) {
  const { candidate } = await searchParams;
  return (
    <BusinessShell active="applications">
      <ApplicationsView initialCandidateId={candidate} />
    </BusinessShell>
  );
}
