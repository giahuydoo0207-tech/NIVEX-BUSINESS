export type RemittanceStatus =
  | "CREATED"
  | "AWAITING_SIGNATURE"
  | "SUBMITTED"
  | "CONFIRMED"
  | "PAYOUT_PROCESSING"
  | "PAYOUT_COMPLETED"
  | "TRANSACTION_FAILED"
  | "PAYOUT_FAILED"
  | "EXPIRED"
  | "REFUNDED";

export interface Remittance {
  id: string;
  quoteId: string;
  senderWallet: string;
  recipientBankMasked: string;
  settlementPartnerName: string;
  inputAmount: number;
  inputCurrency: "USDC";
  expectedOutputAmount: number;
  outputCurrency: "AUD";
  status: RemittanceStatus;
  transactionSignature?: string;
  remittancePda?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  remittanceId: string;
  partnerName: string;
  amount: number;
  currency: "AUD";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  completedAt?: string;
}
