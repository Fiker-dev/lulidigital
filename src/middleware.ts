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

export const onRequest = defineMiddleware((context, next) => {
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

  return next();
});
