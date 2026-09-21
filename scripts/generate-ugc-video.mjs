/**
 * Product photo → UGC-style vertical video, via Veo 3.1 on the Gemini API.
 *
 * Built for paid-social product ads: the still is the FIRST FRAME and the model
 * is animated from there, so the garment, colourway and logo stay the ones the
 * customer will actually receive.
 *
 * Why the prompts are deliberately restrained: Veo re-synthesises every frame,
 * so the more motion you ask for, the more the logo and lettering drift. On a
 * licensed-apparel product (a VT mark here) a warped logo is not a cosmetic
 * problem — it is an unusable asset. Small, natural motion holds the brand.
 *
 *   node scripts/generate-ugc-video.mjs --image <file> [--shot walk] [--all]
 *                                       [--model fast|full|lite] [--out <dir>]
 *
 * --all renders every shot so you can test which converts rather than guess.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const args = process.argv.slice(2);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const imagePath = val("--image");
const wantAll = args.includes("--all");
const modelArg = val("--model") || "fast";
const outDir = val("--out") || path.join(os.homedir(), "Desktop", "LuliDigital UGC");
if (!imagePath) throw new Error("Usage: --image <file> [--shot <name>] [--all] [--model fast|full|lite]");
if (!fs.existsSync(imagePath)) throw new Error(`No such image: ${imagePath}`);

const MODELS = {
  fast: "veo-3.1-fast-generate-preview",
  full: "veo-3.1-generate-preview",
  lite: "veo-3.1-lite-generate-preview",
};
const MODEL = MODELS[modelArg] ?? MODELS.fast;

// Shared across every shot: the things that make a product ad unusable.
const HOLD_THE_PRODUCT =
  "The garment must stay exactly as shown: same colour, same heather texture, " +
  "same fit, same drape. The chest logo must remain sharp, undistorted and " +
  "unchanged — do not redraw, warp, restyle or re-letter it. Keep the same " +
  "person, same face, same hair, same outfit and same location throughout. " +
  "Photorealistic, shot on a phone, natural daylight, no text overlays, no captions.";

const NEGATIVE =
  "distorted logo, warped text, changing logo, morphing face, extra fingers, " +
  "deformed hands, outfit change, colour shift, text overlay, watermark, " +
  "subtitles, cartoon, oversaturated, slow motion, camera whip, jump cut";

// Each shot is one behaviour a real customer video actually contains.
const SHOTS = {
  walk: {
    label: "Walking toward camera (hero)",
    prompt:
      "She keeps walking slowly toward the camera along the campus path, a natural " +
      "relaxed stride. Her curly hair moves gently with the steps. She gives a small, " +
      "genuine smile. The hoodie moves softly with her body. Handheld camera holds " +
      "steady at chest height and backs away slightly to keep her framed. " + HOLD_THE_PRODUCT,
  },
  cozy: {
    // First version had her hug her arms across her chest, which covered the
    // chest logo for most of the shot — a comfort cue that hides the brand mark
    // is not a usable apparel ad. Hands stay low and the chest stays clear.
    label: "Sleeves over hands (comfort cue, logo stays visible)",
    prompt:
      "She stops walking and tugs the hoodie sleeves down over her hands, holding the " +
      "cuffs in her fingers at waist height, the way you do when something is genuinely " +
      "soft and warm. Her arms stay LOW and relaxed at her sides — they never cross her " +
      "chest and never cover the chest logo, which stays fully visible to camera the " +
      "entire time. A small contented smile. Subtle handheld sway. " + HOLD_THE_PRODUCT,
  },
  turn: {
    label: "Half turn to show the fit",
    prompt:
      "She turns slowly a quarter to one side and back to camera, letting the oversized " +
      "fit and the drape of the hoodie read clearly. Hair follows the turn. Calm, " +
      "unhurried, natural. Handheld camera stays level. " + HOLD_THE_PRODUCT,
  },
  pocket: {
    label: "Hands into the pocket (detail)",
    prompt:
      "She slides both hands into the front pockets of the hoodie, shrugs her shoulders " +
      "once in a comfortable settling motion, and smiles faintly at the camera. " +
      "Very small movements. Handheld camera drifts in slightly. " + HOLD_THE_PRODUCT,
  },
};

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error("Missing GEMINI_API_KEY");
const API = "https://generativelanguage.googleapis.com/v1beta";

const image = {
  bytesBase64Encoded: fs.readFileSync(imagePath).toString("base64"),
  mimeType: imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function renderShot(name) {
  const shot = SHOTS[name];
  if (!shot) throw new Error(`Unknown shot "${name}". Options: ${Object.keys(SHOTS).join(", ")}`);
  process.stdout.write(`\n▸ ${name} — ${shot.label}\n  submitting…`);

  const start = await fetch(`${API}/models/${MODEL}:predictLongRunning?key=${KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt: shot.prompt, image }],
      parameters: { aspectRatio: "9:16", negativePrompt: NEGATIVE, resolution: "720p" },
    }),
  });
  if (!start.ok) throw new Error(`submit failed ${start.status}: ${(await start.text()).slice(0, 400)}`);
  const { name: opName } = await start.json();

  // Veo takes a few minutes; poll rather than hold a request open.
  let op, waited = 0;
  do {
    await sleep(10000);
    waited += 10;
    const res = await fetch(`${API}/${opName}?key=${KEY}`);
    op = await res.json();
    process.stdout.write(`\r  rendering… ${waited}s`);
    if (waited > 600) throw new Error("timed out after 10 minutes");
  } while (!op.done);

  if (op.error) throw new Error(`Veo: ${op.error.message}`);
  const sample = op.response?.generateVideoResponse?.generatedSamples?.[0]
    ?? op.response?.generatedVideos?.[0];
  const uri = sample?.video?.uri ?? sample?.video?.videoUri;
  if (!uri) throw new Error(`no video in response: ${JSON.stringify(op.response).slice(0, 400)}`);

  const bin = await fetch(uri.includes("key=") ? uri : `${uri}&key=${KEY}`);
  if (!bin.ok) throw new Error(`download failed ${bin.status}`);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `ugc-${name}-${Date.now()}.mp4`);
  fs.writeFileSync(out, Buffer.from(await bin.arrayBuffer()));
  const mb = (fs.statSync(out).size / 1e6).toFixed(1);
  process.stdout.write(`\r  ✅ ${path.basename(out)} (${mb} MB)      \n`);
  return out;
}

const shots = wantAll ? Object.keys(SHOTS) : [val("--shot") || "walk"];
console.log(`Model: ${MODEL}\nImage: ${path.basename(imagePath)}\nShots: ${shots.join(", ")}`);
const made = [];
for (const s of shots) {
  try { made.push(await renderShot(s)); }
  catch (e) { console.error(`\n  ✗ ${s}: ${e.message}`); }
}
console.log(`\nDone — ${made.length}/${shots.length} rendered into ${outDir}`);
