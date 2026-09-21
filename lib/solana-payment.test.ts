import test from "node:test";
import assert from "node:assert/strict";
import { address, blockhash, createNoopSigner } from "@solana/kit";
import { getTransferCheckedInstructionDataDecoder, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { paymentMessage, DEVNET_MINT } from "./solana-payment.ts";
import type { DevnetPayment } from "./devnet-api.ts";

const signer = createNoopSigner(address("11111111111111111111111111111111"));
const lifetime = { blockhash: blockhash("11111111111111111111111111111111"), lastValidBlockHeight: 100n };
const payment: DevnetPayment = {
  id: "46045022-7fa3-48fa-9f54-33cd86d1fc28", invoiceId: "test", invoiceNumber: "TEST",
  description: "Test only", dueDate: "2099-01-01", chain: "solana:devnet",
  recipient: "Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyr", mint: DEVNET_MINT,
  amountMinor: "9007199254740993", reference: "nova:46045022-7fa3-48fa-9f54-33cd86d1fc28",
  status: "AWAITING_PAYMENT", signature: null,
};

test("payment preserves amounts above Number precision and binds the invoice memo", async () => {
  const message = await paymentMessage(payment, signer, lifetime);
  assert.equal(message.instructions.length, 3);
  const transfer = message.instructions[1];
  assert.equal(transfer.programAddress, TOKEN_PROGRAM_ADDRESS);
  const decoded = getTransferCheckedInstructionDataDecoder().decode(transfer.data!);
  assert.equal(decoded.amount, 9007199254740993n);
  assert.equal(decoded.decimals, 6);
  assert.equal(new TextDecoder().decode(message.instructions[2].data!), payment.reference);
});

for (const change of [
  { chain: "solana:mainnet" }, { mint: signer.address }, { reference: "another-invoice" },
  { status: "PAID_ON_CHAIN" }, { recipient: signer.address },
  { amountMinor: "0" }, { amountMinor: "18446744073709551616" },
]) {
  test(`rejects invalid payment ${JSON.stringify(change)}`, async () => {
    await assert.rejects(paymentMessage({ ...payment, ...change }, signer, lifetime));
  });
}
