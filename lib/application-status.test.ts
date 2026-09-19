import assert from "node:assert/strict";
import test from "node:test";

import {
  canTransition,
  NEXT_ACTIONS,
  normalizeApplicationStatus,
  TRANSITIONS,
  updateApplicationStatus,
} from "./application-status.ts";
import type { ApplicationStatus } from "@/types/application";

test("canTransition allows valid steps defined in TRANSITIONS map", () => {
  assert.equal(canTransition("submitted", "viewed"), true);
  assert.equal(canTransition("submitted", "shortlisted"), true);
  assert.equal(canTransition("viewed", "shortlisted"), true);
  assert.equal(canTransition("shortlisted", "interview"), true);
  assert.equal(canTransition("interview", "accepted"), true);
  assert.equal(canTransition("interview", "rejected"), true);
});

test("canTransition allows 'submitted' -> 'accepted' directly (shortcut bypassing shortlist and interview)", () => {
  assert.equal(canTransition("submitted", "accepted"), true);
});

test("canTransition allows 'shortlisted' -> 'accepted' directly (shortcut bypassing interview)", () => {
  assert.equal(canTransition("shortlisted", "accepted"), true);
});

test("canTransition rejects any backward transition", () => {
  assert.equal(canTransition("accepted", "submitted"), false);
  assert.equal(canTransition("accepted", "interview"), false);
  assert.equal(canTransition("rejected", "viewed"), false);
  assert.equal(canTransition("rejected", "submitted"), false);
  assert.equal(canTransition("interview", "shortlisted"), false);
  assert.equal(canTransition("interview", "viewed"), false);
  assert.equal(canTransition("shortlisted", "submitted"), false);
  assert.equal(canTransition("viewed", "submitted"), false);
});

test("canTransition rejects setting 'withdrawn' from any status", () => {
  const allStatuses: ApplicationStatus[] = [
    "submitted",
    "viewed",
    "shortlisted",
    "interview",
    "rejected",
    "accepted",
    "withdrawn",
  ];
  for (const status of allStatuses) {
    assert.equal(
      canTransition(status, "withdrawn"),
      false,
      `Should not transition from ${status} to withdrawn`,
    );
  }
});

test("updateApplicationStatus throws when transition is invalid", () => {
  const app = {
    id: "app-1",
    status: "accepted" as ApplicationStatus,
  };

  assert.throws(
    () => {
      updateApplicationStatus(app, "submitted");
    },
    {
      message: 'Không thể chuyển từ "accepted" sang "submitted"',
    },
  );

  const submittedApp = {
    id: "app-2",
    status: "submitted" as ApplicationStatus,
  };
  const updated = updateApplicationStatus(submittedApp, "accepted");
  assert.equal(updated.status, "accepted");
  assert.ok(updated.updatedAt);
});

test("NEXT_ACTIONS returns empty array for terminal states: rejected, accepted, withdrawn", () => {
  assert.deepEqual(NEXT_ACTIONS.rejected, []);
  assert.deepEqual(NEXT_ACTIONS.accepted, []);
  assert.deepEqual(NEXT_ACTIONS.withdrawn, []);
});

test("NEXT_ACTIONS returns BOTH options (shortlist + hired) for submitted and viewed", () => {
  const submittedNext = NEXT_ACTIONS.submitted.map((a) => a.next);
  assert.deepEqual(submittedNext, ["shortlisted", "accepted"]);

  const viewedNext = NEXT_ACTIONS.viewed.map((a) => a.next);
  assert.deepEqual(viewedNext, ["shortlisted", "accepted"]);
});

test("normalizeApplicationStatus safely migrates legacy uppercase statuses and preserves valid lowercase statuses", () => {
  assert.equal(normalizeApplicationStatus("SUBMITTED"), "submitted");
  assert.equal(normalizeApplicationStatus("IN_REVIEW"), "viewed");
  assert.equal(normalizeApplicationStatus("APPROVED"), "shortlisted");
  assert.equal(normalizeApplicationStatus("REJECTED"), "rejected");

  assert.equal(normalizeApplicationStatus("submitted"), "submitted");
  assert.equal(normalizeApplicationStatus("viewed"), "viewed");
  assert.equal(normalizeApplicationStatus("shortlisted"), "shortlisted");
  assert.equal(normalizeApplicationStatus("interview"), "interview");
  assert.equal(normalizeApplicationStatus("accepted"), "accepted");
  assert.equal(normalizeApplicationStatus("rejected"), "rejected");
  assert.equal(normalizeApplicationStatus("withdrawn"), "withdrawn");

  assert.equal(normalizeApplicationStatus("UNKNOWN_STATUS"), null);
  assert.equal(normalizeApplicationStatus(""), null);
  assert.equal(normalizeApplicationStatus(null), null);
  assert.equal(normalizeApplicationStatus(undefined), null);
  assert.equal(normalizeApplicationStatus(123), null);
});

