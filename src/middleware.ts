import { defineMiddleware } from "astro:middleware";

const canonicalHost = "lulidigital.com";
// Client proposal subdomains: host -> page served at that host's root.
const proposalHosts = new Map([
  ["fikersvisionforalchemy.lulidigital.com", "/fikers-vision-for-alchemy"],
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
  const serviceRedirectPath = serviceRedirectPaths.get(trimmedPath.toLowerCase());

  const proposalPath = proposalHosts.get(url.hostname);
  if (proposalPath && url.pathname === "/") {
    return withSecurityHeaders(await next(proposalPath), url);
  }
  if (url.hostname === canonicalHost) {
    for (const [host, path] of proposalHosts) {
      if (trimmedPath.toLowerCase() === path) return context.redirect(`https://${host}/`, 301);
    }
  }

  if (url.hostname === `www.${canonicalHost}`) {
    url.hostname = canonicalHost;
  }

  url.pathname = serviceRedirectPath ?? trimmedPath;

  if (url.toString() !== originalUrl) {
    return context.redirect(url.toString(), 301);
  }

  return withSecurityHeaders(await next(), url);
});

function withSecurityHeaders(response: Response, url: URL) {
  const isLocalHttpPreview = url.protocol === "http:"
    && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self'",
      "media-src 'self'",
      "frame-src 'self' https://www.youtube-nocookie.com",
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
}
