/**
 * Hedra Avatar test — burn the free 100 credits on ONE mini-Fiker hook and
 * confirm the output (quality + clean green-screen) BEFORE paying for a plan.
 *
 * Uses the cheapest right-fit model: Hedra Avatar (`hedra_avatar`, 7 credits/s,
 * Character-3) — a still image + audio → lip-synced, expressive talking clip.
 * We keep the clip SHORT on purpose: the avatar only needs to carry the HOOK.
 * (Body of the real video = b-roll + honey cards + voiceover; near-zero credits.)
 *
 * Flow (Hedra public API — https://api.hedra.com/web-app/public, X-API-Key):
 *   1. TTS the hook line via Gemini (or pass --audio) → a wav
 *   2. POST /assets (image) + /assets/{id}/upload
 *   3. POST /assets (audio) + /assets/{id}/upload
 *   4. POST /generations (ai_model_id = Hedra Avatar) → generation id
 *   5. GET /generations/{id}/status until complete → download the mp4
 *
 * Usage:
 *   HEDRA_API_KEY=... GEMINI_API_KEY=... \
 *     node scripts/hedra-avatar-test.mjs --image /path/to/mini-fiker-3d.png
 *   # or bring your own audio:
 *   HEDRA_API_KEY=... node scripts/hedra-avatar-test.mjs \
 *     --image mini-fiker-3d.png --audio hook.wav
 *   # override the hook line:
 *   ... --line "Your team keeps getting bigger. So why does everything take longer?"
 *
 * The mini-Fiker asset lives in the local socials repo, e.g.
 *   ~/Desktop/Lulidigital Socials/Bureau/socials/.../mini-fiker-3d.png
 */

import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { execSync } from "node:child_process";

// Robust audio duration in ms via ffprobe (handles any WAV/MP3, incl.
// ffmpeg-concatenated files whose headers the naive WAV parser can't read).
function probeDurationMs(path) {
  try {
    const s = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${path}"`
    ).toString().trim();
    const sec = parseFloat(s);
    return Number.isFinite(sec) && sec > 0 ? Math.round(sec * 1000) : 0;
  } catch {
    return 0;
  }
}

const HEDRA_BASE = "https://api.hedra.com/web-app/public";
const HEDRA_AVATAR_MODEL_ID = "26f0fc66-152b-40ab-abed-76c43df99bc8"; // Hedra Avatar (Character-3)

// Gemini TTS — swap to your brand voice model if you have it (memory: gemini-3.1-flash-tts-preview).
const TTS_MODEL = process.env.HEDRA_TEST_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const TTS_VOICE = process.env.HEDRA_TEST_TTS_VOICE || "Aoede"; // warm, breezy; swap as you like

// The hook: relatable pain + curiosity gap → "wait, that's me… tell me more."
// Short by design (~8s of avatar). On-brand: smartest operational friend.
const DEFAULT_LINE =
  "You bought a stack of tools this year to save time — so why does every week still feel like you're behind?";

// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const a = { image: null, audio: null, line: DEFAULT_LINE, out: `hedra-test-${Date.now()}.mp4` };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "--image") a.image = argv[++i];
    else if (v === "--audio") a.audio = argv[++i];
    else if (v === "--line") a.line = argv[++i];
    else if (v === "--out") a.out = argv[++i];
  }
  return a;
}

function die(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

// Minimal PCM(L16 mono) → WAV wrapper so Hedra gets a real audio file and we
// know the exact duration in ms.
function pcmToWav(pcm, sampleRate) {
  const numChannels = 1, bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  const wav = Buffer.concat([header, pcm]);
  const durationMs = Math.round((pcm.length / byteRate) * 1000);
  return { wav, durationMs };
}

function wavDurationMs(buf) {
  // Parse a standard 44-byte PCM WAV header.
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF") return null;
  const byteRate = buf.readUInt32LE(28);
  const dataLen = buf.readUInt32LE(40);
  if (!byteRate) return null;
  return Math.round((dataLen / byteRate) * 1000);
}

// ---------------------------------------------------------------------------
async function ttsWithGemini(line) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  console.log(`→ Gemini TTS (${TTS_MODEL}, voice ${TTS_VOICE}): "${line}"`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: line }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } },
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("  TTS failed:", JSON.stringify(data).slice(0, 300));
    return null;
  }
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) {
    console.error("  TTS returned no audio.");
    return null;
  }
  const pcm = Buffer.from(part.inlineData.data, "base64");
  const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || "")?.[1]) || 24000;
  const { wav, durationMs } = pcmToWav(pcm, rate);
  const path = `hedra-hook-${Date.now()}.wav`;
  await writeFile(path, wav);
  console.log(`  ✓ wrote ${path} (${(durationMs / 1000).toFixed(1)}s)`);
  return { path, buf: wav, durationMs };
}

// ---------------------------------------------------------------------------
async function hedra(path, opts = {}) {
  const res = await fetch(`${HEDRA_BASE}${path}`, {
    ...opts,
    headers: { "X-API-Key": process.env.HEDRA_API_KEY, ...(opts.headers || {}) },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) die(`Hedra ${path} → HTTP ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  return data;
}

async function createAndUpload(kind, buf, filename, contentType) {
  const asset = await hedra("/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: filename, type: kind }),
  });
  const assetId = asset.id || asset.asset_id;
  if (!assetId) die(`No asset id returned for ${kind}: ${JSON.stringify(asset)}`);

  const form = new FormData();
  form.append("file", new Blob([buf], { type: contentType }), filename);
  await hedra(`/assets/${assetId}/upload`, { method: "POST", body: form });
  console.log(`  ✓ uploaded ${kind} asset ${assetId}`);
  return assetId;
}

async function poll(generationId) {
  const started = Date.now();
  for (;;) {
    const s = await hedra(`/generations/${generationId}/status`);
    const status = s.status || s.state;
    process.stdout.write(`\r  status: ${status}   (${Math.round((Date.now() - started) / 1000)}s)   `);
    if (status === "complete" || status === "completed" || status === "succeeded") {
      console.log("");
      return s;
    }
    if (status === "error" || status === "failed") die(`Generation ${status}: ${JSON.stringify(s)}`);
    if (Date.now() - started > 10 * 60 * 1000) die("Timed out after 10 min.");
    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function resolveVideoUrl(statusResp) {
  const direct = statusResp.url || statusResp.download_url || statusResp.video_url;
  if (direct) return direct;
  const assetId = statusResp.asset_id || statusResp.result_asset_id;
  if (assetId) {
    const asset = await hedra(`/assets/${assetId}`);
    return asset.url || asset.download_url || asset.asset?.url;
  }
  return null;
}

// ---------------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2));
if (!process.env.HEDRA_API_KEY) die("Set HEDRA_API_KEY (paid plan required — Basic $15 is enough for tests).");
if (!args.image) die("Pass --image /path/to/mini-fiker-3d.png (the asset lives in your local socials repo).");

console.log(`\n🎬 Hedra render — audio: ${args.audio ? basename(args.audio) : `TTS "${args.line}"`}\n`);

// 1) Audio
let audioBuf, audioName, audioType, durationMs;
if (args.audio) {
  audioBuf = await readFile(args.audio);
  audioName = basename(args.audio);
  audioType = args.audio.endsWith(".mp3") ? "audio/mpeg" : "audio/wav";
  durationMs = probeDurationMs(args.audio) || wavDurationMs(audioBuf) || 8000;
  console.log(`→ using ${audioName} (${(durationMs / 1000).toFixed(1)}s)`);
} else {
  const tts = await ttsWithGemini(args.line);
  if (!tts) die("No --audio and Gemini TTS unavailable. Pass --audio hook.wav, or set GEMINI_API_KEY.");
  audioBuf = tts.buf;
  audioName = basename(tts.path);
  audioType = "audio/wav";
  durationMs = tts.durationMs;
}

// 2) Image
const imageBuf = await readFile(args.image);
const imageName = basename(args.image);
const imageType = imageName.endsWith(".jpg") || imageName.endsWith(".jpeg") ? "image/jpeg" : "image/png";

// 3) Upload both
console.log("→ uploading assets to Hedra...");
const imageId = await createAndUpload("image", imageBuf, imageName, imageType);
const audioId = await createAndUpload("audio", audioBuf, audioName, audioType);

// 4) Generate (vertical 9:16 hook, 720p)
console.log(`→ generating avatar video (~${(durationMs / 1000).toFixed(1)}s @ 7 cr/s ≈ ${Math.ceil((durationMs / 1000) * 7)} credits)...`);
const gen = await hedra("/generations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "video",
    ai_model_id: HEDRA_AVATAR_MODEL_ID,
    start_keyframe_id: imageId,
    audio_id: audioId,
    generated_video_inputs: {
      text_prompt: process.env.HEDRA_PROMPT || "Warm, confident creative founder speaking directly to camera, subtle natural gestures, clean solid background for keying.",
      aspect_ratio: "9:16",
      resolution: "720p",
      duration_ms: durationMs,
    },
  }),
});
const generationId = gen.id || gen.generation_id;
if (!generationId) die(`No generation id: ${JSON.stringify(gen)}`);
console.log(`  generation ${generationId} queued.`);

// 5) Poll + download
const finalStatus = await poll(generationId);
const videoUrl = await resolveVideoUrl(finalStatus);
if (!videoUrl) die(`Complete, but no download URL found. Raw status: ${JSON.stringify(finalStatus)}`);

const videoRes = await fetch(videoUrl);
if (!videoRes.ok) die(`Download failed: HTTP ${videoRes.status}`);
await writeFile(args.out, Buffer.from(await videoRes.arrayBuffer()));

console.log(`\n✅ Done → ${args.out}`);
console.log("   Check: clean green-screen? natural lip-sync? face on-brand? If yes → subscribe (Basic $15) and wire hedra_avatar into the video routine.");
