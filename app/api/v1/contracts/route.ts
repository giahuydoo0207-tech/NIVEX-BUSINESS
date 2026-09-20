import { NextResponse } from "next/server";
import { CONTRACT_VERSION } from "@/types/contracts";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    version: CONTRACT_VERSION,
    currency: "USDC",
    network: "Solana Devnet",
    capabilities: {
      auth: false,
      jobs: false,
      applications: false,
      invoices: false,
      settlement: false,
      mode: "foundation",
    },
  });
}
