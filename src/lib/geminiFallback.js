const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** @typedef {{ role: "user" | "assistant", content: string }} GeminiMessage */
/** @typedef {{ system?: string, messages?: GeminiMessage[], maxTokens?: number, temperature?: number, thinkingBudget?: number }} GeminiOptions */

export function getGeminiApiKey() {
  return import.meta?.env?.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
}

export function getGeminiModel() {
  return import.meta?.env?.GEMINI_MODEL ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

/** @param {GeminiOptions} [options] */
export async function generateGeminiText(options = {}) {
  const {
  system = "",
  messages = [],
  maxTokens = 800,
  temperature = 0.4,
  thinkingBudget,
  } = options;
  const apiKey = getGeminiApiKey();
  if (!apiKey) return "";

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const contents = messages
    .filter((message) => message && typeof message.content === "string" && message.content.trim())
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content.trim() }],
    }));

  if (contents.length === 0) return "";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
        // gemini-2.5 models spend output tokens on internal "thinking" by
        // default. Pass thinkingBudget: 0 to disable it for structured/JSON
        // tasks so the token budget goes to the actual answer.
        ...(thinkingBudget !== undefined ? { thinkingConfig: { thinkingBudget } } : {}),
      },
    }),
  });

  if (!response.ok) {
    console.error("Gemini API error:", response.status, await response.text());
    return "";
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim() || "";
}
