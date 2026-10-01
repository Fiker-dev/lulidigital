import { LANA_CONFIG, PROMPTS, SERVICE_ROUTES } from "./config.js";

export function chooseProactivePrompt(state, now = Date.now(), config = LANA_CONFIG) {
  if (state.disabled || state.pageVisible === false || state.lanaResponded || state.chatOpen || state.formActive || state.modalOpen || state.rapidScrolling) return null;
  if (now - state.startedAt < config.initialSilenceMs) return null;
  if ((state.promptsShown || 0) >= config.maxPrompts || now < (state.dismissedUntil || 0)) return null;
  if (state.lastPromptAt && now - state.lastPromptAt < config.promptCooldownMs) return null;
  const shown = new Set(state.shownPromptIds || []);
  const serviceCount = new Set((state.pages || []).filter((page) => SERVICE_ROUTES[page])).size;
  const candidates = [];
  if (state.pricingAttention) candidates.push(PROMPTS.pricing);
  if (serviceCount >= 2) candidates.push(PROMPTS.multiService);
  if (state.returningVisitor) candidates.push(PROMPTS.returning);
  if (SERVICE_ROUTES[state.currentPage] && state.currentSectionDwellMs >= config.sectionAttentionMs) candidates.push(PROMPTS.service);
  if (state.currentSectionDwellMs >= config.sectionAttentionMs) candidates.push(PROMPTS.general);
  return candidates.find((prompt) => !shown.has(prompt.id)) || null;
}
