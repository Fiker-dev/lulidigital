/**
 * Pure intent-parsing logic for the Lana Telegram agent.
 *
 * This module is intentionally free of any Astro / import.meta / network
 * dependencies so it can be unit-tested directly under Node
 * (see scripts/telegram-intent-test.mjs). The HTTP handler in
 * src/pages/api/lana-telegram.ts imports these helpers and only adds I/O
 * (Telegram + GitHub workflow dispatch) on top.
 */

export type ReviewState = {
  slug: string;
  title: string;
  preview_text: string;
  scheduled_for: string;
  revision_count: number;
};

export type BlogPlanItem = {
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

export type LanaMemory = {
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

export type LanaDecision = {
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

export function normalizeSlug(value: string) {
  return value
    .replace(/^https?:\/\/(?:www\.)?lulidigital\.com\/blog\//i, "")
    .replace(/^\/?blog\//i, "")
    .replace(/\.md$/i, "")
    .replace(/[.,!?;:)\]]+$/g, "")
    .trim();
}

export function extractSlug(text: string) {
  const urlMatch = text.match(/https?:\/\/(?:www\.)?lulidigital\.com\/blog\/([a-z0-9-]+)/i);
  if (urlMatch?.[1]) return normalizeSlug(urlMatch[1]);

  const slugMatch = text.match(/\b([a-z0-9]+(?:-[a-z0-9]+){2,})\b/i);
  return slugMatch?.[1] ? normalizeSlug(slugMatch[1]) : "";
}

export function extractDate(text: string) {
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch?.[1]) return isoMatch[1];

  const slashMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (!slashMatch) return "";

  const [, day, month, year] = slashMatch;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function cleanDraftTopic(text: string) {
  return text
    .trim()
    .replace(/^\/?(blog|draft|post)\s*/i, "")
    .replace(/^(please\s+)?(write|draft|create|make|prepare|generate|do|redo|repost)\s+/i, "")
    .replace(/^(a\s+)?(new\s+)?(blog\s+post|article|post)\s*/i, "")
    .replace(/^(about|on|for)\s+/i, "")
    .trim();
}

/**
 * Resolves the slug the approval button should publish. Telegram inline
 * buttons send "blog_approve" (no slug) so we fall back to the active
 * review_state. "blog_approve:my-slug" is also supported for robustness.
 */
export function resolveApprovalSlug(callbackData: string, reviewState: ReviewState | null) {
  const callbackSlug = normalizeSlug(callbackData.replace(/^blog_approve:?/, ""));
  return callbackSlug || reviewState?.slug || "";
}

export function parseLocalFallback(text: string, memory: LanaMemory | null): LanaDecision {
  const compact = text.trim();
  const lower = compact.toLowerCase();
  const slug = extractSlug(compact);
  const date = extractDate(compact);

  const publishIntent = /\b(publish|post|ship|schedule|put\s+live|make\s+live|send\s+live|go\s+live)\b/i.test(compact);
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

  // A status question ("what's the latest post?") must win over the draft
  // heuristic below, which would otherwise match the word "post". Only treat it
  // as a status query when there is no explicit draft verb in the message.
  const latest = memory?.latest_live_post?.slug;
  const explicitDraftVerb = /\b(write|draft|create|generate|make|repost|redo)\b/i.test(compact);
  if (latest && !explicitDraftVerb && /\b(status|latest|last post|what draft|which post)\b/i.test(compact)) {
    return {
      action: "chat",
      reply: `The latest live post I have is ${latest}.`,
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

  return {
    action: "chat",
    reply: "I can still approve, revise, draft, publish, or take down blog posts. Tell me what you want changed.",
  };
}

export function parseDirectControl(text: string, memory: LanaMemory | null): LanaDecision | null {
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

export function parseReviewReply(text: string, reviewState: ReviewState | null): LanaDecision | null {
  if (!reviewState) return null;

  const compact = text.trim();

  // A bare thumbs-up is an approval. Handled separately because the \b word
  // boundary used below does not match against an emoji.
  if (/^\s*👍(?:[\u{1F3FB}-\u{1F3FF}])?[\s.!]*$/u.test(compact)) {
    return {
      action: "approve",
      reply: `Approved. Publishing ${reviewState.slug} now.`,
    };
  }

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

  // Everything else during a review — feedback, questions, edit requests — is
  // handled conversationally by the LLM (see askLana's review prompt). We no
  // longer auto-fire a full rewrite on any change-like keyword: Lana talks it
  // through and only revises on a clear, concrete instruction to change the
  // writing.
  return null;
}

/**
 * Decides which heuristic interpretation (if any) applies before falling back
 * to the LLM. During an active review the human-in-the-loop reply wins, so that
 * "remove it" / "delete it" reject the draft instead of being mis-read as an
 * unpublish command for a post literally named "it".
 */
export function parseHeuristicDecision(
  text: string,
  memory: LanaMemory | null,
  reviewState: ReviewState | null,
): LanaDecision | null {
  // During an active review only approve/reject are decided deterministically;
  // all other messages (edits, feedback, questions) fall through to the
  // conversational LLM. We deliberately skip parseDirectControl here so that
  // wording like "remove the second paragraph" is discussed/revised rather than
  // mis-read as an unpublish command.
  if (reviewState) return parseReviewReply(text, reviewState);
  return parseDirectControl(text, memory);
}
