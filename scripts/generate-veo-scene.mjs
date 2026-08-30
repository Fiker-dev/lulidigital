/**
 * Generate a background b-roll clip with Veo via the Gemini API (text-to-video),
 * so background generation is scriptable/repeatable instead of hand-done in the
 * Gemini app. Backgrounds first → edit → THEN Hedra composites mini-me on top.
 *
 * Flow: POST :predictLongRunning → poll the operation → download the mp4.
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/generate-veo-scene.mjs [out.mp4]
 *   # override the prompt or model:
 *   VEO_PROMPT="..." VEO_MODEL=veo-3.1-fast-generate-preview node scripts/generate-veo-scene.mjs
 *
 * NOTE: Veo via the Gemini API is a PAID model — it bills the API key's Google
 * Cloud project (an 8s clip is a few dollars) and needs Veo access enabled.
 */

import { readFile, writeFile } from "node:fs/promises";

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error("Set GEMINI_API_KEY."); process.exit(1); }

const MODEL = process.env.VEO_MODEL || "veo-3.1-generate-preview";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const OUT = process.argv[2] || `${process.env.HOME}/Desktop/veo-hospital-scene.mp4`;

const PROMPT = process.env.VEO_PROMPT ||
  "Cinematic, vertical 9:16, ~6 seconds. Inside a calm, modern operating theatre. Close-up of gloved hands only, no faces visible. Two people working together, showing both genders and diverse skin tones: a woman anaesthetist's hands — slender, brown-skinned, delicate fingers in blue surgical gloves — carefully drawing milky-white propofol from a glass vial up into a syringe, while a male colleague's hands — larger, darker brown skin, blue gloves — steady the vial for her. Soft-focus background: an anaesthesia machine with a glowing monitor showing part of a vital-signs waveform (ECG and oxygen trace). Shallow depth of field, cool blue-green surgical lighting, sterile reflections. Quiet, focused, dignified mood — the precise calm of theatre work. Slow, gentle camera.";

const NEGATIVE = process.env.VEO_NEGATIVE ||
  "patient, person lying down, human face, bed, needle cap, morphing, objects changing shape or transforming, empty syringe, readable text, numbers on screen, watermark, logo, cartoon, blood, distress";

// ---- 1) start the long-running generation --------------------------------
// Optional image-to-video: VEO_IMAGE=<path> animates FROM that photo (its
// identity is preserved as the first frame). Used for Fiker's real face.
const instance = { prompt: PROMPT };
if (process.env.VEO_IMAGE) {
  const buf = await readFile(process.env.VEO_IMAGE);
  const mime = process.env.VEO_IMAGE.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  instance.image = { bytesBase64Encoded: buf.toString("base64"), mimeType: mime };
  console.log(`Image-to-video seed: ${process.env.VEO_IMAGE}`);
}
console.log(`Model: ${MODEL}\nStarting Veo generation (9:16)...`);
const startRes = await fetch(`${BASE}/models/${MODEL}:predictLongRunning?key=${KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    instances: [instance],
    // With a real person's photo, "allow_adult" is the permissive person setting.
    parameters: { aspectRatio: "9:16", negativePrompt: NEGATIVE, personGeneration: process.env.VEO_IMAGE ? "allow_adult" : "allow_all" },
  }),
});
const startData = await startRes.json();
if (!startRes.ok) {
  console.error(`Start failed (HTTP ${startRes.status}):`, JSON.stringify(startData, null, 2));
  if (startRes.status === 403 || startRes.status === 429) {
    console.error("\n→ Likely no Veo access / billing on this key. Options: enable billing + Veo on the key's Google Cloud project, or generate the background via the Hedra gateway (veo_3_1_fast / seedance) instead.");
  }
  process.exit(1);
}
const opName = startData.name;
if (!opName) { console.error("No operation name:", JSON.stringify(startData)); process.exit(1); }
console.log(`Operation: ${opName}`);

// ---- 2) poll until done ---------------------------------------------------
let op;
const started = Date.now();
for (;;) {
  await new Promise((r) => setTimeout(r, 10000));
  const pollRes = await fetch(`${BASE}/${opName}?key=${KEY}`);
  op = await pollRes.json();
  if (!pollRes.ok) { console.error("Poll failed:", JSON.stringify(op, null, 2)); process.exit(1); }
  process.stdout.write(`\r  ${op.done ? "done" : "generating"}... (${Math.round((Date.now() - started) / 1000)}s)   `);
  if (op.done) { console.log(""); break; }
  if (Date.now() - started > 8 * 60 * 1000) { console.error("Timed out after 8 min."); process.exit(1); }
}
if (op.error) { console.error("Generation error:", JSON.stringify(op.error, null, 2)); process.exit(1); }

// ---- 3) find the video uri (defensive across response shapes) -------------
const r = op.response || {};
const uri =
  r.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
  r.generatedSamples?.[0]?.video?.uri ||
  r.generateVideoResponse?.generatedVideos?.[0]?.video?.uri ||
  r.videos?.[0]?.uri ||
  r.predictions?.[0]?.video?.uri;
const b64 = r.generateVideoResponse?.generatedSamples?.[0]?.video?.bytesBase64Encoded ||
  r.predictions?.[0]?.bytesBase64Encoded;

if (uri) {
  console.log(`Downloading: ${uri}`);
  const dl = await fetch(uri, { headers: { "x-goog-api-key": KEY } });
  if (!dl.ok) { console.error(`Download failed HTTP ${dl.status}. Raw response:\n`, JSON.stringify(r, null, 2)); process.exit(1); }
  await writeFile(OUT, Buffer.from(await dl.arrayBuffer()));
} else if (b64) {
  await writeFile(OUT, Buffer.from(b64, "base64"));
} else {
  console.error("Complete, but no video uri found. Raw response:\n", JSON.stringify(r, null, 2));
  process.exit(1);
}

console.log(`\n✅ Saved → ${OUT}`);
