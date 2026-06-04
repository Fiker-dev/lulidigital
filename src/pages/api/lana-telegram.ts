import type { APIRoute } from "astro";

export const prerender = false;

const REPO_OWNER = "Fiker-dev";
const REPO_NAME = "lulidigital";
const REF = "main";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number | string };
    text?: string;
    from?: { username?: string; first_name?: string };
  };
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
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
}

async function dispatchWorkflow(workflow: string, inputs: Record<string, string>) {
  const token = getEnv("GITHUB_WORKFLOW_TOKEN");
  if (!token) {
    throw new Error("Missing GITHUB_WORKFLOW_TOKEN.");
  }

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
    throw new Error(`GitHub workflow dispatch failed: ${response.status} ${error}`);
  }
}

function parseField(text: string, field: string) {
  const match = text.match(new RegExp(`^${field}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() || "";
}

function parseBlogIdea(text: string) {
  const cleaned = text
    .replace(/^\/?(blog|draft|idea|lana)\b[:\s-]*/i, "")
    .trim();

  return {
    topic: parseField(text, "topic") || cleaned,
    keyword: parseField(text, "keyword"),
    category: parseField(text, "category") || "AI Automation",
    pain_point: parseField(text, "pain_point") || parseField(text, "pain point"),
    angle: parseField(text, "angle"),
    tone_notes:
      parseField(text, "tone_notes") ||
      parseField(text, "tone notes") ||
      "Funny, relatable, solution-based, pain-relief focused, practical, and human.",
  };
}

function parsePublish(text: string) {
  const [, slug = ""] = text.match(/^\/?publish\s+(.+)$/i) ?? [];
  return slug.trim().replace(/^\/?blog\//, "").replace(/\.md$/, "");
}

function parseSchedule(text: string) {
  const [, slug = "", date = ""] = text.match(/^\/?schedule\s+(\S+)\s+(\d{4}-\d{2}-\d{2})$/i) ?? [];
  return {
    slug: slug.trim().replace(/^\/?blog\//, "").replace(/\.md$/, ""),
    date: date.trim(),
  };
}

const helpText = `Lana blog commands:

/myid
Shows this Telegram chat ID.

/blog your idea
Creates a hidden draft and sends a review note back here.

Detailed draft:
topic: Why founders keep hiring help and still feel overwhelmed
keyword: founder delegation mistakes
category: Virtual Assistant
pain point: They hired someone but still chase everything.
angle: The missing operating system is the real problem.
tone notes: Funny, relatable, pain relief, practical.

/publish slug
Approves and publishes a draft now.

/schedule slug YYYY-MM-DD
Approves a draft for a future date.

If you do nothing, the scheduled blog automation keeps running.`;

export const POST: APIRoute = async ({ request }) => {
  const webhookSecret = getEnv("TELEGRAM_WEBHOOK_SECRET");
  const headerSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");

  if (webhookSecret && headerSecret !== webhookSecret) {
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
    await sendTelegram(chatId, `This Telegram chat ID is:\n\n${chatId}\n\nUse it as TELEGRAM_CHAT_ID.`);
    return new Response("OK");
  }

  if (allowedChatId && chatId !== String(allowedChatId)) {
    await sendTelegram(chatId, "This Lana command channel is private.");
    return new Response("OK");
  }

  try {
    if (/^\/?(help|commands)$/i.test(text)) {
      await sendTelegram(chatId, helpText);
      return new Response("OK");
    }

    if (/^\/?publish\s+/i.test(text)) {
      const slug = parsePublish(text);
      if (!slug) throw new Error("Missing draft slug.");

      await dispatchWorkflow("publish-draft-blog.yml", { slug, publish_date: "" });
      await sendTelegram(chatId, `Publishing draft now: ${slug}`);
      return new Response("OK");
    }

    if (/^\/?schedule\s+/i.test(text)) {
      const { slug, date } = parseSchedule(text);
      if (!slug || !date) throw new Error("Use /schedule slug YYYY-MM-DD");

      await dispatchWorkflow("publish-draft-blog.yml", { slug, publish_date: date });
      await sendTelegram(chatId, `Scheduling draft for ${date}: ${slug}`);
      return new Response("OK");
    }

    if (/^\/?(blog|draft|idea|lana)\b/i.test(text) || /^topic:/im.test(text)) {
      const idea = parseBlogIdea(text);
      if (!idea.topic) throw new Error("Send a topic or idea for the draft.");

      await dispatchWorkflow("auto-blog.yml", {
        ...idea,
        publish_status: "draft",
      });
      await sendTelegram(chatId, `Lana is drafting this as a hidden post:\n\n${idea.topic}\n\nI will send the approval command when the draft is ready.`);
      return new Response("OK");
    }

    await sendTelegram(chatId, helpText);
  } catch (error) {
    await sendTelegram(chatId, `Lana could not run that command yet: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return new Response("OK");
};
