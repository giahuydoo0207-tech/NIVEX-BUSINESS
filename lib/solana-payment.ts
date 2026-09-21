import {
  address, appendTransactionMessageInstructions, compileTransaction, createClient,
  createSolanaRpc, createTransactionMessage, getBase64EncodedWireTransaction,
  getSignatureFromTransaction, pipe, setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners,
  type TransactionSigner,
} from "@solana/kit";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { findAssociatedTokenPda, getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { getAddMemoInstruction } from "@solana-program/memo";
import type { DevnetPayment } from "./devnet-api";

export const DEVNET_MINT = "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k";
export const rpc = createSolanaRpc("https://api.devnet.solana.com");
export function createWalletClient() {
  return createClient().use(walletSigner({ chain: "solana:devnet", autoConnect: false,
    filter: wallet => wallet.features.includes("solana:signTransaction") }));
}

export async function paymentMessage(payment: DevnetPayment, signer: TransactionSigner,
  lifetime: Awaited<ReturnType<ReturnType<typeof rpc.getLatestBlockhash>["send"]>>["value"]) {
  if (payment.chain !== "solana:devnet" || payment.mint !== DEVNET_MINT || !payment.recipient
      || payment.reference !== `nova:${payment.id}` || payment.status !== "AWAITING_PAYMENT") {
    throw new Error("Yeu cau thanh toan Devnet khong hop le.");
  }
  if (signer.address === payment.recipient) throw new Error("Vi tra tien phai khac vi nhan demo.");
  const amount = BigInt(payment.amountMinor);
  if (amount <= 0n || amount > 18446744073709551615n) throw new Error("So tien khong hop le.");
  const mint = address(payment.mint);
  const owner = address(payment.recipient);
  const [source] = await findAssociatedTokenPda({ owner: signer.address, mint, tokenProgram: TOKEN_PROGRAM_ADDRESS });
  const [destination] = await findAssociatedTokenPda({ owner, mint, tokenProgram: TOKEN_PROGRAM_ADDRESS });
  return pipe(createTransactionMessage({ version: 0 }),
    m => setTransactionMessageFeePayerSigner(signer, m),
    m => setTransactionMessageLifetimeUsingBlockhash(lifetime, m),
    m => appendTransactionMessageInstructions([
      getCreateAssociatedTokenIdempotentInstruction({ payer: signer, ata: destination, owner, mint }),
      getTransferCheckedInstruction({ source, destination, mint, authority: signer, amount, decimals: 6 }),
      getAddMemoInstruction({ memo: payment.reference! }),
    ], m));
}

export async function simulatePayment(payment: DevnetPayment, signer: TransactionSigner) {
  if (await rpc.getGenesisHash().send() !== "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG") {
    throw new Error("RPC khong phai Devnet.");
  }
  const { value: lifetime } = await rpc.getLatestBlockhash({ commitment: "confirmed" }).send();
  const message = await paymentMessage(payment, signer, lifetime);
  const tx = compileTransaction(message);
  const simulation = await rpc.simulateTransaction(getBase64EncodedWireTransaction(tx), {
    encoding: "base64", sigVerify: false, commitment: "confirmed",
  }).send();
  if (simulation.value.err) throw new Error("Mo phong that bai. Kiem tra SOL phi mang va USDC Devnet cua vi tra tien.");
  return { message, payer: signer.address, checkedAt: Date.now() };
}

export async function signPayment(preview: Awaited<ReturnType<typeof simulatePayment>>,
  persistSignature: (signature: string) => void) {
  if (Date.now() - preview.checkedAt > 45000) throw new Error("Ban xem truoc het han. Hay mo phong lai.");
  const signed = await signTransactionMessageWithSigners(preview.message);
  const signature = getSignatureFromTransaction(signed);
  // Persist before broadcast: a lost HTTP response must never offer another payment.
  persistSignature(signature);
  await rpc.sendTransaction(getBase64EncodedWireTransaction(signed), { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed", maxRetries: 3n }).send();
  return signature;
}
