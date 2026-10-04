import { BusinessShell } from "@/components/business/BusinessShell";
import { PersonalInfoView } from "@/components/business/PersonalInfoView";

export const dynamic = "force-dynamic";

export default function BusinessPersonalInfoPage() {
  return (
    <BusinessShell active="personalInfo">
      <PersonalInfoView />
    </BusinessShell>
  );
}
