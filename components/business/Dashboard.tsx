"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  FilePlus2,
  FileText,
  Info,
  UsersRound,
} from "lucide-react";
import { useInvoices } from "@/components/business/useInvoices";
import { InvoiceTable } from "@/components/business/InvoiceTable";
import { formatUsdc } from "@/lib/money";
import { formatDate, sumMinor } from "@/lib/portal-data";
import { demoContractors } from "@/lib/business-demo-data";

export function Dashboard() {
  const { invoices, storageError } = useInvoices();
  const [period, setPeriod] = useState("90");
  const [from, setFrom] = useState("2026-06-13");
  const [to, setTo] = useState("2026-09-10");
  const [compare, setCompare] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [maxBins, setMaxBins] = useState(92);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setMaxBins(media.matches ? 32 : 92);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const filtered = useMemo(
    () =>
      invoices.filter(
        (item) =>
          item.createdAt.slice(0, 10) >= from &&
          item.createdAt.slice(0, 10) <= to,
      ),
    [invoices, from, to],
  );
  const paid = filtered.filter((item) => item.status === "PAID_OUT");
  const pending = filtered.filter((item) => item.status === "AWAITING_PAYMENT");
  const days = useMemo(() => {
    const start = Date.parse(from),
      end = Date.parse(to);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start)
      return [];
    const totalDays = Math.floor((end - start) / 86400000) + 1;
    const binSize = Math.max(1, Math.ceil(totalDays / maxBins));
    const length = Math.ceil(totalDays / binSize);
    return Array.from({ length }, (_, index) => {
      const day = new Date(start + index * binSize * 86400000)
        .toISOString()
        .slice(0, 10);
      const next = new Date(start + (index + 1) * binSize * 86400000)
        .toISOString()
        .slice(0, 10);
      const rows = filtered.filter(
        (item) =>
          item.createdAt.slice(0, 10) >= day &&
          item.createdAt.slice(0, 10) < next,
      );
      const previousStart = new Date(
        start - (end - start + 86400000) + index * binSize * 86400000,
      )
        .toISOString()
        .slice(0, 10);
      const previousEnd = new Date(
        start - (end - start + 86400000) + (index + 1) * binSize * 86400000,
      )
        .toISOString()
        .slice(0, 10);
      const lastDay = new Date(
        Math.min(end, start + ((index + 1) * binSize - 1) * 86400000),
      )
        .toISOString()
        .slice(0, 10);
      return {
        day,
        lastDay,
        count: rows.length,
        amount: sumMinor(rows),
        previous: invoices.filter(
          (item) =>
            item.createdAt.slice(0, 10) >= previousStart &&
            item.createdAt.slice(0, 10) < previousEnd,
        ).length,
      };
    });
  }, [filtered, from, to, invoices, maxBins]);
  const maxCount = Math.max(
    6,
    ...days.map((day) => Math.max(day.count, day.previous)),
  );
  function changePeriod(value: string) {
    setPeriod(value);
    if (value === "custom") return;
    const end = new Date("2026-09-10T00:00:00Z");
    setTo(end.toISOString().slice(0, 10));
    setFrom(
      new Date(end.getTime() - (Number(value) - 1) * 86400000)
        .toISOString()
        .slice(0, 10),
    );
  }
  return (
    <>
      <div className="page-heading-row">
        <div>
          <h1>Tổng quan</h1>
          <p>Mọi khoản thanh toán, trong một tầm nhìn.</p>
        </div>
        <Link className="business-primary-button" href="/business/invoices/new">
          <FilePlus2 size={17} />
          Tạo hóa đơn
        </Link>
      </div>
      <div className="dashboard-controls">
        <div className="date-controls">
          <label className="period-select">
            <CalendarDays size={16} />
            <select
              aria-label="Khoảng thời gian"
              value={period}
              onChange={(event) => changePeriod(event.target.value)}
            >
              <option value="90">90 ngày</option>
              <option value="30">30 ngày</option>
              <option value="7">7 ngày</option>
              <option value="custom">Tùy chọn</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <span className="control-separator" />
          <label className="date-field">
            <span className="sr-only">Từ ngày</span>
            <input
              type="date"
              aria-label="Từ ngày"
              value={from}
              max={to}
              onChange={(event) => {
                setPeriod("custom");
                setFrom(event.target.value);
              }}
            />
          </label>
          <span className="muted">→</span>
          <label className="date-field">
            <span className="sr-only">Đến ngày</span>
            <input
              type="date"
              aria-label="Đến ngày"
              value={to}
              min={from}
              onChange={(event) => {
                setPeriod("custom");
                setTo(event.target.value);
              }}
            />
          </label>
        </div>
        <label className="compare-control">
          <input
            type="checkbox"
            checked={compare}
            onChange={(event) => setCompare(event.target.checked)}
          />
          So sánh kỳ trước
        </label>
      </div>
      {storageError && (
        <p className="form-error" role="alert">
          Không đọc được hóa đơn đã lưu. Dữ liệu minh họa vẫn khả dụng.
        </p>
      )}
      <section
        className="metric-grid"
        aria-label="Chỉ số trong khoảng thời gian đã chọn"
      >
        <article>
          <p>
            <span className="metric-icon blue">
              <ArrowUpRight size={16} />
            </span>
            Đã thanh toán
            <Info size={13} />
          </p>
          <strong>
            {formatUsdc(sumMinor(paid)).replace(" USDC", "")}
            <small>USDC</small>
          </strong>
          <span className="metric-caption">
            <span className="success-text">{paid.length} hóa đơn</span>hoàn tất
            trong kỳ
          </span>
        </article>
        <article>
          <p>
            <span className="metric-icon amber">
              <Clock3 size={16} />
            </span>
            Chờ thanh toán
            <Info size={13} />
          </p>
          <strong>
            {formatUsdc(sumMinor(pending)).replace(" USDC", "")}
            <small>USDC</small>
          </strong>
          <span className="metric-caption">
            <span className="warning-text">{pending.length} hóa đơn</span>cần xử
            lý
          </span>
        </article>
        <article>
          <p>
            <span className="metric-icon green">
              <FileText size={16} />
            </span>
            Tổng hóa đơn
            <Info size={13} />
          </p>
          <strong>
            {filtered.length}
            <small>hóa đơn</small>
          </strong>
          <span className="metric-caption">
            Theo ngày tạo trong khoảng đã chọn
          </span>
        </article>
        <article>
          <p>
            <span className="metric-icon neutral">
              <UsersRound size={16} />
            </span>
            Nhân sự liên kết
            <Info size={13} />
          </p>
          <strong>
            {demoContractors.length}
            <small>người nhận</small>
          </strong>
          <span className="metric-caption">
            <span className="success-text">
              {
                demoContractors.filter(
                  (item) => item.payoutReadiness === "READY",
                ).length
              }{" "}
              sẵn sàng
            </span>
            trong không gian
          </span>
        </article>
      </section>
      <section className="activity-section">
        <div className="section-heading-row">
          <div>
            <h2>
              Hoạt động thanh toán
              <Info size={14} />
            </h2>
            <p>Hóa đơn được tạo trong khoảng thời gian đã chọn</p>
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Kỳ hiện tại
            </span>
            {compare && (
              <span>
                <i className="previous" />
                Kỳ trước
              </span>
            )}
          </div>
        </div>
        <div className="heatmap-layout">
          <div className="chart-y-labels">
            <span>{maxCount}</span>
            <span>{Math.round(maxCount / 2)}</span>
            <span>0</span>
          </div>
          <div className="heatmap-main">
            <div className="heatmap" onMouseLeave={() => setHover(null)}>
              {days.map((day, index) => (
                <button
                  key={day.day}
                  className={
                    "heatmap-column" + (hover === index ? " is-hovered" : "")
                  }
                  style={{ gridTemplateRows: `repeat(${16}, 1fr)` }}
                  aria-label={
                    formatDate(day.day) +
                    (day.lastDay !== day.day
                      ? " đến " + formatDate(day.lastDay)
                      : "") +
                    ": " +
                    day.count +
                    " hóa đơn, " +
                    formatUsdc(day.amount)
                  }
                  onMouseEnter={() => setHover(index)}
                  onFocus={() => setHover(index)}
                  onBlur={() => setHover(null)}
                  onClick={() => setHover(hover === index ? null : index)}
                >
                  {Array.from({ length: 16 }, (_, row) => (
                    <span
                      key={row}
                      className={
                        16 - row <= Math.ceil((day.count / maxCount) * 16)
                          ? "filled"
                          : compare &&
                              16 - row <=
                                Math.ceil((day.previous / maxCount) * 16)
                            ? "previous"
                            : ""
                      }
                    />
                  ))}
                </button>
              ))}
            </div>
            <div className="chart-x-labels">
              {days
                .filter(
                  (_, i) =>
                    i === 0 ||
                    i === Math.floor(days.length / 3) ||
                    i === Math.floor((days.length * 2) / 3) ||
                    i === days.length - 1,
                )
                .map((day) => (
                  <span key={day.day}>{formatDate(day.day).slice(0, 5)}</span>
                ))}
            </div>
          </div>
        </div>
        <div className="chart-readout" aria-live="polite">
          {hover !== null && days[hover] ? (
            <>
              <strong>
                {formatDate(days[hover].day)}
                {days[hover].lastDay !== days[hover].day
                  ? " đến " + formatDate(days[hover].lastDay)
                  : ""}
              </strong>
              <span>{days[hover].count} hóa đơn</span>
              <span>{formatUsdc(days[hover].amount)}</span>
              {compare && <span>Kỳ trước: {days[hover].previous} hóa đơn</span>}
            </>
          ) : (
            <>
              <span className="chart-summary">
                <ArrowDownLeft size={14} />
                {filtered.length} hóa đơn trong kỳ
              </span>
              <span>Dữ liệu minh họa · Solana Devnet</span>
            </>
          )}
        </div>
      </section>
      <div className="workspace-notice">
        <span>
          <Check size={16} />
          <strong>Không gian đã sẵn sàng</strong>
          <span>Kiểm tra nhân sự trước khi tạo khoản thanh toán mới.</span>
        </span>
        <Link href="/business/contractors">
          Xem nhân sự
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <InvoiceTable invoices={filtered} compact />
    </>
  );
}
