import type { APIRoute } from "astro";

export const prerender = false;

const REPO_OWNER = "Fiker-dev";
const REPO_NAME = "lulidigital";
const REF = "main";
const MODEL = "claude-haiku-4-5-20251001";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number | string };
    text?: string;
  };
};

type ReviewState = {
  slug: string;
  title: string;
  preview_text: string;
  scheduled_for: string;
  revision_count: number;
};

type LanaMemory = {
  pending_post: unknown;
  pending_drafts: string[];
  review_state: ReviewState | null;
};

type LanaDecision = {
  action: "draft" | "publish" | "schedule" | "unpublish" | "approve" | "revise" | "reject" | "chat";
  reply: string;
  topic?: string;
  keyword?: string;
  category?: string;
  pain_point?: string;
  angle?: string;
  tone_notes?: string;
  cta_text?: string;
  cta_link?: string;
  slug?: string;
  date?: string;
  revision_instructions?: string;
};

function getEnv(name: string) {
  return import.meta.env[name] ?? process.env[name];
}

function normalizeChatId(value: number | string | undefined) {
  return value === undefined ? "" : String(value);
}

async function sendTelegram(chatId: string, text: string) {
  const token = getEnv("TELEGRAM_BOT_TOKEN");
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
}

async function fetchMemory(): Promise<LanaMemory | null> {
  const token = getEnv("GITHUB_WORKFLOW_TOKEN");
  if (!token) return null;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/scripts/lana-memory.json?ref=${REF}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    const decoded = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
    return JSON.parse(decoded) as LanaMemory;
  } catch {
    return null;
  }
}

async function askLana(text: string, reviewState?: ReviewState | null): Promise<LanaDecision> {
  const apiKey = getEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return { action: "chat", reply: "I'm having trouble thinking right now — try again in a moment." };
  }

  const today = new Date().toISOString().split("T")[0];

  let reviewContext = "";
  if (reviewState) {
    reviewContext = `

ACTIVE DRAFT REVIEW:
You are currently in a review loop for a draft post. Fiker is reviewing it and has not yet approved it.
- Slug: ${reviewState.slug}
- Title: "${reviewState.title}"
- Revision count so far: ${reviewState.revision_count}
- Scheduled for: ${reviewState.scheduled_for}
- Preview: "${reviewState.preview_text}"

In this mode, interpret Fiker's message as a response to the draft:
- If he approves (YES, looks good, publish it, schedule it, go ahead, etc.) → action: "approve"
- If he wants changes (any edit request, feedback, or instructions) → action: "revise", fill revision_instructions with his exact instructions
- If he rejects (no, delete it, scrap it, don't publish, forget it) → action: "reject"
- If he asks a question about something else → action: "chat"

Do NOT use "draft", "publish", or "schedule" while a review is active.`;
  }

  const systemPrompt = `You are Lana, the LuliDigital blog assistant. You talk with Fiker (the business owner) on Telegram.

Today's date: ${today}

Personality: direct, warm, like a smart colleague. Keep replies short — this is Telegram.
${reviewContext}
Analyze Fiker's message and reply with a JSON object ONLY (no extra text, no markdown):

{
  "action": "draft" | "publish" | "schedule" | "unpublish" | "approve" | "revise" | "reject" | "chat",
  "reply": "your short conversational reply",

  // include these only for action "draft":
  "topic": "blog post topic",
  "keyword": "main SEO keyword or empty string",
  "category": "AI Automation | Virtual Assistant | Digital Marketing | General",
  "pain_point": "problem the post addresses or empty string",
  "angle": "unique take or empty string",
  "tone_notes": "tone guidance",
  "cta_text": "end-of-article CTA text if Fiker specified one, else empty string",
  "cta_link": "CTA link path — /ai, /marketing, /virtual-assistant, or other page Fiker mentioned, else empty string",

  // include for action "publish":
  "slug": "the post slug",

  // include for action "schedule":
  "slug": "the post slug",
  "date": "YYYY-MM-DD",

  // include for action "unpublish":
  "slug": "the post slug to remove",

  // include for action "revise":
  "revision_instructions": "exact editorial instructions from Fiker"
}

Rules:
- Use "draft" when Fiker gives any blog idea, topic, or content request — including "write something else instead".
- Use "draft" (NOT "schedule") when Fiker says "schedule it for the blog" or "next blog post" WITHOUT giving a specific date AND without giving an existing slug. The post must exist before it can be scheduled.
- Use "publish" when he says to post/publish a specific existing draft now.
- Use "schedule" ONLY when he gives BOTH an existing slug AND a specific date (convert "next Tuesday" to YYYY-MM-DD).
- Use "unpublish" when he says to take down, remove, hide, or revoke a post. Extract the slug from his message.
- Use "chat" for questions, strategy talk, or anything else.
- If Fiker says "take it down" or "remove it" without a slug, ask which post and remind him the slug was in the notification.
- For cta_link: "AI page" or "ai desk" → "/ai", "marketing" → "/marketing", "VA" or "virtual assistant" → "/virtual-assistant", "landing pages" → pick the most relevant service page based on the topic.
- For "chat" replies, be helpful and direct. If he's asking about a draft status, tell him to check GitHub Actions.
- Never mention JSON, commands, or internal workings in your reply.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!response.ok) {
    return { action: "chat", reply: "I ran into an issue. Try again?" };
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text?.trim() ?? "";

  try {
    const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned) as LanaDecision;
  } catch {
    return { action: "chat", reply: raw || "Something went wrong on my end." };
  }
}

async function dispatchWorkflow(workflow: string, inputs: Record<string, string>) {
  const token = getEnv("GITHUB_WORKFLOW_TOKEN");
  if (!token) throw new Error("Missing GITHUB_WORKFLOW_TOKEN.");

  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: REF, inputs }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub workflow failed: ${response.status} ${error}`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const webhookSecret = getEnv("TELEGRAM_WEBHOOK_SECRET");
  const headerSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");

  if (!webhookSecret) {
    return new Response("Webhook secret is not configured", { status: 500 });
  }

  if (headerSecret !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  const chatId = normalizeChatId(update.message?.chat?.id);
  const allowedChatId = getEnv("TELEGRAM_CHAT_ID");
  const text = update.message?.text?.trim() || "";

  if (!chatId || !text) return new Response("OK");

  if (/^\/?myid$/i.test(text)) {
    await sendTelegram(chatId, `Your chat ID: ${chatId}`);
    return new Response("OK");
  }

  if (allowedChatId && chatId !== String(allowedChatId)) {
    return new Response("OK");
  }

  try {
    const memory = await fetchMemory();
    const reviewState = memory?.review_state ?? null;

    const decision = await askLana(text, reviewState);

    if (decision.action === "approve" && reviewState) {
      await dispatchWorkflow("publish-draft-blog.yml", {
        slug: reviewState.slug,
        publish_date: reviewState.scheduled_for,
      });
    } else if (decision.action === "revise" && reviewState && decision.revision_instructions) {
      await dispatchWorkflow("revise-draft.yml", {
        slug: reviewState.slug,
        revision_instructions: decision.revision_instructions,
        scheduled_for: reviewState.scheduled_for,
      });
    } else if (decision.action === "reject" && reviewState) {
      await dispatchWorkflow("delete-draft.yml", { slug: reviewState.slug });
    } else if (decision.action === "draft" && decision.topic) {
      await dispatchWorkflow("auto-blog.yml", {
        topic: decision.topic,
        keyword: decision.keyword || "",
        category: decision.category || "Digital Marketing",
        pain_point: decision.pain_point || "",
        angle: decision.angle || "",
        tone_notes: decision.tone_notes || "Practical, relatable, and solution-focused.",
        cta_text: decision.cta_text || "",
        cta_link: decision.cta_link || "",
        publish_status: "draft",
      });
    } else if (decision.action === "publish" && decision.slug) {
      await dispatchWorkflow("publish-draft-blog.yml", { slug: decision.slug, publish_date: "" });
    } else if (decision.action === "schedule" && decision.slug && decision.date) {
      await dispatchWorkflow("publish-draft-blog.yml", { slug: decision.slug, publish_date: decision.date });
    } else if (decision.action === "unpublish" && decision.slug) {
      await dispatchWorkflow("unpublish-post.yml", { slug: decision.slug });
    }

    await sendTelegram(chatId, decision.reply);
  } catch (error) {
    await sendTelegram(chatId, `Hit an error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return new Response("OK");
};
