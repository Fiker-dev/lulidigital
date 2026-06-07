export type LanaKnowledgeChunk = {
  id: string;
  title: string;
  text: string;
  keywords: string[];
};

const chunks: LanaKnowledgeChunk[] = [
  {
    id: "about",
    title: "About LuliDigital",
    text:
      "LuliDigital works like an editorial floor. The studio clarifies the story, pressure tests it in market, and builds systems teams can trust when decisions need to move fast. The business covers Marketing, AI, and Virtual Assistant Desk support. The tone is human, calm, clear, practical, and supportive.",
    keywords: ["about", "company", "brand", "studio", "lulidigital", "services"],
  },
  {
    id: "marketing",
    title: "Marketing Desk",
    text:
      "The Marketing Desk shapes brand voice, designs creative direction, and runs paid media with disciplined execution. It is best for launches, rebrands, and growth sprints. Cadence includes weekly reporting and monthly iteration. Typical work includes positioning and messaging, visual direction and templates, landing page story and offer, hooks and scripts, shoot-day planning, editing notes, posting rhythm, paid media across Meta, Google, and TikTok, tracking, and iteration.",
    keywords: ["marketing", "brand", "creative", "paid media", "ads", "launch", "rebrand", "growth", "meta", "google", "tiktok"],
  },
  {
    id: "ai",
    title: "AI Desk",
    text:
      "The AI Desk helps teams add intelligence without chaos. LuliDigital builds assistants that answer questions, agents that move tasks forward, and workflows that keep everything organised. Typical outcomes include customer questions answered instantly, internal files and contracts found faster, staff questions answered automatically, leads routed, follow-ups sent, inboxes sorted, tasks created, and reports generated. Humans stay in control: the system drafts, routes, and suggests while people approve, publish, and decide.",
    keywords: ["ai", "assistant", "chatbot", "agent", "automation", "workflow", "inbox", "lead", "customer support", "questions"],
  },
  {
    id: "virtual-assistant",
    title: "Virtual Assistant Desk",
    text:
      "The Virtual Assistant Desk provides structured execution for leaders who carry the weight. Services include admin and operations support, inbox management, calendar control, follow-ups, reports, project management, timelines, milestones, team alignment, deliverable tracking, marketing support, campaign structure, AI assistants, workflow automation, and tailored tools. The positioning is quiet systems, clear follow-through, and leadership support.",
    keywords: ["virtual assistant", "operations", "admin", "calendar", "project management", "leadership", "support", "follow-up"],
  },
  {
    id: "contact",
    title: "Contact Details",
    text:
      "People can contact LuliDigital by email at info@lulidigital.co.za or by WhatsApp at +27 60 255 1513. The fastest reply is usually WhatsApp. The contact page invites people to reach out for campaigns, systems, or something they are building.",
    keywords: ["contact", "email", "whatsapp", "phone", "reach out", "book", "call", "message", "info@lulidigital.co.za", "+27 60 255 1513"],
  },
  {
    id: "fit",
    title: "How LuliDigital Helps",
    text:
      "LuliDigital is a good fit for businesses that need clearer brand positioning, stronger visibility, customer-facing chatbots, AI support systems, calmer operations, better follow-through, or a more reliable source of truth across work. The studio focuses on simplification, clarity, calm systems, and practical execution rather than hype.",
    keywords: ["fit", "who", "for", "business", "help", "clarity", "visibility", "operations", "systems"],
  },
];

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9+@.\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function hasAnyTerm(query: string, terms: string[]) {
  const normalized = query.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

export function getKnowledgeContext(query: string, limit = 4) {
  const terms = tokenize(query);
  const scored = chunks
    .map((chunk) => {
      let score = 0;
      for (const term of terms) {
        if (chunk.text.toLowerCase().includes(term)) score += 1;
        if (chunk.keywords.some((keyword) => keyword.toLowerCase().includes(term))) score += 3;
      }
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((item) => item.score > 0).slice(0, limit).map((item) => item.chunk);
  const selected = top.length > 0 ? top : chunks.slice(0, limit);

  return selected.map((chunk) => `${chunk.title}: ${chunk.text}`).join("\n\n");
}

export function getFallbackReply(query: string) {
  if (hasAnyTerm(query, ["contact", "email", "whatsapp", "phone", "call", "reach"])) {
    return "You can reach LuliDigital on WhatsApp at +27 60 255 1513 or by email at info@lulidigital.co.za. WhatsApp is usually the fastest way to get a reply.";
  }

  if (hasAnyTerm(query, ["marketing", "brand", "ads", "visibility", "rebrand", "launch"])) {
    return "The Marketing Desk helps with brand positioning, creative direction, and paid media. It is best for launches, rebrands, growth sprints, and getting your visibility sharper.";
  }

  if (hasAnyTerm(query, ["ai", "chatbot", "bot", "assistant", "automation", "workflow"])) {
    return "The AI Desk helps with chatbots, AI assistants, and practical workflows that answer questions and move repetitive work in the background. The goal is calmer systems, with humans still in control.";
  }

  if (hasAnyTerm(query, ["virtual assistant", "operations", "admin", "project", "calendar", "inbox"])) {
    return "The Virtual Assistant Desk supports operations, inbox and calendar management, follow-through, and project coordination. It is built for calmer execution and clearer ownership.";
  }

  if (hasAnyTerm(query, ["what do you do", "services", "help with", "what does lulidigital"])) {
    return "LuliDigital works across Marketing, AI, and Virtual Assistant Desk support. The focus is clear positioning, practical systems, and follow-through that helps work move cleanly.";
  }

  return "LuliDigital helps with Marketing, AI systems, and Virtual Assistant Desk support. If you want, ask about a specific area, or contact the desk on WhatsApp at +27 60 255 1513.";
}
