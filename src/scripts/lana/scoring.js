import { LANA_CONFIG, SERVICE_ROUTES } from "./config.js";

export function calculateLeadScore(state, config = LANA_CONFIG) {
  const serviceCount = new Set((state.pages || []).filter((page) => SERVICE_ROUTES[page])).size;
  const returns = Object.values(state.sections || {}).filter((section) => (section.views || 0) > 1).length;
  let score = serviceCount * config.scores.servicePage;
  if (serviceCount >= 2) score += config.scores.twoServices;
  if (state.pricingViewed) score += config.scores.pricing;
  if (state.pricingAttention) score += config.scores.pricingAttention;
  score += Math.min(1, returns) * config.scores.sectionReturn;
  if (Object.values(state.pageVisits || {}).some((visits) => visits > 1)) score += config.scores.pageReturn;
  if (state.lanaOpened) score += config.scores.lanaOpen;
  if (state.lanaResponded) score += config.scores.lanaReply;
  if (state.contactCtaClicked) score += config.scores.contactCta;
  if (state.leadCaptured) score += config.scores.leadCaptured;
  return Math.min(100, score);
}

export function getEngagementLevel(score) {
  if (score >= 75) return "strong_intent";
  if (score >= 50) return "high_interest";
  if (score >= 25) return "interested";
  return "browsing";
}
