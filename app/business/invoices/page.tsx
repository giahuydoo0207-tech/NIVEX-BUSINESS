import { BusinessShell } from "@/components/business/BusinessShell";
import { InvoicesView } from "@/components/business/InvoicesView";
export default function InvoicesPage() {
  return (
    <BusinessShell active="invoices">
      <InvoicesView />
    </BusinessShell>
  );
}
