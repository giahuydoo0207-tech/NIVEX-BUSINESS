import assert from "node:assert/strict";
import { test } from "node:test";
import { ALL_NAV_ITEMS, NAV_GROUPS } from "./business-navigation";
import {
  formatCredentialTime,
  issueKeyNeedsConfirmation,
  lastKeyChange,
  maskedNovaKey,
  novaKeyStatusLabel,
} from "./nova-credentials";

test("Thông tin cá nhân sits right under Tổng quan in the workspace group", () => {
  const workspace = NAV_GROUPS[0];
  assert.equal(workspace.groupLabel, "Không gian làm việc");
  assert.deepEqual(
    workspace.items.map((item) => [item.key, item.label, item.href]),
    [
      ["dashboard", "Tổng quan", "/business/dashboard"],
      ["personalInfo", "Thông tin cá nhân", "/business/personal-info"],
    ],
  );
  assert.equal(NAV_GROUPS[1].groupLabel, "Mạng lưới");
});

test("the public business page keeps its own entry and every route is unique", () => {
  const profile = ALL_NAV_ITEMS.find((item) => item.key === "profile");
  assert.equal(profile?.label, "Trang cá nhân");
  assert.equal(profile?.href, "/business/profile");
  const hrefs = ALL_NAV_ITEMS.map((item) => item.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
  const keys = ALL_NAV_ITEMS.map((item) => item.key);
  assert.equal(new Set(keys).size, keys.length);
});

test("key status labels match the three backend states", () => {
  assert.equal(novaKeyStatusLabel("NOT_CREATED"), "Chưa tạo");
  assert.equal(novaKeyStatusLabel("ACTIVE"), "Đang hoạt động");
  assert.equal(novaKeyStatusLabel("REVOKED"), "Đã thu hồi");
  assert.equal(novaKeyStatusLabel("SOMETHING_ELSE"), "Không xác định");
});

test("only the stored hint is ever shown for an existing key", () => {
  assert.equal(maskedNovaKey("A91F"), "•••• A91F");
  assert.equal(maskedNovaKey(null), "••••");
});

test("rotating an active key asks first, creating the first one does not", () => {
  assert.equal(issueKeyNeedsConfirmation("ACTIVE"), true);
  assert.equal(issueKeyNeedsConfirmation("NOT_CREATED"), false);
  assert.equal(issueKeyNeedsConfirmation("REVOKED"), false);
});

test("the last key change is the newest of issue and revoke times", () => {
  const key = { status: "REVOKED" as const, hint: "A91F", lastUsedAt: null };
  assert.equal(lastKeyChange({ ...key, createdAt: null, revokedAt: null }), null);
  assert.equal(
    lastKeyChange({ ...key, createdAt: "2026-10-01T08:00:00Z", revokedAt: "2026-10-03T08:00:00Z" }),
    "2026-10-03T08:00:00Z",
  );
  assert.equal(
    lastKeyChange({ ...key, status: "ACTIVE", createdAt: "2026-10-04T08:00:00Z", revokedAt: "2026-10-03T08:00:00Z" }),
    "2026-10-04T08:00:00Z",
  );
});

test("missing or invalid timestamps render as a dash", () => {
  assert.equal(formatCredentialTime(null), "—");
  assert.equal(formatCredentialTime("not a date"), "—");
  assert.match(formatCredentialTime("2026-10-04T08:00:00Z"), /2026/);
});
