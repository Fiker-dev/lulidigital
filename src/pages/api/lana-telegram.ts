import type { APIRoute } from "astro";
import { generateGeminiText } from "../../lib/geminiFallback.js";
import { timingSafeEqual } from "../../lib/security";
import {
  parseHeuristicDecision,
  parseLocalFallback,
  resolveApprovalSlug,
  type LanaDecision,
  type LanaMemory,
  type ReviewState,
} from "../../lib/lana-intent";

export const prerender = false;

const REPO_OWNER = "Fiker-dev";
const REPO_NAME = "lulidigital";
const REF = "main";
const DEFAULT_MODEL = "claude-sonnet-4-6";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number | string };
    text?: string;
  };
  callback_query?: {
    id?: string;
    data?: string;
    message?: {
      chat?: { id?: number | string };
    };
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
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
}

async function answerCallbackQuery(callbackQueryId: string | undefined, text: string) {
  const token = getEnv("TELEGRAM_BOT_TOKEN");
  if (!token || !callbackQueryId) return;

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
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

async function askLana(
  text: string,
  reviewState?: ReviewState | null,
  memory?: LanaMemory | null,
): Promise<LanaDecision> {
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

In this mode you are talking the draft through with Fiker. Be conversational and collaborative — discuss what he wants and only change the post when the change is clear. Do not rush to rewrite on the first hint of feedback.

What you CAN change: the article's WRITING — wording, structure, tone, length, the headline, the intro, the CTA, examples, and any section (add, cut, rewrite, reorder text).
What you CANNOT change from here (these are automatic template/design, not article content): the host illustration/avatar, images, page layout, where blocks sit on the page, fonts, or colours. The host illustration is chosen automatically to match each section's topic. If Fiker asks for any of those, say so plainly in your reply, never use "revise" for it, and offer what you CAN do instead (rework the writing).

Choose the action:
- "approve": he clearly approves (yes, looks good, ship it, publish it, go ahead, good to go).
- "reject": he clearly rejects (no, delete it, scrap it, don't publish, not this one).
- "revise": ONLY when he gives a clear, concrete instruction to change the WRITING now (e.g. "make the intro punchier", "cut the third section", "add a UK SaaS example", "rewrite the headline to X"). Put his exact instruction in revision_instructions. You do NOT need a yes/no confirmation first — if the text instruction is actionable, just do it.
- "chat": for everything else — discussing ideas, vague or broad feedback, questions, or anything about the avatar/layout/images. When you need a detail before you can edit, ask ONE short, OPEN question (never a yes/no question, because "yes" means approve). Keep the conversation going until the writing change is concrete, then revise.

Do NOT use "draft", "publish", or "schedule" while a review is active.`;
  }

  const systemPrompt = `You are Lana, the LuliDigital blog agent. You talk with Fiker (the business owner) on Telegram.

Today's date: ${today}

Personality: direct, warm, like a smart editorial operator. Keep replies short because this is Telegram.

AGENT BEHAVIOR
- Do not behave like a command bot. Do not wait for perfect commands when intent is clear.
- Think with Fiker: propose a plan, make sensible assumptions, and move the work forward.
- Ask one concise clarifying question only when the missing detail blocks action.
- When action is clear, take it and explain what will happen next.
- When planning, give Fiker a useful draft direction, not a form to fill.
- Never say "use this command", "send a slash command", "check GitHub", or mention internal workflows.
- Never over-explain. Sound like a capable teammate, not support software.
${reviewContext}
Analyze Fiker's message and reply with a JSON object ONLY (no extra text, no markdown):

{
  "action": "draft" | "plan" | "publish" | "schedule" | "unpublish" | "approve" | "revise" | "reject" | "chat",
  "reply": "your short conversational reply",

  // include for action "plan":
  "plan": [
    {
      "topic": "blog post topic",
      "keyword": "main SEO keyword or empty string",
      "category": "AI Automation | Virtual Assistant | Digital Marketing | General",
      "pain_point": "reader pain point",
      "angle": "hook-led solution angle",
      "tone_notes": "tone guidance",
      "source_notes": "AI update or creator story direction to respond to without copying",
      "source_url": "source URL if supplied, else empty string",
      "fiker_take": "Fiker/LuliDigital point of view if supplied",
      "cta_text": "CTA text if relevant, else empty string",
      "cta_link": "CTA link path if relevant, else empty string"
    }
  ],
  "replace_existing_plan": true,

  // include these only for action "draft":
  "topic": "blog post topic",
  "keyword": "main SEO keyword or empty string",
  "category": "AI Automation | Virtual Assistant | Digital Marketing | General",
  "pain_point": "problem the post addresses or empty string",
  "angle": "unique take or empty string",
  "tone_notes": "tone guidance",
  "source_notes": "creator update, AI news, story direction, or source summary to respond to without copying",
  "source_url": "source URL if Fiker sent one, else empty string",
  "fiker_take": "Fiker or LuliDigital's point of view in Fiker's own words when supplied",
  "cta_text": "end-of-article CTA text if Fiker specified one, else empty string",
  "cta_link": "CTA link path — /ai, /marketing, /virtual-assistant, or other page Fiker mentioned, else empty string",
  "publish_status": "draft | publish",

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
- Conversate like a senior content partner. If Fiker asks to plan, reason briefly, make the plan, and queue it when there is enough direction. Do not force slash commands.
- Use "plan" when Fiker asks to plan 3 blogs, map out the next three posts, build a content plan, or choose a weekly blog direction. Return exactly 3 plan items unless he asks for a different number.
- Each plan item should have a strong hook-led topic, a source-led or update-led angle when available, and a solution-based offering path. Educate first, sell second.
- If he gives a broad direction, create a useful 3-blog plan from it. In the reply, say he can still send creator links or AI updates to refine the plan.
- Use "draft" when Fiker gives any blog idea, topic, or content request — including "write something else instead".
- Use "draft" when Fiker wants a blog outside scheduled dates, today, now, or right away. This creates a draft immediately for approval unless he explicitly says to publish live without approval.
- Use publish_status "publish" only when he explicitly says publish live now, post live now, or do it without approval. Otherwise publish_status must be "draft".
- When Fiker shares a TikTok/creator/AI update/story, use "draft" if he wants it turned into a post. Put the update or story summary in source_notes, the URL in source_url, and his personal opinion in fiker_take if he gives one.
- Do not invent personal stories, fake client anecdotes, fake quotes, or fabricated relatability. If he asks for relatability, make it grounded in the supplied source notes or operational patterns.
- Use "draft" (NOT "schedule") when Fiker says "schedule it for the blog" or "next blog post" WITHOUT giving a specific date AND without giving an existing slug. The post must exist before it can be scheduled.
- Use "publish" when he says to post/publish a specific existing draft now.
- Use "schedule" ONLY when he gives BOTH an existing slug AND a specific date (convert "next Tuesday" to YYYY-MM-DD).
- Use "unpublish" when he says to take down, remove, hide, or revoke a post. Extract the slug from his message.
- Use "chat" for questions, strategy talk, or anything else.
- If Fiker says "take it down" or "remove it" without a slug, ask which post and remind him the slug was in the notification.
- For cta_link: "AI page" or "ai desk" → "/ai-desk", "marketing" → "/marketing-desk", "VA" or "virtual assistant" → "/va-desk", "landing pages" → pick the most relevant service page based on the topic.
- For "chat" replies, be helpful and direct. If he's asking about a draft status, tell him to check GitHub Actions.
- Never mention JSON, commands, or internal workings in your reply.`;

  // Gemini Flash is primary for this internal command-parsing tool — fast, cheap,
  // and strong at structured JSON intent extraction. Claude is the fallback.
  const geminiDecision = await askGeminiLana(text, memory ?? null, systemPrompt, false);
  if (geminiDecision) return geminiDecision;

  const apiKey = getEnv("ANTHROPIC_API_KEY");
  if (apiKey) {
    const model = getEnv("LANA_TELEGRAM_MODEL") || getEnv("ANTHROPIC_MODEL") || DEFAULT_MODEL;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const raw = data.content?.[0]?.text?.trim() ?? "";
      try {
        const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
        return JSON.parse(cleaned) as LanaDecision;
      } catch {
        return { action: "chat", reply: raw || "Something went wrong on my end." };
      }
    }
    console.error("Lana Telegram Anthropic fallback failed:", response.status, await response.text());
  }

  // Last resort: local heuristic parse.
  return parseLocalFallback(text, memory ?? null);
}

async function askGeminiLana(
  text: string,
  memory: LanaMemory | null,
  systemPrompt: string,
  allowLocalFallback = true,
): Promise<LanaDecision | null> {
  const raw = await generateGeminiText({
    system: systemPrompt || "You are Lana, the LuliDigital blog agent. Reply as JSON only.",
    messages: [{ role: "user", content: text }],
    maxTokens: 700,
    temperature: 0.2,
  });

  // When used as the primary model, return null on failure so the caller can try Claude.
  if (!raw) return allowLocalFallback ? parseLocalFallback(text, memory) : null;

  try {
    const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[0] || cleaned) as LanaDecision;
  } catch {
    return allowLocalFallback ? { action: "chat", reply: raw } : null;
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

  if (!headerSecret || !timingSafeEqual(headerSecret, webhookSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  const chatId = normalizeChatId(update.message?.chat?.id ?? update.callback_query?.message?.chat?.id);
  const allowedChatId = getEnv("TELEGRAM_CHAT_ID");
  const callbackData = update.callback_query?.data?.trim() || "";
  const text = update.message?.text?.trim() || "";

  if (!chatId || (!text && !callbackData)) return new Response("OK");

  if (!allowedChatId) {
    return new Response("Allowed chat is not configured", { status: 500 });
  }

  if (/^\/?myid$/i.test(text)) {
    await sendTelegram(chatId, `Your chat ID: ${chatId}`);
    return new Response("OK");
  }

  if (chatId !== String(allowedChatId)) {
    return new Response("OK");
  }

  try {
    const memory = await fetchMemory();
    const reviewState = memory?.review_state ?? null;

    if (callbackData === "blog_approve" || callbackData.startsWith("blog_approve:")) {
      const slug = resolveApprovalSlug(callbackData, reviewState);
      if (!slug) {
        await answerCallbackQuery(update.callback_query?.id, "No draft is waiting for approval.");
        await sendTelegram(chatId, "I do not have an active draft waiting for approval.");
        return new Response("OK");
      }
      // Approve = schedule for the planned slot, so posts drip out on a steady
      // cadence and the daily Publish Scheduled Posts job takes them live + indexes
      // them that morning. If we don't know a date (button on a stale draft), fall
      // back to publishing now.
      const scheduleDate = reviewState?.slug === slug ? reviewState.scheduled_for : "";
      if (scheduleDate) {
        await dispatchWorkflow("schedule-draft.yml", { slug, date: scheduleDate });
        await answerCallbackQuery(update.callback_query?.id, "Approved. Scheduled.");
        await sendTelegram(chatId, `Approved. Scheduled ${slug} for ${scheduleDate}. It'll go live and get indexed that morning. Say "publish ${slug} now" to go live sooner.`);
      } else {
        await dispatchWorkflow("publish-draft-blog.yml", { slug, publish_date: "" });
        await answerCallbackQuery(update.callback_query?.id, "Approved. Publishing now.");
        await sendTelegram(chatId, `Approved. Publishing ${slug} now.`);
      }
      return new Response("OK");
    }

    // During an active review the human-in-the-loop reply wins, so "remove it"
    // and "delete it" reject the draft rather than being read as an unpublish
    // command for a post literally named "it".
    const decision = parseHeuristicDecision(text, memory, reviewState) ?? await askLana(text, reviewState, memory);

    if (decision.action === "approve" && reviewState) {
      // Default: schedule for the planned slot. Only go live immediately when he
      // explicitly says so ("publish now", "today", "go live now").
      const wantsNow = /\b(now|today|immediately|right\s*away|asap|go\s*live|straight\s*away)\b/i.test(text);
      if (wantsNow) {
        await dispatchWorkflow("publish-draft-blog.yml", { slug: reviewState.slug, publish_date: "" });
        decision.reply = `Approved. Publishing ${reviewState.slug} live now.`;
      } else {
        await dispatchWorkflow("schedule-draft.yml", { slug: reviewState.slug, date: reviewState.scheduled_for });
        decision.reply = `Approved. Scheduled ${reviewState.slug} for ${reviewState.scheduled_for}. It'll go live and get indexed that morning. Say "publish it now" to go live sooner.`;
      }
    } else if (decision.action === "revise" && reviewState && decision.revision_instructions) {
      await dispatchWorkflow("revise-draft.yml", {
        slug: reviewState.slug,
        revision_instructions: decision.revision_instructions,
        scheduled_for: reviewState.scheduled_for,
      });
    } else if (decision.action === "reject" && reviewState) {
      await dispatchWorkflow("delete-draft.yml", { slug: reviewState.slug });
    } else if (decision.action === "plan" && Array.isArray(decision.plan) && decision.plan.length > 0) {
      await dispatchWorkflow("save-blog-plan.yml", {
        plan_json: JSON.stringify(decision.plan.slice(0, 6)),
        replace_existing: decision.replace_existing_plan === false ? "false" : "true",
      });
    } else if (decision.action === "draft" && decision.topic) {
      await dispatchWorkflow("auto-blog.yml", {
        topic: decision.topic,
        keyword: decision.keyword || "",
        category: decision.category || "Digital Marketing",
        pain_point: decision.pain_point || "",
        angle: decision.angle || "",
        tone_notes: decision.tone_notes || "Practical, grounded, and solution-focused. Avoid fabricated relatability.",
        source_notes: decision.source_notes || "",
        source_url: decision.source_url || "",
        fiker_take: decision.fiker_take || "",
        cta_text: decision.cta_text || "",
        cta_link: decision.cta_link || "",
        publish_status: decision.publish_status === "publish" ? "publish" : "draft",
      });
    } else if (decision.action === "publish" && decision.slug) {
      await dispatchWorkflow("publish-draft-blog.yml", { slug: decision.slug, publish_date: "" });
    } else if (decision.action === "schedule" && decision.slug && decision.date) {
      await dispatchWorkflow("schedule-draft.yml", { slug: decision.slug, date: decision.date });
    } else if (decision.action === "unpublish" && decision.slug) {
      await dispatchWorkflow("unpublish-post.yml", { slug: decision.slug });
    }

    await sendTelegram(chatId, decision.reply);
  } catch (error) {
    await sendTelegram(chatId, `Hit an error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return new Response("OK");
};
