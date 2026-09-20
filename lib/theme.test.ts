import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BUSINESS_THEMES,
  DEFAULT_BUSINESS_THEME_ID,
  isBusinessThemeId,
  type BusinessThemeId,
} from "../types/theme.ts";

describe("Theme System & Metadata", () => {
  it("includes all 4 mobile parity themes", () => {
    const expectedThemes: BusinessThemeId[] = [
      "cyberNight",
      "defaultTheme",
      "blockchainFlow",
      "vietnamFuture",
    ];

    assert.equal(Object.keys(BUSINESS_THEMES).length, 4);
    for (const id of expectedThemes) {
      assert.ok(BUSINESS_THEMES[id], `Missing theme definition for: ${id}`);
      assert.equal(BUSINESS_THEMES[id].id, id);
      assert.ok(BUSINESS_THEMES[id].label.length > 0);
      assert.ok(BUSINESS_THEMES[id].description.length > 0);
      assert.ok(BUSINESS_THEMES[id].swatch.background);
      assert.ok(BUSINESS_THEMES[id].swatch.primary);
      assert.ok(BUSINESS_THEMES[id].swatch.surface);
      assert.ok(BUSINESS_THEMES[id].swatch.border);
    }
  });

  it("defaults to cyberNight for Business command center", () => {
    assert.equal(DEFAULT_BUSINESS_THEME_ID, "cyberNight");
    assert.equal(BUSINESS_THEMES[DEFAULT_BUSINESS_THEME_ID].mode, "dark");
  });

  it("validates theme IDs correctly with isBusinessThemeId", () => {
    assert.equal(isBusinessThemeId("cyberNight"), true);
    assert.equal(isBusinessThemeId("defaultTheme"), true);
    assert.equal(isBusinessThemeId("blockchainFlow"), true);
    assert.equal(isBusinessThemeId("vietnamFuture"), true);
    assert.equal(isBusinessThemeId("unknownTheme"), false);
    assert.equal(isBusinessThemeId(null), false);
    assert.equal(isBusinessThemeId(undefined), false);
    assert.equal(isBusinessThemeId(123), false);
  });

  it("handles storage fallback gracefully when window is undefined", async () => {
    // In Node test environment, window is undefined
    const { getInitialThemeId, setStoredThemeId } = await import(
      "../types/theme.ts"
    );
    assert.equal(getInitialThemeId(), "cyberNight");
    // Calling setStoredThemeId in node shouldn't throw
    assert.doesNotThrow(() => setStoredThemeId("blockchainFlow"));
  });
});

