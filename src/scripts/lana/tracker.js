import { LANA_CONFIG } from "./config.js";
import { formatLanaContext } from "./context.js";
import { chooseProactivePrompt } from "./triggers.js";

const freshState = () => ({ version: 1, startedAt: Date.now(), pages: [], sections: {}, events: [], promptsShown: 0, shownPromptIds: [], lastPromptAt: 0, dismissedUntil: 0, lanaOpened: false, lanaResponded: false, contactCtaClicked: false, pricingViewed: false, pricingAttention: false });

export function initLanaIntelligence() {
  if (window.__lanaIntelligence) return window.__lanaIntelligence;
  const disabled = window.LULI_LANA_TRACKING_DISABLED === true || document.documentElement.dataset.lanaTracking === "off";
  let state = freshState();
  try { state = { ...state, ...JSON.parse(sessionStorage.getItem(LANA_CONFIG.sessionKey) || "{}") }; } catch {}
  state.disabled = disabled;
  state.currentPage = location.pathname.replace(/\/+$/, "") || "/";
  state.pageEnteredAt = Date.now();
  state.pageVisible = document.visibilityState !== "hidden";
  state.pageVisibleMs = 0;
  state.lastVisibleAt = Date.now();
  state.pageVisits = state.pageVisits || {};
  state.pageVisits[state.currentPage] = (state.pageVisits[state.currentPage] || 0) + 1;
  if (!state.pages.includes(state.currentPage)) state.pages.push(state.currentPage);
  try {
    const prior = JSON.parse(localStorage.getItem(LANA_CONFIG.returnKey) || "null");
    state.returningVisitor = Boolean(prior?.lastVisit && Date.now() - prior.lastVisit > 30 * 60_000);
    localStorage.setItem(LANA_CONFIG.returnKey, JSON.stringify({ lastVisit: Date.now() }));
  } catch {}

  let activeSection = null;
  let sectionStartedAt = Date.now();
  let lastDwellUpdate = Date.now();
  let lastScrollAt = 0;
  let sectionRaf = 0;
  let promptTimer;
  const save = () => { if (!state.disabled) try { sessionStorage.setItem(LANA_CONFIG.sessionKey, JSON.stringify(state)); } catch {} };
  const log = (type, detail = {}) => {
    state.events.push({ type, at: Date.now(), ...detail });
    state.events = state.events.slice(-LANA_CONFIG.maxEvents);
    save();
  };
  const sectionKey = (el, index) => el.dataset.lanaSection || el.id || `${state.currentPage}:section-${index + 1}`;
  const updateDwell = () => {
    const now = Date.now();
    if (!state.pageVisible) { lastDwellUpdate = now; return; }
    if (activeSection && state.sections[activeSection]) state.sections[activeSection].totalMs = (state.sections[activeSection].totalMs || 0) + now - lastDwellUpdate;
    lastDwellUpdate = now;
    state.currentSectionDwellMs = activeSection ? now - sectionStartedAt : 0;
    if (/pricing/i.test(state.currentSection || "")) {
      state.pricingViewed = true;
      if (state.currentSectionDwellMs >= LANA_CONFIG.pricingAttentionMs) state.pricingAttention = true;
    }
  };
  const setActiveSection = (next) => {
    if (!next || next === activeSection) return;
    updateDwell();
    activeSection = next; sectionStartedAt = Date.now(); state.currentSection = next;
    const record = state.sections[next] || { views: 0, totalMs: 0, lastViewedAt: 0 };
    if (!record.lastViewedAt || Date.now() - record.lastViewedAt > 10_000) record.views += 1;
    record.lastViewedAt = Date.now(); state.sections[next] = record;
    log("section_view", { section: next, views: record.views });
  };
  const safeguards = () => {
    state.formActive = Boolean(document.querySelector("form:focus-within"));
    state.modalOpen = [...document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]')].some((el) => el.id !== "lana-panel" && el.getAttribute("aria-hidden") !== "true");
    state.rapidScrolling = Date.now() - lastScrollAt < 700;
  };
  const evaluate = () => {
    updateDwell(); safeguards();
    const prompt = chooseProactivePrompt(state);
    if (prompt) {
      state.promptsShown += 1; state.lastPromptAt = Date.now(); state.shownPromptIds.push(prompt.id);
      log("proactive_prompt", { promptId: prompt.id });
      window.dispatchEvent(new CustomEvent("luli:lana-proactive", { detail: prompt }));
    }
    save();
    promptTimer = window.setTimeout(evaluate, 2_000);
  };

  const sections = [...document.querySelectorAll("main [data-lana-section], main section")];
  const refreshActiveSection = () => {
    sectionRaf = 0;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const visible = sections.map((section, index) => {
      const rect = section.getBoundingClientRect();
      const pixels = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
      return { section, index, pixels };
    }).filter((item) => item.pixels > 0).sort((a, b) => b.pixels - a.pixels)[0];
    if (visible) setActiveSection(sectionKey(visible.section, visible.index));
  };
  const scheduleSectionRefresh = () => {
    if (!sectionRaf) sectionRaf = window.requestAnimationFrame(refreshActiveSection);
  };
  const observer = "IntersectionObserver" in window ? new IntersectionObserver(scheduleSectionRefresh, { threshold: [0, 0.25, 0.5] }) : null;
  sections.forEach((section) => observer?.observe(section));
  scheduleSectionRefresh();

  window.addEventListener("scroll", () => { lastScrollAt = Date.now(); scheduleSectionRefresh(); }, { passive: true });
  window.addEventListener("resize", scheduleSectionRefresh, { passive: true });
  document.addEventListener("visibilitychange", () => {
    const now = Date.now();
    if (document.visibilityState === "hidden") {
      updateDwell();
      state.pageVisibleMs += now - state.lastVisibleAt;
      state.pageVisible = false;
    } else {
      state.pageVisible = true;
      state.lastVisibleAt = now;
      lastDwellUpdate = now;
      sectionStartedAt = now;
      scheduleSectionRefresh();
    }
    save();
  });
  window.addEventListener("luli:lana-open", () => { state.chatOpen = true; state.lanaOpened = true; log("lana_opened"); });
  window.addEventListener("luli:lana-close", () => { state.chatOpen = false; save(); });
  window.addEventListener("luli:lana-replied", () => { state.lanaResponded = true; log("lana_replied"); });
  window.addEventListener("luli:lana-lead-captured", () => { state.leadCaptured = true; log("lead_captured"); });
  window.addEventListener("luli:lana-prompt-dismiss", () => { state.dismissedUntil = Date.now() + LANA_CONFIG.dismissalCooldownMs; log("prompt_dismissed"); });
  document.addEventListener("click", (event) => {
    const target = event.target.closest?.('[data-lana-cta], a[href*="/contact"], a[href^="mailto:"], a[href*="wa.me"]');
    if (target) { state.contactCtaClicked = true; log("contact_cta", { href: target.getAttribute("href") || "" }); }
  });
  log("page_view", { page: state.currentPage });
  promptTimer = window.setTimeout(evaluate, 2_000);
  const api = {
    getContext: () => formatLanaContext(state),
    getState: () => structuredClone(state),
    markResponded: () => window.dispatchEvent(new CustomEvent("luli:lana-replied")),
    disable: () => { state.disabled = true; clearTimeout(promptTimer); sessionStorage.removeItem(LANA_CONFIG.sessionKey); },
  };
  window.__lanaIntelligence = api;
  if (import.meta.env.DEV) {
    window.__lanaDebug = api;
    if (new URLSearchParams(location.search).has("lanaDebug")) mountDebugPanel(api);
  }
  return api;
}

function mountDebugPanel(api) {
  const panel = document.createElement("details");
  panel.className = "lana-context-debug";
  panel.innerHTML = '<summary>Lana context</summary><pre></pre><button type="button">Clear test session</button>';
  const output = panel.querySelector("pre");
  const render = () => { output.textContent = JSON.stringify(api.getContext(), null, 2); };
  panel.querySelector("button").addEventListener("click", () => {
    sessionStorage.removeItem(LANA_CONFIG.sessionKey);
    sessionStorage.removeItem(LANA_CONFIG.historyKey);
    location.reload();
  });
  const style = document.createElement("style");
  style.textContent = `.lana-context-debug{position:fixed;left:12px;bottom:12px;z-index:230;width:min(320px,calc(100vw - 24px));padding:10px 12px;border:1px solid rgba(255,255,255,.2);border-radius:12px;background:#17130d;color:#fff;font:12px/1.45 ui-monospace,monospace;box-shadow:0 12px 32px rgba(0,0,0,.28)}.lana-context-debug summary{cursor:pointer;font-weight:700}.lana-context-debug pre{max-height:42vh;overflow:auto;white-space:pre-wrap}.lana-context-debug button{min-height:36px;border:1px solid rgba(255,255,255,.25);border-radius:8px;background:transparent;color:#fff;cursor:pointer}`;
  document.head.appendChild(style); document.body.appendChild(panel);
  render(); window.setInterval(render, 1_000);
}
