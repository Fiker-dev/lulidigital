/**
 * Fixes Telegram HTTP 409 Conflict errors.
 * Cause: two instances competing for updates (polling vs webhook conflict).
 * Fix: delete all conflicting webhooks, drop pending updates, then re-register cleanly.
 *
 * Run: node scripts/fix-telegram-webhook.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");

// Read .env manually
function readEnv(path) {
  if (!existsSync(path)) return {};
  const lines = readFileSync(path, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
  return env;
}

const env = readEnv(envPath);
const TOKEN = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const SECRET = env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
const WEBHOOK_URL = "https://lulidigital.com/api/lana-telegram";

if (!TOKEN) {
  console.error("❌  TELEGRAM_BOT_TOKEN not found in .env");
  process.exit(1);
}

async function tg(method, params = {}) {
  const url = `https://api.telegram.org/bot${TOKEN}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

console.log("🔍  Checking current webhook status...");
const info = await tg("getWebhookInfo");
console.log("Current webhook:", info.result?.url || "(none)");
if (info.result?.pending_update_count) {
  console.log(`Pending updates queued: ${info.result.pending_update_count}`);
}
if (info.result?.last_error_message) {
  console.log(`Last error: ${info.result.last_error_message}`);
}

console.log("\n🗑️   Deleting webhook and dropping all pending updates...");
const del = await tg("deleteWebhook", { drop_pending_updates: true });
console.log("deleteWebhook:", del.ok ? "✓ done" : `✗ ${del.description}`);

// Brief pause so Telegram clears the conflict
await new Promise(r => setTimeout(r, 1500));

console.log("\n🔗  Re-registering webhook...");
const setParams = { url: WEBHOOK_URL, allowed_updates: ["message"] };
if (SECRET) setParams.secret_token = SECRET;

const set = await tg("setWebhook", setParams);
console.log("setWebhook:", set.ok ? "✓ done" : `✗ ${set.description}`);

console.log("\n✅  Verifying...");
const verify = await tg("getWebhookInfo");
console.log("Active webhook:", verify.result?.url);
console.log("Pending updates:", verify.result?.pending_update_count ?? 0);

if (verify.result?.url === WEBHOOK_URL) {
  console.log("\n✅  Fixed. The 409 errors should stop within a minute.");
} else {
  console.log("\n⚠️   Webhook URL mismatch — check TELEGRAM_BOT_TOKEN in .env");
}
