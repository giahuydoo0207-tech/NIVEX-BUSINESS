import { BusinessShell } from "@/components/business/BusinessShell";
import { BusinessProfileView } from "@/components/business/BusinessProfileView";

export const dynamic = "force-dynamic";

export default function BusinessProfilePage() {
  return (
    <BusinessShell active="profile">
      <BusinessProfileView />
    </BusinessShell>
  );
}
