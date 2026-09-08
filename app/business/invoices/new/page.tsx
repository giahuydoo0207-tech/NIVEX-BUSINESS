import { BusinessShell } from "@/components/business/BusinessShell";
import { InvoiceAmountForm } from "@/components/business/InvoiceAmountForm";

export default function NewInvoicePage() {
  return (
    <BusinessShell active="invoices">
      <div className="page-heading-row"><div><p className="eyebrow">HÓA ĐƠN</p><h1>Tạo yêu cầu thanh toán</h1><p>Số USDC được nhập tự do và lưu chính xác bằng minor units.</p></div></div>
      <InvoiceAmountForm />
    </BusinessShell>
  );
}
