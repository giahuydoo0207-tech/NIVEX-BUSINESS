import type { Quote } from "@/types/quote";
import type { Remittance } from "@/types/remittance";
import type { NivexWallet } from "@/types/wallet";

export const demoWallet: NivexWallet = {
  address: "7xK9nVx9xWdemoDevnetWalletaP3L",
  displayAddress: "7xK9...aP3L",
  balanceUsdc: 100,
  balanceAudEstimate: 150,
};

export const demoQuote: Quote = {
  id: "quote-demo-001",
  inputAmount: 100,
  inputCurrency: "USDC",
  outputAmount: 150,
  outputCurrency: "AUD",
  exchangeRate: 1.52,
  platformFee: 0.5,
  estimatedNetworkFeeSol: 0.0001,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  status: "ACTIVE",
  isSimulation: true,
};

export const demoRemittance: Remittance = {
  id: "demo-remit-001",
  quoteId: demoQuote.id,
  senderWallet: demoWallet.displayAddress,
  recipientBankMasked: "Australia Bank .... 8821",
  settlementPartnerName: "Nivex Demo Partner",
  inputAmount: 100,
  inputCurrency: "USDC",
  expectedOutputAmount: 150,
  outputCurrency: "AUD",
  status: "PAYOUT_COMPLETED",
  transactionSignature: "5h7X...3PqL",
  remittancePda: "NXV7...8K2F",
  createdAt: "2026-03-03T09:21:00.000Z",
  updatedAt: "2026-03-03T09:24:00.000Z",
};

export const transactions = [
  {
    id: "demo-remit-001",
    name: "Nhận từ Alex (Úc)",
    partner: "Alex · Australia Bank",
    usdc: 100,
    aud: 150,
    status: "Hoàn tất",
    statusTone: "done",
    time: "Hôm nay, 09:21",
  },
  {
    id: "demo-remit-002",
    name: "Gửi đến Minh (Úc)",
    partner: "Minh · Australia Bank",
    usdc: 40,
    aud: 60,
    status: "Đang xử lý",
    statusTone: "pending",
    time: "Hôm qua, 15:04",
  },
  {
    id: "demo-remit-003",
    name: "Gửi đến Khoa (Úc)",
    partner: "Khoa · Australia Bank",
    usdc: 10,
    aud: undefined,
    status: "Đã hoàn tiền",
    statusTone: "refund",
    time: "Tuần trước",
  },
] as const;
