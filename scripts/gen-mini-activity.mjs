/**
 * Generate a mini-Fiker activity frame from a reference image, preserving the
 * character (Gemini image model "Nano Banana", gemini-2.5-flash-image).
 * Usage: GEMINI_API_KEY=... node scripts/gen-mini-activity.mjs <ref.png> "<prompt>" <out.png>
 */
import { readFile, writeFile } from "node:fs/promises";

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error("Set GEMINI_API_KEY"); process.exit(1); }
const MODEL = process.env.IMG_MODEL || "gemini-2.5-flash-image";
const [REFS, PROMPT, OUT] = process.argv.slice(2);
if (!REFS || !PROMPT || !OUT) { console.error("args: <ref[,ref2,...]> <prompt> <out>"); process.exit(1); }

// One or more reference images (comma-separated) — multiple refs lock likeness.
const parts = [{ text: PROMPT }];
for (const p of REFS.split(",").map((s) => s.trim()).filter(Boolean)) {
  const buf = await readFile(p);
  const mime = p.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  parts.push({ inline_data: { mime_type: mime, data: buf.toString("base64") } });
}

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  }
);
const data = await res.json();
if (!res.ok) { console.error(`HTTP ${res.status}:`, JSON.stringify(data, null, 2).slice(0, 800)); process.exit(1); }
const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
const img = part?.inlineData?.data || part?.inline_data?.data;
if (!img) { console.error("No image returned:", JSON.stringify(data).slice(0, 600)); process.exit(1); }
await writeFile(OUT, Buffer.from(img, "base64"));
console.log(`✅ saved ${OUT}`);
