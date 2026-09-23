import assert from "node:assert/strict";
import test from "node:test";
import { isFutureInvoiceDueDate, minimumInvoiceDueDate } from "./invoice-due-date.ts";

const today = new Date(2026, 8, 23, 15);

test("rejects today and past dates; accepts tomorrow", () => {
  assert.equal(isFutureInvoiceDueDate("2026-09-23", today), false);
  assert.equal(isFutureInvoiceDueDate("2026-09-22", today), false);
  assert.equal(isFutureInvoiceDueDate("2026-09-24", today), true);
});

test("rejects missing, malformed and impossible dates", () => {
  for (const value of ["", "24/09/2026", "2027-02-30", "2027-13-01"]) {
    assert.equal(isFutureInvoiceDueDate(value, today), false);
  }
});

test("minimum date handles year and leap-year boundaries", () => {
  assert.equal(minimumInvoiceDueDate(new Date(2026, 11, 31)), "2027-01-01");
  assert.equal(minimumInvoiceDueDate(new Date(2028, 1, 28)), "2028-02-29");
});
