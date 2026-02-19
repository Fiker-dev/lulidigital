export function initInkHighlights() {
  const items = Array.from(document.querySelectorAll(".ink-hl"));
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-on"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const el = entry.target;
        const delay = Number(el.getAttribute("data-delay") || 0);
        window.setTimeout(() => {
          el.classList.add("is-on");
        }, Number.isFinite(delay) ? delay : 0);

        observer.unobserve(el);
      }
    },
    { threshold: 0.35, rootMargin: "0px 0px -15% 0px" }
  );

  items.forEach((el) => observer.observe(el));
}
