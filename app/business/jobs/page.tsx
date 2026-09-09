import { BusinessShell } from "@/components/business/BusinessShell";
import { JobsView } from "@/components/business/JobsView";

export default function JobsPage() {
  return (
    <BusinessShell active="jobs">
      <JobsView />
    </BusinessShell>
  );
}
