import { NextRequest } from "next/server";

const UUID = "[0-9a-fA-F-]{36}";
const communityPost = `community/posts(?:/${UUID}(?:/(?:pin|privacy|reaction|reactions|saved|hidden|comments(?:/${UUID}/(?:liked|reaction))?))?)?`;
const communityProfile = "community/profiles/[^/]+/(?:following|blocked)";
const allowed = new RegExp(`^(invoices|invoices/${UUID}/issue|payment-requests/${UUID}(/prepare|/verify)?|messages|messages/${UUID}/(accept|decline|block|messages)|notifications|notifications/${UUID}/read|business/profile(/(avatar|cover))?|${communityPost}|${communityProfile}|community/(?:reports|media)|media/(?:business-profile|community)/${UUID})$`);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  // This demo is opt-in and proxied server-side so the backend key is never
  // exposed to the browser.
  if (process.env.DEVNET_DEMO_ENABLED !== "true" || !process.env.NOVA_API_URL || !process.env.NOVA_DEMO_API_KEY) {
    return Response.json({ message: "Devnet demo is disabled on this deployment." }, { status: 503 });
  }
  const path = (await context.params).path.join("/");
  if (!allowed.test(path)) return new Response(null, { status: 404 });
  if (request.method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin) {
    return new Response(null, { status: 403 });
  }
  const body = request.method === "GET" ? undefined : await request.arrayBuffer();
  if (body && body.byteLength > 8 * 1024 * 1024) return new Response(null, { status: 413 });
  try {
    const upstream = path.startsWith("media/")
      ? `${process.env.NOVA_API_URL}/${path}`
      : `${process.env.NOVA_API_URL}/api/v1/${path}`;
    const response = await fetch(upstream, {
      method: request.method, body, cache: "no-store", signal: AbortSignal.timeout(60000),
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "application/json",
        "Idempotency-Key": request.headers.get("Idempotency-Key") || "",
        "X-Nova-Demo-Key": process.env.NOVA_DEMO_API_KEY,
      },
    });
    const contentType = response.headers.get("Content-Type") || "application/json";
    const payload = path.startsWith("media/") ? await response.arrayBuffer() : await response.text();
    return new Response(payload, {
      status: response.status, headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ message: "Backend chua san sang. Thu lai sau." }, { status: 503 });
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
