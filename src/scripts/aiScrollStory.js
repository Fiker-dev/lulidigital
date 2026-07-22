import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let storyContext;

export function initAiScrollStory() {
  const story = document.querySelector("[data-ai-scroll-story]");
  if (!(story instanceof HTMLElement) || story.dataset.scrollStoryReady === "true") return;

  story.dataset.scrollStoryReady = "true";
  const steps = gsap.utils.toArray("[data-ai-story-step]", story);
  const states = gsap.utils.toArray("[data-ai-story-state]", story);
  const progress = story.querySelector("[data-ai-story-progress]");
  const pin = story.querySelector(".ai-story__pin");
  const visual = story.querySelector(".ai-story__visual");

  if (!steps.length || !states.length || !progress || !pin || !visual) return;

  storyContext = gsap.matchMedia();
  storyContext.add(
    {
      desktop: "(min-width: 901px)",
      motion: "(prefers-reduced-motion: no-preference)",
    },
    (context) => {
      if (!context.conditions?.desktop || !context.conditions?.motion) return;

      story.classList.add("is-scroll-enhanced");
      gsap.set(steps, { opacity: 0.34, y: 14 });
      gsap.set(steps[0], { opacity: 1, y: 0 });
      gsap.set(states, { autoAlpha: 0, y: 8 });
      gsap.set(states[0], { autoAlpha: 1, y: 0 });
      gsap.set(progress, { scaleY: 0, transformOrigin: "top" });

      const updateCurrentStage = (self) => {
        const index = Math.min(steps.length - 1, Math.round(self.progress * (steps.length - 1)));
        steps.forEach((step, stepIndex) => step.classList.toggle("is-current", stepIndex === index));
        states.forEach((state, stateIndex) => state.classList.toggle("is-current", stateIndex === index));
      };

      const timeline = gsap.timeline({
        defaults: { duration: 0.45, ease: "power3.out" },
        scrollTrigger: {
          id: "ai-workflow-story",
          trigger: pin,
          start: "top 82px",
          end: () => `+=${Math.max(window.innerHeight * 3.2, 2200)}`,
          pin,
          pinSpacing: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: updateCurrentStage,
          onRefresh: updateCurrentStage,
        },
      });

      steps.forEach((step, index) => {
        const previousStep = steps[index - 1];
        const previousState = states[index - 1];
        const state = states[index];
        const position = index;

        timeline.addLabel(`stage-${index + 1}`, position);
        if (index === 0) return;

        timeline
          .to(previousStep, { opacity: 0.34, y: -8 }, position)
          .to(step, { opacity: 1, y: 0 }, position)
          .to(previousState, { autoAlpha: 0, y: -8 }, position)
          .to(state, { autoAlpha: 1, y: 0 }, position)
          .to(progress, { scaleY: index / (steps.length - 1), ease: "none" }, position);
      });

      const refreshAfterFonts = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(refreshAfterFonts);
      window.addEventListener("load", refreshAfterFonts, { once: true });

      return () => {
        window.removeEventListener("load", refreshAfterFonts);
        story.classList.remove("is-scroll-enhanced");
      };
    },
  );

  storyContext.add(
    {
      mobile: "(max-width: 900px)",
      motion: "(prefers-reduced-motion: no-preference)",
    },
    (context) => {
      if (!context.conditions?.mobile || !context.conditions?.motion) return;

      story.classList.add("is-mobile-enhanced");
      gsap.set(states, { autoAlpha: 0, y: 8 });
      gsap.set(states[0], { autoAlpha: 1, y: 0 });
      gsap.set(progress, { scaleY: 0, transformOrigin: "top" });

      ScrollTrigger.create({
        id: "ai-workflow-mobile-pin",
        trigger: pin,
        start: "top 66px",
        endTrigger: steps[steps.length - 1],
        end: "bottom 68%",
        pin: visual,
        pinSpacing: false,
        anticipatePin: 1,
      });

      const setMobileStage = (index) => {
        steps.forEach((step, stepIndex) => step.classList.toggle("is-current", stepIndex === index));
        states.forEach((state, stateIndex) => {
          state.classList.toggle("is-current", stateIndex === index);
          gsap.to(state, {
            autoAlpha: stateIndex === index ? 1 : 0,
            y: stateIndex === index ? 0 : -6,
            duration: 0.28,
            ease: "power3.out",
            overwrite: true,
          });
        });
        gsap.to(progress, {
          scaleY: index / (steps.length - 1),
          duration: 0.35,
          ease: "power2.out",
          overwrite: true,
        });
      };

      steps.forEach((step, index) => {
        ScrollTrigger.create({
          id: `ai-workflow-mobile-${index + 1}`,
          trigger: step,
          start: "top 68%",
          end: "bottom 32%",
          onEnter: () => setMobileStage(index),
          onEnterBack: () => setMobileStage(index),
        });

        gsap.fromTo(
          step,
          { y: 22, opacity: 0.56 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            scrollTrigger: {
              trigger: step,
              start: "top 84%",
              once: true,
            },
          },
        );
      });

      return () => {
        story.classList.remove("is-mobile-enhanced");
      };
    },
  );
}

export function destroyAiScrollStory() {
  storyContext?.revert();
  storyContext = undefined;
}
