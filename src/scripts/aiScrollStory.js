import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let storyContext;

export function initAiScrollStory() {
  const story = document.querySelector("[data-ai-scroll-story]");
  if (!(story instanceof HTMLElement) || story.dataset.scrollStoryReady === "true") return;

  story.dataset.scrollStoryReady = "true";
  const nodes = gsap.utils.toArray(".how-node", story);
  const arrows = gsap.utils.toArray(".how-arrow", story);

  if (!nodes.length) return;

  storyContext = gsap.matchMedia();
  storyContext.add(
    {
      motion: "(prefers-reduced-motion: no-preference)",
    },
    (context) => {
      if (!context.conditions?.motion) return;

      story.classList.add("is-scroll-enhanced");
      gsap.set(nodes, { opacity: 0.62, y: 18 });
      gsap.set(arrows, { opacity: 0.28, scale: 0.82 });

      const timeline = gsap.timeline({
        defaults: { duration: 0.7, ease: "power3.out" },
        scrollTrigger: {
          id: "ai-workflow-story",
          trigger: story,
          start: "top 82%",
          end: "bottom 38%",
          scrub: 0.45,
        },
      });

      nodes.forEach((node, index) => {
        timeline.to(node, { opacity: 1, y: 0 }, index * 0.55);
        if (arrows[index]) {
          timeline.to(arrows[index], { opacity: 1, scale: 1 }, index * 0.55 + 0.22);
        }
      });

      return () => {
        story.classList.remove("is-scroll-enhanced");
      };
    },
  );
}

export function destroyAiScrollStory() {
  storyContext?.revert();
  storyContext = undefined;
}
