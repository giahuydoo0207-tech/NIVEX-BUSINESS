"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Search,
  X,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { PortalDialog } from "@/components/ui/PortalDialog";
import { demoContractors } from "@/lib/business-demo-data";
import { formatUsdc } from "@/lib/money";
import { formatDate, statusLabels, statusTone } from "@/lib/portal-data";
import type { Invoice } from "@/types/invoice";
export function InvoiceTable({
  invoices,
  compact = false,
}: {
  invoices: Invoice[];
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const filtered = useMemo(
    () => invoices.filter((item) => status === "ALL" || item.status === status),
    [invoices, status],
  );
  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        id: "invoiceNumber",
        accessorFn: (item) => item.invoiceNumber + " " + item.description,
        header: "Hóa đơn",
        cell: ({ row }) => (
          <button
            className="invoice-link"
            onClick={() => setSelected(row.original)}
          >
            <span className="file-icon">
              <FileText size={17} />
            </span>
            <span>
              <strong>{row.original.invoiceNumber}</strong>
              <small>{row.original.description}</small>
            </span>
          </button>
        ),
      },
      {
        id: "recipient",
        accessorFn: (item) =>
          demoContractors.find((person) => person.id === item.contractorId)
            ?.displayName || "Người nhận",
        header: "Người nhận",
        cell: ({ getValue }) => (
          <span className="table-person">
            <span className="avatar small">
              {String(getValue())
                .split(" ")
                .slice(-2)
                .map((word) => word[0])
                .join("")}
            </span>
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "sourceAmountMinor",
        header: "Số tiền",
        sortingFn: (a, b) =>
          BigInt(a.original.sourceAmountMinor) >
          BigInt(b.original.sourceAmountMinor)
            ? 1
            : BigInt(a.original.sourceAmountMinor) <
                BigInt(b.original.sourceAmountMinor)
              ? -1
              : 0,
        cell: ({ row }) => (
          <strong className="table-amount">
            {formatUsdc(row.original.sourceAmountMinor)}
          </strong>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="muted">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <span className={"status-badge " + statusTone(row.original.status)}>
            <i />
            {statusLabels[row.original.status]}
          </span>
        ),
      },
      {
        id: "action",
        header: "",
        cell: ({ row }) => (
          <button
            className="icon-button"
            aria-label={"Xem " + row.original.invoiceNumber}
            onClick={() => setSelected(row.original)}
          >
            <ArrowUpRight size={17} />
          </button>
        ),
      },
    ],
    [],
  );
  const table = useReactTable({
    data: filtered,
    columns,
    state: { globalFilter: query, sorting },
    onGlobalFilterChange: setQuery,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: compact ? 5 : 8 } },
  });
  function exportCsv() {
    const cell = (value: string) =>
      '"' +
      (/^[=+\-@]/.test(value) ? "'" : "") +
      value.replaceAll('"', '""') +
      '"';
    const rows = [
      ["Hóa đơn", "Người nhận", "USDC", "Ngày tạo", "Trạng thái"],
      ...table
        .getFilteredRowModel()
        .rows.map(({ original: item }) => [
          item.invoiceNumber,
          demoContractors.find((person) => person.id === item.contractorId)
            ?.displayName || "",
          formatUsdc(item.sourceAmountMinor),
          formatDate(item.createdAt),
          statusLabels[item.status],
        ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8;" },
      ),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nova-hoa-don.csv";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="invoice-table-section">
      <div className="section-heading-row">
        <div>
          <h2>{compact ? "Hóa đơn gần đây" : "Danh sách hóa đơn"}</h2>
          <p>
            {compact
              ? "Theo dõi những khoản thanh toán của đội ngũ."
              : "Hóa đơn mẫu và yêu cầu bạn tạo trên trình duyệt này."}
          </p>
        </div>
        {compact ? (
          <Link className="text-link" href="/business/invoices">
            Xem tất cả
            <ArrowUpRight size={16} />
          </Link>
        ) : (
          <button className="business-secondary-button" onClick={exportCsv}>
            <Download size={16} />
            Xuất CSV
          </button>
        )}
      </div>
      <div className="table-toolbar">
        <div className="table-tabs" role="group" aria-label="Lọc trạng thái">
          {[
            ["ALL", "Tất cả"],
            ["AWAITING_PAYMENT", "Chờ thanh toán"],
            ["PAID_OUT", "Hoàn tất"],
            ["DRAFT", "Bản nháp"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={status === value}
              className={status === value ? "active" : ""}
              onClick={() => {
                setStatus(value);
                table.setPageIndex(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-input">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              table.setPageIndex(0);
            }}
            placeholder="Tìm hóa đơn, người nhận..."
            aria-label="Tìm hóa đơn"
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Xóa tìm kiếm"
              onClick={() => setQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </label>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id}>
                    {header.column.getCanSort() ? (
                      <button onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <ArrowDownUp size={12} />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!table.getFilteredRowModel().rows.length && (
        <div className="empty-state">
          <Search size={28} />
          <h3>Không tìm thấy hóa đơn</h3>
          <p>Thử tên người nhận khác hoặc đổi bộ lọc.</p>
          <button
            className="business-secondary-button"
            onClick={() => {
              setQuery("");
              setStatus("ALL");
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
      <div className="table-pagination">
        <span>
          {table.getFilteredRowModel().rows.length} hóa đơn
          {compact ? " · Dữ liệu minh họa" : ""}
        </span>
        <div>
          <span>
            Trang {table.getState().pagination.pageIndex + 1}/
            {Math.max(1, table.getPageCount())}
          </span>
          <button
            className="icon-button"
            aria-label="Trang trước"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Trang sau"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <PortalDialog
        title={selected?.invoiceNumber || "Hóa đơn"}
        description={
          selected?.id.startsWith("sample-")
            ? "Hóa đơn minh họa. Không có giao dịch thật."
            : "Yêu cầu thanh toán lưu trên trình duyệt này."
        }
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <div className="dialog-body">
            <span className={"status-badge " + statusTone(selected.status)}>
              {statusLabels[selected.status]}
            </span>
            <h3 className="detail-amount">
              {formatUsdc(selected.sourceAmountMinor)}
            </h3>
            <p>{selected.description}</p>
            <dl className="checkout-details">
              <div>
                <dt>Người nhận</dt>
                <dd>
                  {
                    demoContractors.find(
                      (person) => person.id === selected.contractorId,
                    )?.displayName
                  }
                </dd>
              </div>
              <div>
                <dt>Hạn thanh toán</dt>
                <dd>{formatDate(selected.dueDate)}</dd>
              </div>
              <div>
                <dt>Mạng</dt>
                <dd>Solana Devnet</dd>
              </div>
            </dl>
            {!selected.id.startsWith("sample-") && (
              <Link
                href={"/pay/" + selected.paymentRequestId}
                className="business-primary-button"
              >
                Mở trang thanh toán
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        )}
      </PortalDialog>
    </section>
  );
}
