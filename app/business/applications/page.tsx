import { ApplicationsView } from "@/components/business/ApplicationsView";
import { BusinessShell } from "@/components/business/BusinessShell";
import { isBusinessThemeId } from "@/types/theme";

export default async function BusinessApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    candidate?: string;
    jobId?: string;
    theme?: string;
  }>;
}) {
  const { candidate, jobId, theme } = await searchParams;
  const initialTheme = isBusinessThemeId(theme) ? theme : undefined;
  return (
    <BusinessShell active="applications" initialTheme={initialTheme}>
      <ApplicationsView initialCandidateId={candidate} filterJobId={jobId} />
    </BusinessShell>
  );
}
