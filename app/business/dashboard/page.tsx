import { BusinessShell } from "@/components/business/BusinessShell";
import { Dashboard } from "@/components/business/Dashboard";
export default function BusinessDashboardPage() {
  return (
    <BusinessShell active="dashboard">
      <Dashboard />
    </BusinessShell>
  );
}
