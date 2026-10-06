import { NextRequest } from "next/server";
import { isNovaKeyChange, NOVA_KEY_LOCKED_MESSAGE, novaKeyRotationLocked } from "@/lib/server/nova-key-lock";

const UUID = "[0-9a-fA-F-]{36}";
const communityPost = `community/posts(?:/${UUID}(?:/(?:pin|privacy|reaction|reactions|saved|hidden|comments(?:/${UUID}/(?:liked|reaction))?))?)?`;
const communityProfile = "community/profiles/[^/]+/(?:following|blocked)";
// Mobile members upload avatars through the mobile API; Business Web only reads them.
const memberAvatar = "profile/[A-Za-z0-9_-]{1,120}/(?:avatar|cover)";
const businessJobs = `business/jobs(?:/${UUID}(?:/status)?)?`;
const applications = `applications(?:/${UUID}/status)?`;
// Management only; Nova ID + Key verification is for other Nova services and is not proxied.
const novaCredentials = "business/nova-credentials(?:/key)?";
// Replyn proposals are created and withdrawn by the business; accepting is a Nova Mobile action and is not proxied.
const replynProposals = `messages/${UUID}/replyn-proposals(?:/${UUID}(?:/(?:send|cancel))?)?`;
const allowed = new RegExp(`^(invoices|invoices/${UUID}/issue|payment-requests/${UUID}(/prepare|/verify)?|messages|messages/${UUID}/(accept|decline|block|unblock|mute|unmute|hide|messages|read|typing)|${replynProposals}|notifications|notifications/${UUID}/read|business/profile(/(avatar|cover))?|business/recipients|${novaCredentials}|${businessJobs}|${applications}|${communityPost}|${communityProfile}|community/(?:reports|media|media/${UUID})|${memberAvatar}|media/(?:business-profile|community)/${UUID})$`);
const binary = (path: string) => path.startsWith("media/") || new RegExp(`^${memberAvatar}$`).test(path);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  // This demo is opt-in and proxied server-side so the backend key is never
  // exposed to the browser.
  if (process.env.DEVNET_DEMO_ENABLED !== "true" || !process.env.NOVA_API_URL || !process.env.NOVA_DEMO_API_KEY) {
    return Response.json({ message: "Devnet demo is disabled on this deployment." }, { status: 503 });
  }
  const path = (await context.params).path.join("/");
  if (!allowed.test(path)) return new Response(null, { status: 404 });
  // Checked before anything reaches the backend, so a locked request never returns a key.
  if (isNovaKeyChange(path, request.method) && novaKeyRotationLocked(process.env.NOVA_KEY_ROTATION_DISABLED)) {
    return Response.json({ message: NOVA_KEY_LOCKED_MESSAGE }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  if (request.method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin) {
    return new Response(null, { status: 403 });
  }
  const body = request.method === "GET" ? undefined : await request.arrayBuffer();
  if (body && body.byteLength > 8 * 1024 * 1024) return new Response(null, { status: 413 });
  const base = process.env.NOVA_API_URL.replace(/\/+$/, "");
  try {
    const upstream = path.startsWith("media/")
      ? `${base}/${path}`
      : `${base}/api/v1/${path}${request.nextUrl.search}`;
    const response = await fetch(upstream, {
      method: request.method, body, cache: "no-store", signal: AbortSignal.timeout(60000),
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "application/json",
        "Idempotency-Key": request.headers.get("Idempotency-Key") || "",
        "X-Nova-Demo-Key": process.env.NOVA_DEMO_API_KEY,
      },
    });
    const contentType = response.headers.get("Content-Type") || "application/json";
    const payload = binary(path) ? await response.arrayBuffer() : await response.text();
    return new Response(payload, {
      status: response.status, headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ message: "Backend chua san sang. Thu lai sau." }, { status: 503 });
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
