import { BusinessShell } from "@/components/business/BusinessShell";
import { ContractorsView } from "@/components/business/ContractorsView";
export default function ContractorsPage() {
  return (
    <BusinessShell active="contractors">
      <ContractorsView />
    </BusinessShell>
  );
}
