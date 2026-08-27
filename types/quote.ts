export type QuoteStatus = "ACTIVE" | "EXPIRED" | "USED";

export interface Quote {
  id: string;
  inputAmount: number;
  inputCurrency: "USDC";
  outputAmount: number;
  outputCurrency: "AUD";
  exchangeRate: number;
  platformFee: number;
  estimatedNetworkFeeSol: number;
  expiresAt: string;
  status: QuoteStatus;
  isSimulation: true;
}
