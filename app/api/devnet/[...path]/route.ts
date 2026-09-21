import { NextRequest } from "next/server";

const UUID = "[0-9a-fA-F-]{36}";
const allowed = new RegExp(`^(invoices|invoices/${UUID}/issue|payment-requests/${UUID}(/prepare|/verify)?)$`);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  // This demo is opt-in and proxied server-side so the backend key is never
  // exposed to the browser.
  if (process.env.DEVNET_DEMO_ENABLED !== "true" || !process.env.NOVA_API_URL || !process.env.NOVA_DEMO_API_KEY) {
    return Response.json({ message: "Devnet demo is disabled on this deployment." }, { status: 503 });
  }
  const path = (await context.params).path.join("/");
  if (!allowed.test(path)) return new Response(null, { status: 404 });
  if (request.method === "POST" && request.headers.get("origin") !== request.nextUrl.origin) {
    return new Response(null, { status: 403 });
  }
  const body = request.method === "POST" ? await request.text() : undefined;
  if (body && body.length > 16000) return new Response(null, { status: 413 });
  try {
    const response = await fetch(`${process.env.NOVA_API_URL}/api/v1/${path}`, {
      method: request.method, body, cache: "no-store", signal: AbortSignal.timeout(60000),
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": request.headers.get("Idempotency-Key") || "",
        "X-Nova-Demo-Key": process.env.NOVA_DEMO_API_KEY,
      },
    });
    return new Response(await response.text(), {
      status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ message: "Backend chua san sang. Thu lai sau." }, { status: 503 });
  }
}

export { proxy as GET, proxy as POST };
