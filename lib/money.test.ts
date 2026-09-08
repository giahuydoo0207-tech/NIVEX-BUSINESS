import assert from "node:assert/strict";
import test from "node:test";

import { formatUsdc, parseUsdcToMinor } from "./money.ts";

test("parses arbitrary valid USDC amounts into six-decimal minor units", () => {
  assert.deepEqual(parseUsdcToMinor("0.000001"), { ok: true, minor: "1" });
  assert.deepEqual(parseUsdcToMinor("1"), { ok: true, minor: "1000000" });
  assert.deepEqual(parseUsdcToMinor("25.5"), { ok: true, minor: "25500000" });
  assert.deepEqual(parseUsdcToMinor("1249.987654"), {
    ok: true,
    minor: "1249987654",
  });
});

test("rejects zero, negative, exponent and excessive precision", () => {
  assert.equal(parseUsdcToMinor("0").ok, false);
  assert.equal(parseUsdcToMinor("-1").ok, false);
  assert.equal(parseUsdcToMinor("1e3").ok, false);
  assert.equal(parseUsdcToMinor("1.0000001").ok, false);
});

test("formats serialized minor units without floating point arithmetic", () => {
  assert.equal(formatUsdc("1"), "0.000001 USDC");
  assert.equal(formatUsdc("25500000"), "25.5 USDC");
  assert.equal(formatUsdc("1249987654"), "1,249.987654 USDC");
});
