export type LanaKnowledgeChunk = {
  id: string;
  title: string;
  text: string;
};

const chunks: LanaKnowledgeChunk[] = [
  {
    id: "about",
    title: "About LuliDigital",
    text: "LuliDigital is a studio that works like an editorial floor — clarifying the story, pressure-testing it in market, and building systems teams can rely on. The business covers three desks: Marketing, AI, and Virtual Assistant. The tone is human, calm, clear, practical, and supportive. The studio was founded by Fikerte Zabate (Fiker), who leads the team and takes discovery calls with potential clients personally.",
  },
  {
    id: "marketing",
    title: "Marketing Desk",
    text: "The Marketing Desk shapes brand voice, designs creative direction, and runs paid media with disciplined execution. Best for launches, rebrands, and growth sprints. Typical work includes positioning and messaging, visual direction and templates, landing page story and offer, hooks and scripts, shoot-day planning, editing notes, posting rhythm, paid media across Meta, Google, and TikTok, tracking, and iteration. Cadence includes weekly reporting and monthly iteration.",
  },
  {
    id: "ai",
    title: "AI Desk",
    text: "The AI Desk helps teams add intelligence without chaos. LuliDigital builds assistants that answer questions, agents that move tasks forward, and workflows that keep everything organised. Typical outcomes include customer questions answered instantly, internal files found faster, staff questions answered automatically, leads routed, follow-ups sent, inboxes sorted, tasks created, and reports generated. Humans stay in control: the system drafts, routes, and suggests while people approve, publish, and decide.",
  },
  {
    id: "virtual-assistant",
    title: "Virtual Assistant Desk",
    text: "The Virtual Assistant Desk provides structured execution for leaders who carry too much. Services include admin and operations support, inbox management, calendar control, follow-ups, reports, project management, timelines, milestones, team alignment, deliverable tracking, marketing support, campaign structure, AI assistant setup, and workflow automation. The positioning is quiet systems, clear follow-through, and leadership support.",
  },
  {
    id: "how-we-work",
    title: "How LuliDigital Works",
    text: "LuliDigital blends human expertise with AI — the studio calls this 'human and AI agents working together.' AI drafts, routes, and suggests. Humans approve, publish, and decide. This gives clients high output quality without losing the strategic judgment that matters. Clients get the responsiveness of an AI system with the thinking of an experienced team. Engagements are custom-scoped — no fixed packages, pricing is tailored to the scope after a discovery call.",
  },
  {
    id: "countries",
    title: "Countries and Markets",
    text: "LuliDigital operates across Europe, the UK, the US, and Africa. Active markets include the Netherlands, Germany, Sweden, United Kingdom, United States, Denmark, Switzerland, Ireland, Belgium, Norway, and Africa. The studio is headquartered in South Africa (Johannesburg) and works with businesses in these regions remotely. If a client is in one of these markets, that context helps shape the right approach.",
  },
  {
    id: "fit",
    title: "Who LuliDigital Helps",
    text: "LuliDigital is a good fit for businesses that need clearer brand positioning, stronger visibility, customer-facing AI assistants, automation that actually works, calmer operations, better follow-through, or more reliable execution. Typical clients are founders, operators, and marketing leads at scaling businesses who want a studio that thinks and executes, not just delivers files.",
  },
  {
    id: "contact",
    title: "Contact and Booking",
    text: "To move forward, Lana collects the potential client's name and email and passes it to Fiker. Fiker responds within one business day to arrange a call. Email for the studio is info@lulidigital.com. WhatsApp is +27 60 255 1513. The fastest way to start is through a conversation with Lana — she qualifies the need and gets the right people connected.",
  },
];

export function getAllKnowledge(): string {
  return chunks.map((c) => `${c.title}: ${c.text}`).join("\n\n");
}

export function getFallbackReply(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("contact") || q.includes("email") || q.includes("whatsapp"))
    return "You can reach LuliDigital on WhatsApp at +27 60 255 1513 or email info@lulidigital.com. WhatsApp is fastest.";
  if (q.includes("marketing") || q.includes("brand") || q.includes("ads"))
    return "The Marketing Desk handles brand positioning, creative direction, and paid media. Good for launches, rebrands, and growth.";
  if (q.includes("ai") || q.includes("chatbot") || q.includes("automation"))
    return "The AI Desk builds assistants, agents, and workflows that keep things moving while humans stay in control of decisions.";
  if (q.includes("virtual assistant") || q.includes("operations") || q.includes("admin"))
    return "The VA Desk handles operations, inbox, calendar, project management, and follow-through for leaders who need reliable backup.";
  return "LuliDigital works across Marketing, AI, and Virtual Assistant Desk support. Tell me a bit about your business and I can point you in the right direction.";
}
