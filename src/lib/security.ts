import type { APIContext } from "astro";

type JsonReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...init.headers,
    },
  });
}

export async function readJsonBody<T>(request: Request, maxBytes = 16_384): Promise<JsonReadResult<T>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: jsonResponse({ error: "Unsupported content type." }, { status: 415 }),
    };
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      response: jsonResponse({ error: "Request body too large." }, { status: 413 }),
    };
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: jsonResponse({ error: "Invalid request body." }, { status: 400 }),
    };
  }

  if (new TextEncoder().encode(raw).length > maxBytes) {
    return {
      ok: false,
      response: jsonResponse({ error: "Request body too large." }, { status: 413 }),
    };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return {
      ok: false,
      response: jsonResponse({ error: "Invalid JSON." }, { status: 400 }),
    };
  }
}

export function assertSameOrigin(request: Request, url: URL): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return jsonResponse({ error: "Invalid origin." }, { status: 403 });
  }

  if (originUrl.host !== url.host || originUrl.protocol !== url.protocol) {
    return jsonResponse({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

export function rateLimit(
  context: Pick<APIContext, "request" | "url">,
  options: { key: string; limit: number; windowMs: number },
): Response | null {
  const now = Date.now();
  const clientIp = getClientIp(context.request);
  const bucketKey = `${options.key}:${clientIp}`;
  const current = rateLimitBuckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    cleanupRateLimits(now);
    return null;
  }

  current.count += 1;
  if (current.count > options.limit) {
    return jsonResponse(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)),
        },
      },
    );
  }

  return null;
}

export function timingSafeEqual(a: string, b: string) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let mismatch = left.length === right.length ? 0 : 1;
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    mismatch |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }

  return mismatch === 0;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function cleanupRateLimits(now: number) {
  if (rateLimitBuckets.size < 1_000) return;

  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }
}
