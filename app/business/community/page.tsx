import { BusinessShell } from "@/components/business/BusinessShell";
import { CommunityView } from "@/components/business/CommunityView";

export default function BusinessCommunityPage() {
  return (
    <BusinessShell active="community">
      <CommunityView />
    </BusinessShell>
  );
}
