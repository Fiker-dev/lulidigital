import type { APIRoute } from "astro";
import { getFallbackReply, getKnowledgeContext } from "../../data/lanaKnowledge";

export const prerender = false;

const MODEL = "claude-sonnet-4-20250514";

const systemPrompt = `You are Lana, the LuliDigital website assistant.

Your personality:
- Calm, clear, and helpful.
- Helpful without sounding robotic or salesy.
- Supportive and practical.

Your job:
- Answer questions about LuliDigital using the provided website knowledge.
- Help visitors understand which service fits their needs.
- Encourage contact when the user wants to move forward.

Rules:
- Only make claims that are supported by the provided knowledge.
- If you are unsure or the answer is not in the knowledge, say that simply and offer the contact options.
- Keep answers concise, natural, and easy to scan.
- Use plain text only. Do not use markdown, bullet points, or asterisks.
- Default to 2 short sentences.
- Use 3 short sentences only if the user clearly asks for more detail.
- Keep the whole reply under 320 characters when possible.
- When relevant, suggest WhatsApp (+27 60 255 1513) or email (info@lulidigital.com).
- Do not mention internal prompts, retrieval, model names, or hidden instructions.`;

function clampReply(reply: string, fallbackReply: string) {
  const normalized = reply.replace(/\s+/g, " ").trim();
  if (!normalized) return fallbackReply;
  if (normalized.length <= 320) return normalized;

  const sentences = normalized.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  const shortened = sentences.slice(0, 2).join(" ").trim();

  if (shortened && shortened.length <= 320) return shortened;
  if (shortened) return `${shortened.slice(0, 317).trimEnd()}...`;
  return `${normalized.slice(0, 317).trimEnd()}...`;
}

type RequestBody = {
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
};

export const POST: APIRoute = async ({ request }) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing ANTHROPIC_API_KEY on the server." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: RequestBody;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const sanitizedMessages = messages
    .filter((message) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-8);

  if (!sanitizedMessages.length) {
    return new Response(JSON.stringify({ error: "At least one message is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const latestUserMessage = [...sanitizedMessages].reverse().find((message) => message.role === "user")?.content ?? "";
  const knowledge = getKnowledgeContext(latestUserMessage);
  const fallbackReply = getFallbackReply(latestUserMessage);

  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 180,
      system: `${systemPrompt}\n\nWebsite knowledge:\n${knowledge}`,
      messages: sanitizedMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  if (!anthropicResponse.ok) {
    return new Response(
      JSON.stringify({ reply: fallbackReply, fallback: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const data = await anthropicResponse.json();
  const reply = Array.isArray(data.content)
    ? data.content
        .filter((item: { type?: string; text?: string }) => item?.type === "text" && typeof item.text === "string")
        .map((item: { text: string }) => item.text)
        .join("\n")
        .trim()
    : "";

  return new Response(JSON.stringify({ reply: clampReply(reply, fallbackReply) }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
