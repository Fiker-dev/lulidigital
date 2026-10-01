/**
 * The only way anything should message Fiker.
 *
 * Every Telegram send used to be its own curl with its own guards, or none.
 * That produced an empty "Blog live" ping (headings with nothing between them),
 * a duplicate approval message carrying dead links, and weeks of taps landing
 * on "Not found". Those were three separate bugs in three separate senders
 * because there were nineteen senders.
 *
 * This one refuses to send junk:
 *   - blank or whitespace-only text  → skip quietly, exit 0 (nothing to say)
 *   - a message whose links are dead → do NOT send, exit 1 (loudly)
 *
 * Usage:
 *   node scripts/tg.mjs --text "$MSG"
 *   node scripts/tg.mjs --text "$MSG" --markup "$REPLY_MARKUP" --no-preview
 *   node scripts/tg.mjs --text "$MSG" --no-verify     # links intentionally unchecked
 *   node scripts/tg.mjs --text "$MSG" --allow-empty   # rare: send even if blank
 */
import { verifyAll, extractLinks } from "./verify-link.mjs";

const args = process.argv.slice(2);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const text = val("--text") ?? "";
const markup = val("--markup");
const noPreview = args.includes("--no-preview");
const noVerify = args.includes("--no-verify");
const allowEmpty = args.includes("--allow-empty");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
if (!TOKEN || !CHAT) {
  console.log("tg: no Telegram credentials — skipping.");
  process.exit(0);
}

// "Substance" deliberately ignores emoji, punctuation and whitespace: the empty
// "Blog live" message was ~90 characters of heading and separators with no
// actual content, and a naive length check would have let it through.
const substance = text.replace(/[\s—–—–\-_=·•|]/g, "")
                      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
                      .replace(/[:.,!?]/g, "");
if (!allowEmpty && substance.length < 12) {
  console.log(`tg: message has no substance (${substance.length} meaningful chars) — not sending.`);
  process.exit(0);
}

// The empty "Blog live" message was NOT blank — it was full of heading text
// with nothing between the headings, because an empty list interpolated to "".
// A length check cannot see that; the structural scar can. These are what a
// collapsed interpolation leaves behind.
const HOLLOW = [
  [/\n{3,}/, "a gap where content should be (3+ blank lines)"],
  [/:\s*\n\s*\n\s*(?:[-—–=_]{3,}|$)/, "a heading with nothing under it"],
  [/([-—–=_]{3,})\s*\n\s*\1/, "separators with nothing between them"],
];
if (!allowEmpty) {
  for (const [re, why] of HOLLOW) {
    if (re.test(text)) {
      console.error(`tg: message looks hollow — ${why}. Not sending.`);
      console.error(`tg: ${JSON.stringify(text.slice(0, 160))}`);
      process.exit(1);
    }
  }
}

if (!noVerify) {
  const links = extractLinks(text);
  if (links.length) {
    const { ok, results } = await verifyAll(links, { attempts: 3, waitMs: 8000 });
    if (!ok) {
      for (const r of results.filter((x) => !x.ok)) {
        console.error(`tg: DEAD LINK ${r.status || "unreachable"} ${r.url}`);
      }
      console.error("tg: refusing to send a message containing a dead link.");
      process.exit(1);
    }
    console.log(`tg: ${links.length} link(s) verified`);
  }
}

const body = { chat_id: CHAT, text };
if (noPreview) body.disable_web_page_preview = true;
if (markup) {
  try { body.reply_markup = JSON.parse(markup); }
  catch { console.error("tg: reply_markup is not valid JSON — sending without it."); }
}

const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const json = await res.json().catch(() => ({}));
if (!json.ok) {
  console.error(`tg: send failed — ${JSON.stringify(json).slice(0, 300)}`);
  process.exit(1);
}
console.log(`tg: sent (message_id ${json.result.message_id})`);
