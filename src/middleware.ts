import { defineMiddleware } from "astro:middleware";

const canonicalHost = "lulidigital.com";
const canonicalCasePaths = new Map([
  ["/fikerte", "/Fikerte"],
  ["/teshome", "/Teshome"],
]);
const serviceRedirectPaths = new Map([
  ["/ai", "/ai-desk"],
  ["/marketing", "/marketing-desk"],
  ["/virtual-assistant", "/va-desk"],
]);

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const originalUrl = url.toString();
  const trimmedPath = url.pathname === "/" ? "/" : url.pathname.replace(/\/+$/, "");
  const canonicalCasePath = canonicalCasePaths.get(trimmedPath.toLowerCase());
  const serviceRedirectPath = serviceRedirectPaths.get(trimmedPath.toLowerCase());

  if (url.hostname === `www.${canonicalHost}`) {
    url.hostname = canonicalHost;
  }

  url.pathname = serviceRedirectPath ?? canonicalCasePath ?? trimmedPath;

  if (url.toString() !== originalUrl) {
    return context.redirect(url.toString(), 301);
  }

  const response = await next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  );

  if (url.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return response;
});
