/**
 * Generate the brand "princess" voiceover with Gemini TTS, save a WAV you can
 * upload straight into Hedra (Audio input) so the mini-Fiker speaks in YOUR
 * personal-track voice — not a generic Hedra voice.
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/princess-vo.mjs "line to say" [out.wav]
 *   # voice / model overridable:
 *   PRINCESS_VOICE=Achernar PRINCESS_TTS_MODEL=gemini-3.1-flash-tts-preview node scripts/princess-vo.mjs
 */

import { writeFile } from "node:fs/promises";

const MODEL = process.env.PRINCESS_TTS_MODEL || "gemini-2.5-flash-preview-tts";
// Soft, youthful, enchanting → princessey. Alternatives: Achernar(soft),
// Sulafat(warm), Vindemiatrix(gentle), Aoede(breezy), Autonoe(bright).
const VOICE = process.env.PRINCESS_VOICE || "Leda";

const LINE =
  process.argv[2] ||
  "Everyone automates the wrong things first. Here's the one that actually gives you your week back.";
const OUT = process.argv[3] || `${process.env.HOME}/Desktop/princess-vo.wav`;

// Natural-language style steering (Gemini 2.5+ TTS reads the direction).
// Default = excited princess × relatable friend. Override with PRINCESS_STYLE.
const STYLE =
  process.env.PRINCESS_STYLE ||
  "Say this like an excited young woman telling her best friend something she's genuinely thrilled about — bright, warm, playful, with a sparkle of princess magic but totally down-to-earth and familiar. Upbeat, animated, natural, and relatable, like an excited voice note to a close friend:";
const STYLED = `${STYLE}\n\n${LINE}`;

function pcmToWav(pcm, sampleRate) {
  const numChannels = 1, bits = 16;
  const byteRate = (sampleRate * numChannels * bits) / 8;
  const blockAlign = (numChannels * bits) / 8;
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);
  h.writeUInt16LE(numChannels, 22); h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(byteRate, 28); h.writeUInt16LE(blockAlign, 32);
  h.writeUInt16LE(bits, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return { wav: Buffer.concat([h, pcm]), durationMs: Math.round((pcm.length / byteRate) * 1000) };
}

const key = process.env.GEMINI_API_KEY;
if (!key) { console.error("Set GEMINI_API_KEY."); process.exit(1); }

console.log(`Voice: ${VOICE} · Model: ${MODEL}\nLine: "${LINE}"\n`);

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: STYLED }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
      },
    }),
  }
);

const data = await res.json();
if (!res.ok) { console.error("TTS failed:", JSON.stringify(data, null, 2).slice(0, 800)); process.exit(1); }

const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
if (!part) { console.error("No audio returned:", JSON.stringify(data).slice(0, 400)); process.exit(1); }

const pcm = Buffer.from(part.inlineData.data, "base64");
const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || "")?.[1]) || 24000;
const { wav, durationMs } = pcmToWav(pcm, rate);
await writeFile(OUT, wav);
console.log(`✅ ${OUT}  (${(durationMs / 1000).toFixed(1)}s) — upload this into Hedra's Audio input.`);
