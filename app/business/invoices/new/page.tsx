import { BusinessShell } from "@/components/business/BusinessShell";
import { InvoiceAmountForm } from "@/components/business/InvoiceAmountForm";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ contractor?: string }>;
}) {
  const { contractor } = await searchParams;
  return (
    <BusinessShell
      active="invoices"
      breadcrumbLabel="Tạo hóa đơn"
      activeAction="newInvoice"
    >
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">HÓA ĐƠN MỚI</p>
          <h1>Tạo yêu cầu thanh toán</h1>
          <p>Chọn người nhận và kiểm tra thông tin khoản chi trả.</p>
        </div>
      </div>
      <InvoiceAmountForm initialContractorId={contractor} />
    </BusinessShell>
  );
}
