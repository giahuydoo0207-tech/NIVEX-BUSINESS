import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeHashtag,
  normalizeSkill,
  validateHashtag,
  validateSkill,
} from "./hashtag.ts";

test("normalizeHashtag strips single or multiple leading hashes and converts to lowercase", () => {
  assert.equal(normalizeHashtag("#mobiledev"), "mobiledev");
  assert.equal(normalizeHashtag("###remote"), "remote");
  assert.equal(normalizeHashtag("FLUTTER"), "flutter");
  assert.equal(normalizeHashtag("#DeFi_2026"), "defi_2026");
  assert.equal(normalizeHashtag("  #solana   "), "solana");
  assert.equal(normalizeHashtag(""), "");
  assert.equal(normalizeHashtag("   "), "");
});

test("validateHashtag accepts valid alphanumeric tags with underscores", () => {
  assert.equal(validateHashtag("remote", []), null);
  assert.equal(validateHashtag("mobile_dev", ["remote"]), null);
  assert.equal(validateHashtag("solana2026", ["remote", "mobile_dev"]), null);
});

test("validateHashtag rejects empty string", () => {
  assert.equal(validateHashtag("", []), "Hashtag không được để trống.");
});

test("validateHashtag enforces length bounds of 2 to 30 characters", () => {
  assert.equal(
    validateHashtag("a", []),
    "Hashtag chỉ gồm chữ, số hoặc dấu gạch dưới (2-30 ký tự).",
  );
  // 30 characters is accepted
  assert.equal(validateHashtag("a".repeat(30), []), null);
  // 31 characters is rejected
  assert.equal(
    validateHashtag("a".repeat(31), []),
    "Hashtag chỉ gồm chữ, số hoặc dấu gạch dưới (2-30 ký tự).",
  );
});

test("validateHashtag rejects spaces, special symbols, dashes, and Unicode characters", () => {
  assert.equal(
    validateHashtag("mobile dev", []),
    "Hashtag chỉ gồm chữ, số hoặc dấu gạch dưới (2-30 ký tự).",
  );
  assert.equal(
    validateHashtag("mobile-dev", []),
    "Hashtag chỉ gồm chữ, số hoặc dấu gạch dưới (2-30 ký tự).",
  );
  assert.equal(
    validateHashtag("web3!", []),
    "Hashtag chỉ gồm chữ, số hoặc dấu gạch dưới (2-30 ký tự).",
  );
  assert.equal(
    validateHashtag("việtnam", []),
    "Hashtag chỉ gồm chữ, số hoặc dấu gạch dưới (2-30 ký tự).",
  );
  assert.equal(
    validateHashtag("hồ_sơ", []),
    "Hashtag chỉ gồm chữ, số hoặc dấu gạch dưới (2-30 ký tự).",
  );
});

test("validateHashtag rejects duplicate items", () => {
  assert.equal(
    validateHashtag("remote", ["remote", "mobiledev"]),
    "Hashtag này đã được thêm.",
  );
});

test("validateHashtag rejects adding beyond maximum of 5 items", () => {
  const fiveExisting = ["tag1", "tag2", "tag3", "tag4", "tag5"];
  assert.equal(
    validateHashtag("tag6", fiveExisting),
    "Chỉ được thêm tối đa 5 hashtag.",
  );
});

test("normalizeSkill preserves display casing and collapses extra spaces", () => {
  assert.equal(normalizeSkill("Flutter"), "Flutter");
  assert.equal(normalizeSkill("React Native"), "React Native");
  assert.equal(normalizeSkill("  React   Native  "), "React Native");
  assert.equal(normalizeSkill("solana"), "solana");
});

test("validateSkill checks non-empty and case-insensitive duplicates", () => {
  assert.equal(validateSkill("", []), "Kỹ năng không được để trống.");
  assert.equal(validateSkill("Flutter", []), null);
  assert.equal(
    validateSkill("flutter", ["Flutter"]),
    "Kỹ năng này đã được thêm.",
  );
  assert.equal(
    validateSkill("FLUTTER", ["Flutter"]),
    "Kỹ năng này đã được thêm.",
  );
  assert.equal(validateSkill("Dart", ["Flutter"]), null);
});
