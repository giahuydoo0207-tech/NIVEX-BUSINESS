import test from "node:test";
import assert from "node:assert/strict";
import {
  APPLICATION_TRANSITIONS,
  INVOICE_TRANSITIONS,
  JOB_TRANSITIONS,
  assertTransition,
  canTransition,
} from "./state-machines.ts";

test("backend state machines accept the happy paths", () => {
  assert.equal(canTransition(JOB_TRANSITIONS, "DRAFT", "PUBLISHED"), true);
  assert.equal(canTransition(APPLICATION_TRANSITIONS, "shortlisted", "interview"), true);
  assert.equal(canTransition(INVOICE_TRANSITIONS, "ISSUED", "AWAITING_PAYMENT"), true);
});

test("backend state machines reject terminal and backwards transitions", () => {
  assert.equal(canTransition(JOB_TRANSITIONS, "CLOSED", "PUBLISHED"), false);
  assert.equal(canTransition(INVOICE_TRANSITIONS, "PAID_OUT", "DRAFT"), false);
  assert.throws(() => assertTransition(APPLICATION_TRANSITIONS, "accepted", "submitted"));
});
