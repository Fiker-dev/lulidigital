import { SERVICE_ROUTES } from "./config.js";
import { calculateLeadScore, getEngagementLevel } from "./scoring.js";

export function formatLanaContext(state) {
  const leadScore = calculateLeadScore(state);
  return {
    currentPage: state.currentPage || "/",
    currentSection: state.currentSection || "",
    previousPages: (state.pages || []).filter((page) => page !== state.currentPage).slice(-4),
    servicesViewed: [...new Set((state.pages || []).map((page) => SERVICE_ROUTES[page]).filter(Boolean))],
    returningVisitor: Boolean(state.returningVisitor),
    timeOnPageSeconds: Math.max(0, Math.round(((state.pageVisibleMs || 0) + (state.pageVisible === false ? 0 : Date.now() - (state.lastVisibleAt || Date.now()))) / 1000)),
    leadScore,
    engagementLevel: getEngagementLevel(leadScore),
  };
}
