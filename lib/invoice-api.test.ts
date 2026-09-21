import test from "node:test";
import assert from "node:assert/strict";
import { parseApiInvoices, isPaidInvoice, isPendingInvoice } from "./invoice-api.ts";

const row = {
  id: "invoice", organizationId: "org", contractorId: "contractor", invoiceNumber: "NOVA-1",
  description: "Work", amountMinor: "18446744073709551615", currency: "USDC",
  status: "PAID_ON_CHAIN", createdAt: "2026-09-21T03:00:00Z", dueDate: "2026-09-23",
  paymentRequestId: "payment",
};

test("backend invoices retain exact amounts, status and checkout identity", () => {
  const [invoice] = parseApiInvoices([row]);
  assert.equal(invoice.sourceAmountMinor, row.amountMinor);
  assert.equal(invoice.paymentRequestId, "payment");
  assert.equal(invoice.status, "PAID_ON_CHAIN");
  assert.deepEqual(parseApiInvoices([]), []);
});

test("draft without a payment request has no checkout link", () => {
  assert.equal(parseApiInvoices([{ ...row, status: "DRAFT", paymentRequestId: null }])[0].paymentRequestId, "");
});

test("invalid API payloads cannot be displayed as valid financial records", () => {
  for (const value of [{}, [null], [{ ...row, amountMinor: 1 }], [{ ...row, amountMinor: "1.01" }],
    [{ ...row, amountMinor: "18446744073709551616" }], [{ ...row, status: "FAKE_PAID" }],
    [{ ...row, currency: "SOL" }], [{ ...row, paymentRequestId: undefined }]]) {
    assert.throws(() => parseApiInvoices(value), /Invalid invoice response/);
  }
});

test("confirmed stays pending and finalized counts as paid", () => {
  assert.equal(isPaidInvoice("PAYMENT_DETECTED"), false);
  assert.equal(isPendingInvoice("PAYMENT_DETECTED"), true);
  assert.equal(isPendingInvoice("ISSUED"), true);
  assert.equal(isPaidInvoice("PAID_ON_CHAIN"), true);
  assert.equal(isPaidInvoice("PAID_OUT"), true);
  assert.equal(isPendingInvoice("PAID_ON_CHAIN"), false);
});
