/**
 * Ensures Telegram sends messages and inline button taps to the production
 * LANa webhook. This is intentionally non-destructive: it does not delete the
 * webhook or drop pending updates.
 */

import { existsSync, readFileSync } from "fs";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

function readEnvFile(path = ".env") {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = readEnvFile();
const token = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET || env.TELEGRAM_WEBHOOK_SECRET;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || env.TELEGRAM_WEBHOOK_URL || "https://lulidigital.com/api/lana-telegram";
const allowedUpdates = ["message", "callback_query"];

if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN.");
  process.exit(1);
}

async function telegram(method, params = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = await response.json();
      if (!json.ok) {
        throw new Error(`${method} failed: ${json.description || response.statusText}`);
      }
      return json.result;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  throw lastError;
}

const current = await telegram("getWebhookInfo");
const currentAllowed = Array.isArray(current.allowed_updates) ? current.allowed_updates : [];
const needsUrl = current.url !== webhookUrl;
const needsAllowedUpdates = allowedUpdates.some((update) => !currentAllowed.includes(update));

if (!needsUrl && !needsAllowedUpdates) {
  console.log(`Telegram webhook already healthy: ${current.url}`);
  process.exit(0);
}

const params = {
  url: webhookUrl,
  allowed_updates: allowedUpdates,
};
if (secret) params.secret_token = secret;

await telegram("setWebhook", params);
const verified = await telegram("getWebhookInfo");

if (verified.url !== webhookUrl) {
  throw new Error(`Webhook URL mismatch after update. Expected ${webhookUrl}, got ${verified.url || "(none)"}`);
}

console.log(`Telegram webhook set: ${verified.url}`);
