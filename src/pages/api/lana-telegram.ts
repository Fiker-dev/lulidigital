import type { APIRoute } from "astro";
import { timingSafeEqual } from "../../lib/security";

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

type ReviewState = {
  slug: string;
  title: string;
  preview_text: string;
  scheduled_for: string;
  revision_count: number;
};

type LanaMemory = {
  pending_post: unknown;
  blog_plan_queue?: BlogPlanItem[];
  pending_drafts?: string[];
  review_state?: ReviewState | null;
  latest_live_post?: {
    slug: string;
    title: string;
    published_at: string;
  };
};

type BlogPlanItem = {
  topic: string;
  keyword?: string;
  category?: string;
  pain_point?: string;
  angle?: string;
  tone_notes?: string;
  source_notes?: string;
  source_url?: string;
  fiker_take?: string;
  cta_text?: string;
  cta_link?: string;
};

type LanaDecision = {
  action: "draft" | "plan" | "publish" | "schedule" | "unpublish" | "approve" | "revise" | "reject" | "chat";
  reply: string;
  plan?: BlogPlanItem[];
  replace_existing_plan?: boolean;
  publish_status?: "draft" | "publish";
  topic?: string;
  keyword?: string;
  category?: string;
  pain_point?: string;
  angle?: string;
  tone_notes?: string;
  source_notes?: string;
  source_url?: string;
  fiker_take?: string;
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

function normalizeSlug(value: string) {
  return value
    .replace(/^https?:\/\/(?:www\.)?lulidigital\.com\/blog\//i, "")
    .replace(/^\/?blog\//i, "")
    .replace(/\.md$/i, "")
    .replace(/[.,!?;:)\]]+$/g, "")
    .trim();
}

function extractSlug(text: string) {
  const urlMatch = text.match(/https?:\/\/(?:www\.)?lulidigital\.com\/blog\/([a-z0-9-]+)/i);
  if (urlMatch?.[1]) return normalizeSlug(urlMatch[1]);

  const slugMatch = text.match(/\b([a-z0-9]+(?:-[a-z0-9]+){2,})\b/i);
  return slugMatch?.[1] ? normalizeSlug(slugMatch[1]) : "";
}

function extractDate(text: string) {
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch?.[1]) return isoMatch[1];

  const slashMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (!slashMatch) return "";

  const [, day, month, year] = slashMatch;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function cleanDraftTopic(text: string) {
  return text
    .trim()
    .replace(/^\/?(blog|draft|post)\s*/i, "")
    .replace(/^(please\s+)?(write|draft|create|make|prepare|generate|do|redo|repost)\s+/i, "")
    .replace(/^(a\s+)?(new\s+)?(blog\s+post|article|post)\s*/i, "")
    .replace(/^(about|on|for)\s+/i, "")
    .trim();
}

function parseLocalFallback(text: string, memory: LanaMemory | null): LanaDecision {
  const compact = text.trim();
  const lower = compact.toLowerCase();
  const slug = extractSlug(compact);
  const date = extractDate(compact);

  const publishIntent = /\b(publish|post|ship|put\s+live|make\s+live|send\s+live)\b/i.test(compact);
  if (publishIntent && slug && !/\b(write|draft|create|new|repost|redo)\b/i.test(compact)) {
    if (date) {
      return {
        action: "schedule",
        slug,
        date,
        reply: `Got it. Scheduling ${slug} for ${date}.`,
      };
    }

    return {
      action: "publish",
      slug,
      reply: `Got it. Publishing ${slug} now.`,
    };
  }

  const planIntent = /\b(plan|queue|map\s+out|content\s+calendar)\b/i.test(compact) && /\b(3|three|blogs?|posts?|articles?)\b/i.test(compact);
  if (planIntent) {
    return {
      action: "chat",
      reply: "I can plan the three posts. I would anchor them around: one AI update, one human-approval angle, and one solution-led LuliDigital systems post. Send any creator links you want included and I will use them as source direction, not copy.",
    };
  }

  const draftIntent = /\b(blog|post|article|write|draft|create|generate|repost|redo|new\s+post|content)\b/i.test(compact);
  if (draftIntent) {
    const topic = cleanDraftTopic(compact) || compact;
    return {
      action: "draft",
      topic,
      keyword: "",
      category: lower.includes("virtual assistant") || /\bva\b/i.test(compact)
        ? "Virtual Assistant"
        : lower.includes("marketing") || lower.includes("seo")
          ? "Digital Marketing"
          : lower.includes("ai") || lower.includes("automation")
            ? "AI Automation"
            : "General",
      pain_point: "",
      angle: "",
      tone_notes: "Grounded, human, specific, and useful. Avoid keyword stuffing and fabricated relatability.",
      source_notes: "",
      source_url: "",
      fiker_take: "",
      cta_text: "",
      cta_link: "",
      publish_status: /\b(publish\s+live|publish\s+now|post\s+live|without approval)\b/i.test(compact) ? "publish" : "draft",
      reply: /\b(outside\s+the\s+schedule|now|today|asap|right\s+away)\b/i.test(compact)
        ? `I can handle it outside the schedule. Drafting this for review now: ${topic}`
        : `I can still handle it. Drafting this for review: ${topic}`,
    };
  }

  const latest = memory?.latest_live_post?.slug;
  if (/\b(status|latest|last post|what draft|which post)\b/i.test(compact) && latest) {
    return {
      action: "chat",
      reply: `The latest live post I have is ${latest}.`,
    };
  }

  return {
    action: "chat",
    reply: "I can still approve, revise, draft, publish, or take down blog posts. Tell me what you want changed.",
  };
}

function parseDirectControl(text: string, memory: LanaMemory | null): LanaDecision | null {
  const compact = text.trim();
  const lower = compact.toLowerCase();
  const unpublishIntent = /\b(take\s+down|take\s+it\s+down|remove|hide|unpublish|revoke)\b/i.test(compact);

  if (!unpublishIntent) return null;

  const urlMatch = compact.match(/https?:\/\/(?:www\.)?lulidigital\.com\/blog\/([a-z0-9-]+)/i);
  const commandMatch = compact.match(/\b(?:take\s+down|remove|hide|unpublish|revoke)\s+(.+)$/i);
  const directSlug = urlMatch?.[1] || (commandMatch ? normalizeSlug(commandMatch[1]) : "");
  const fallbackSlug = lower.includes("take it down") ? memory?.latest_live_post?.slug : "";
  const slug = normalizeSlug(directSlug || fallbackSlug || "");

  if (!slug) {
    return {
      action: "chat",
      reply: "Send me the slug or URL and I will take it down. Example: take down my-post-slug",
    };
  }

  return {
    action: "unpublish",
    slug,
    reply: `Taking it down now: ${slug}`,
  };
}

function parseReviewReply(text: string, reviewState: ReviewState | null): LanaDecision | null {
  if (!reviewState) return null;

  const compact = text.trim();

  const approvePattern = /^(yes|yep|yeah|y|ok|okay|approved?|approve it|approve and publish|publish|publish it|post|post it|ship|ship it|send it|go ahead|looks good|looks good to me|all good|good to go|fine|perfect|love it|that works|run it|do it|schedule it|put it live|make it live|green light|thumbs up|proceed)\b[.! ]*$/i;
  if (approvePattern.test(compact)) {
    return {
      action: "approve",
      reply: `Approved. Publishing ${reviewState.slug} now.`,
    };
  }

  const rejectPattern = /^(no|nope|nah|reject|reject it|delete|delete it|scrap|scrap it|kill it|drop it|bin it|trash it|forget it|do not publish|don't publish|dont publish|not this|not this one|cancel|cancel it|remove draft|remove it)\b[.! ]*$/i;
  if (rejectPattern.test(compact)) {
    return {
      action: "reject",
      reply: `Got it. Removing draft ${reviewState.slug}.`,
    };
  }

  const asksForChanges = /\b(change|revise|rewrite|edit|adjust|fix|make it|make this|can you|could you|please|shorter|longer|more|less|natural|human|premium|specific|different|title|headline|intro|opening|cta|tone|angle|countries|keyword|seo|remove|add|include|mention|avoid|sounds|doesn't sound|does not sound)\b/i.test(compact);
  if (asksForChanges) {
    return {
      action: "revise",
      reply: `I'll revise ${reviewState.slug} with that feedback.`,
      revision_instructions: compact,
    };
  }

  return null;
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
  const apiKey = getEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return parseLocalFallback(text, memory ?? null);
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
- If he approves (YES, approved, looks good, ship it, publish it, post it, schedule it, go ahead, green light, good to go, etc.) → action: "approve"
- If he wants changes (any edit request, feedback, "make it more natural", "change the title", "include other countries", "less SEO", etc.) → action: "revise", fill revision_instructions with his exact instructions
- If he rejects (no, reject it, delete it, scrap it, don't publish, not this one, cancel it, forget it) → action: "reject"
- If he asks a question about something else → action: "chat"

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

  if (!response.ok) {
    console.error("Lana Telegram Anthropic failed:", response.status, await response.text());
    return parseLocalFallback(text, memory ?? null);
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

    if (callbackData.startsWith("blog_approve:")) {
      const slug = normalizeSlug(callbackData.replace(/^blog_approve:/, ""));
      const publishDate = reviewState?.slug === slug ? reviewState.scheduled_for : "";
      await dispatchWorkflow("publish-draft-blog.yml", { slug, publish_date: publishDate });
      await answerCallbackQuery(update.callback_query?.id, "Approved. Publishing now.");
      await sendTelegram(chatId, `Approved. Publishing ${slug} now.`);
      return new Response("OK");
    }

    const decision = parseDirectControl(text, memory) ?? parseReviewReply(text, reviewState) ?? await askLana(text, reviewState, memory);

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
