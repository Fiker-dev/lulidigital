export const LANA_CONFIG = Object.freeze({
  version: 1,
  sessionKey: "luli:lana-session:v1",
  historyKey: "luli:lana-history:v1",
  returnKey: "luli:lana-return:v1",
  initialSilenceMs: 40_000,
  sectionAttentionMs: 30_000,
  pricingAttentionMs: 20_000,
  promptCooldownMs: 120_000,
  dismissalCooldownMs: 300_000,
  maxPrompts: 2,
  maxEvents: 80,
  scores: Object.freeze({ servicePage: 8, twoServices: 10, pricing: 18, pricingAttention: 8, sectionReturn: 5, pageReturn: 4, lanaOpen: 5, lanaReply: 15, contactCta: 15, leadCaptured: 25 }),
});

export const SERVICE_ROUTES = Object.freeze({
  "/ai-desk": "AI Desk",
  "/marketing-desk": "Marketing Desk",
  "/va-desk": "Virtual Assistant Desk",
  "/web-design-desk": "Web Design Desk",
});

export const PROMPTS = Object.freeze({
  pricing: { id: "pricing-help", message: "Want help working out which service fits your scope?" },
  multiService: { id: "service-compare", message: "Comparing a few options? I can help you narrow down the right desk." },
  returning: { id: "returning-visitor", message: "Welcome back. Want to pick up where you left off?" },
  service: { id: "service-help", message: "Have a question about this service? I’m here to help." },
  general: { id: "general-help", message: "Curious about LuliDigital? Ask me anything." },
});
