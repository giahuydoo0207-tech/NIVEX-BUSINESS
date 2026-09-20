import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "nova-business-api",
    version: "v1",
    mode: process.env.NEXT_PUBLIC_APP_MODE ?? "demo",
    timestamp: new Date().toISOString(),
  });
}
