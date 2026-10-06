import assert from "node:assert/strict";
import { test } from "node:test";
import { isNovaKeyChange, novaKeyRotationLocked } from "./nova-key-lock";

test("unset or an explicit off value keeps Nova Key changes open", () => {
  for (const flag of [undefined, "", "  ", "false", "FALSE", "0", "no", "off"]) {
    assert.equal(novaKeyRotationLocked(flag), false, String(flag));
  }
});

test("any other value locks Nova Key changes (fail closed)", () => {
  for (const flag of ["true", "TRUE", " true ", "1", "yes", "on", "ture"]) {
    assert.equal(novaKeyRotationLocked(flag), true, flag);
  }
});

test("only non-GET calls to the credential routes count as a key change", () => {
  assert.equal(isNovaKeyChange("business/nova-credentials/key", "POST"), true);
  assert.equal(isNovaKeyChange("business/nova-credentials/key", "DELETE"), true);
  assert.equal(isNovaKeyChange("business/nova-credentials", "PATCH"), true);
  assert.equal(isNovaKeyChange("business/nova-credentials", "GET"), false);
  assert.equal(isNovaKeyChange("business/nova-credentials/key", "GET"), false);
  assert.equal(isNovaKeyChange("business/profile", "POST"), false);
  assert.equal(isNovaKeyChange("business/nova-credentials-extra", "POST"), false);
});
