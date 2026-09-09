"use client";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { useInvoices } from "@/components/business/useInvoices";
import { InvoiceTable } from "@/components/business/InvoiceTable";
export function InvoicesView() {
  const { invoices, storageError } = useInvoices();
  return (
    <>
      <div className="page-heading-row">
        <div>
          <h1>Hóa đơn</h1>
          <p>Quản lý yêu cầu thanh toán cho toàn bộ đội ngũ.</p>
        </div>
        <Link className="business-primary-button" href="/business/invoices/new">
          <FilePlus2 size={17} />
          Tạo hóa đơn
        </Link>
      </div>
      {storageError && (
        <p className="form-error" role="alert">
          Không đọc được hóa đơn đã lưu trên trình duyệt này.
        </p>
      )}
      <InvoiceTable invoices={invoices} />
    </>
  );
}
