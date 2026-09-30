import test from "node:test";
import assert from "node:assert/strict";
import {
  explorerAddressUrl, explorerTransactionUrl, parseRecipients, paymentBlockReason, readinessLabel,
  shortAddress, walletErrorMessage, WALLET_NOT_CONFIGURED_MESSAGE,
} from "./payout-wallet.ts";

const wallet = "7xVYUrUR2PA6aoW4f9KCJJAUt9gHoeKzod6ErFtGcH3X";
const row = {
  contractorId: "contractor-a", applicationId: "app-1", displayName: "Minh Anh", headline: "Flutter",
  avatarUrl: "/api/v1/profile/contractor-a/avatar", jobTitle: "Mobile app", applicationStatus: "accepted",
  payoutReadiness: "READY", walletAddress: wallet,
};

test("keeps a ready recipient and its wallet", () => {
  const [recipient] = parseRecipients([row]);
  assert.equal(recipient.payoutReadiness, "READY");
  assert.equal(recipient.walletAddress, wallet);
  assert.equal(readinessLabel(recipient.payoutReadiness), "Đã cấu hình ví");
  assert.equal(paymentBlockReason(recipient), null);
});

test("a recipient without a wallet is shown as not configured and cannot be paid", () => {
  const [recipient] = parseRecipients([{ ...row, payoutReadiness: "NOT_CONFIGURED", walletAddress: null }]);
  assert.equal(readinessLabel(recipient.payoutReadiness), "Chưa cấu hình ví");
  assert.equal(paymentBlockReason(recipient), WALLET_NOT_CONFIGURED_MESSAGE);
  assert.equal(paymentBlockReason(recipient), "Ứng viên chưa cấu hình ví nhận USDC trên Solana Devnet.");
});

test("never invents or trusts a wallet the backend did not mark ready", () => {
  const rows = parseRecipients([
    { ...row, payoutReadiness: "INVALID", walletAddress: wallet },
    { ...row, payoutReadiness: "READY", walletAddress: "not-an-address" },
    { ...row, payoutReadiness: "READY", walletAddress: null },
    { ...row, payoutReadiness: "SOMETHING_NEW" },
    { ...row, payoutReadiness: undefined, walletAddress: undefined },
  ]);
  for (const recipient of rows) {
    assert.equal(recipient.walletAddress, null);
    assert.notEqual(recipient.payoutReadiness, "READY");
    assert.notEqual(paymentBlockReason(recipient), null);
  }
  assert.equal(readinessLabel("INVALID"), "Ví không hợp lệ");
  assert.equal(paymentBlockReason(null), "Chọn người nhận hóa đơn.");
  assert.throws(() => parseRecipients({}));
  assert.throws(() => parseRecipients([{ displayName: "x" }]));
});

test("backend wallet error codes become the specific message", () => {
  assert.equal(walletErrorMessage("WALLET_NOT_CONFIGURED", "API 422"), WALLET_NOT_CONFIGURED_MESSAGE);
  assert.match(walletErrorMessage("WALLET_INVALID", "API 422"), /không hợp lệ/);
  assert.equal(walletErrorMessage(undefined, "API 500"), "API 500");
});

test("addresses are shortened safely and signatures link to Devnet explorer", () => {
  assert.equal(shortAddress(wallet), "7xVY…cH3X");
  const signature = "5".repeat(88);
  assert.equal(explorerTransactionUrl(signature), `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  assert.equal(explorerAddressUrl(wallet), `https://explorer.solana.com/address/${wallet}?cluster=devnet`);
  assert.throws(() => explorerTransactionUrl("javascript:alert(1)"));
  assert.throws(() => explorerAddressUrl("https://evil.example"));
});
