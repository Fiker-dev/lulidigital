// Genuinely unique, grounded per-market context so each localized landing page
// is distinct content (not token-swapped boilerplate) — this is what gets the
// geo pages indexed instead of deduplicated by Google. No fabricated clients,
// results, or stats: each block describes real, well-known market characteristics
// and how LuliDigital's remote, English-first model applies.

export interface MarketLocalContext {
  heading: string;
  body: string[];
  points: string[];
}

export const localContextByVariant: Record<string, MarketLocalContext> = {
  ireland: {
    heading: "Built for Ireland's English-first, EU-connected tech economy",
    body: [
      "Ireland holds a rare position: an English-speaking country inside the EU, and the European base for many of the world's largest technology companies. That makes Dublin and the wider Irish market unusually competitive for talent, attention, and search visibility — founders here are often selling into the US, the UK, and the EU at the same time.",
      "A remote, English-first studio fits that reality. We help Irish founders run paid media and SEO that hold up across several English-language markets at once, automate the operational load that comes with cross-border growth, and add executive assistant cover that spans US and EU working hours without a local hire.",
    ],
    points: [
      "Marketing built to rank and convert across Irish, UK, and US English search together",
      "AI automation for cross-border admin: invoicing, lead routing, multi-timezone scheduling",
      "Executive VA cover that bridges Dublin, London, and US East Coast hours",
    ],
  },
  amsterdam: {
    heading: "Made for Amsterdam's international, English-fluent scale-up scene",
    body: [
      "The Netherlands runs on near-universal English, a dense scale-up ecosystem, and a direct, pragmatic business culture. Amsterdam founders tend to think internationally from day one, which means their marketing and operations have to work across borders early.",
      "We build for that. Performance marketing and SEO tuned for international English audiences, AI workflows that remove the repetitive drag of scaling, and executive assistant support that keeps a fast-moving Dutch team's calendar, inbox, and coordination clean.",
    ],
    points: [
      "Cross-border paid media and SEO for teams selling beyond the Netherlands",
      "AI automation for lean scale-up operations, no extra headcount required",
      "Executive VA support tuned to a direct, fast Dutch working style",
    ],
  },
  munich: {
    heading: "Engineered for Munich's precision-driven B2B economy",
    body: [
      "Munich and the wider German market are defined by engineering, B2B, and the Mittelstand — businesses that value process, precision, and data discipline over hype. Sales cycles run longer, data-protection expectations are strict, and trust is earned through consistency.",
      "Our approach suits that. Considered, well-documented marketing systems rather than noise; AI automation that respects how data is handled and removes manual process bottlenecks; and executive assistant support that brings order to complex, multi-stakeholder operations.",
    ],
    points: [
      "B2B-grade marketing and SEO built for longer, considered buying cycles",
      "GDPR-conscious AI automation for process-heavy operations",
      "Executive VA support for structured, multi-stakeholder coordination",
    ],
  },
  stockholm: {
    heading: "Tuned for Stockholm's design-led, high-output tech culture",
    body: [
      "Sweden produces an outsized number of globally successful tech companies for its size, with a design-led, mobile-first, consensus-driven culture and near-native English. Stockholm teams expect things to look sharp, work cleanly, and scale internationally fast.",
      "We match that standard. Brand-grade creative and performance marketing built for international reach, AI automation that keeps a lean team moving at speed, and executive assistant support that handles the operational detail so the team stays on product and growth.",
    ],
    points: [
      "Design-led brand and performance marketing for international launches",
      "AI automation that lets small Swedish teams punch above their size",
      "Executive VA support for high-output, low-overhead teams",
    ],
  },
  denmark: {
    heading: "For Denmark's design-conscious, high-trust SMB market",
    body: [
      "Danish business culture is flat, pragmatic, and high-trust, with a strong design sensibility and high digital adoption. Companies here tend to be lean, and they value clarity and sustainability over flash.",
      "We work the same way: clean, honest marketing that converts without gimmicks, AI automation that quietly removes admin load, and executive assistant support that respects a flat, autonomous working style.",
    ],
    points: [
      "Clear, design-conscious marketing and SEO that converts",
      "AI automation for lean teams that dislike unnecessary overhead",
      "Executive VA support that fits a flat, autonomous culture",
    ],
  },
  norway: {
    heading: "Built for Norway's high-cost, high-efficiency market",
    body: [
      "Norway combines high labour costs with excellent digital infrastructure and strong English fluency. That makes automation and well-run remote support especially valuable — every hour of manual work is expensive, and the appetite for efficient digital systems is high.",
      "That is exactly where we help. AI automation that replaces costly manual work, marketing systems that run efficiently without a large in-house team, and executive assistant support that gives Norwegian founders senior-level help without a senior-level local salary.",
    ],
    points: [
      "AI automation that offsets one of Europe's highest labour costs",
      "Efficient marketing and SEO without a large in-house team",
      "Executive VA support at a fraction of a local hire",
    ],
  },
  switzerland: {
    heading: "For Switzerland's premium, discretion-first business culture",
    body: [
      "Switzerland's economy leans on finance, pharma, and precision industries, with a multilingual market and a strong expectation of quality, discretion, and reliability. Swiss buyers value trust and polish over speed and noise.",
      "We build to that standard: premium, carefully positioned marketing; AI automation handled with care around sensitive data; and executive assistant support that is reliable, discreet, and detail-perfect.",
    ],
    points: [
      "Premium, precisely positioned marketing and brand work",
      "Discreet, data-careful AI automation",
      "Reliable, detail-perfect executive VA support",
    ],
  },
  belgium: {
    heading: "For Belgium's multilingual, EU-centred business hub",
    body: [
      "Belgium sits at the centre of the EU, with Brussels home to its institutions, a multilingual market across Dutch and French, and a strong B2B and international-services economy. Businesses here operate across languages and borders by default.",
      "We help teams handle that complexity: marketing and SEO built for multilingual, cross-border audiences, AI automation that streamlines admin across languages and entities, and executive assistant support that keeps internationally-facing operations coordinated.",
    ],
    points: [
      "Marketing and SEO for multilingual, cross-border EU audiences",
      "AI automation across languages, entities, and time zones",
      "Executive VA support for internationally-facing teams",
    ],
  },
  "united-kingdom": {
    heading: "For the UK's fast, competitive, post-Brexit digital market",
    body: [
      "The UK is one of the largest and most competitive digital markets in the world, with a mature advertising landscape, high customer expectations, and post-Brexit considerations for teams trading with the EU. Standing out takes sharp execution, not just spend.",
      "We focus on that edge: performance marketing and SEO built to compete in crowded UK search and social, AI automation that removes operational drag as you scale, and executive assistant support that keeps a fast-moving UK team's operations tight.",
    ],
    points: [
      "Performance marketing and SEO built for a crowded, mature UK market",
      "AI automation for teams scaling across the UK and into the EU",
      "Executive VA support for fast-moving founders and leadership",
    ],
  },
  "united-states": {
    heading: "Built for the speed and scale of the US market",
    body: [
      "The US market rewards speed, scale, and performance, and punishes anything slow or generic. Ad costs are high, competition is relentless, and teams operate across multiple time zones. Founders here need systems that move fast and compound.",
      "We build for that pace: performance marketing and SEO engineered for competitive US search and social, AI automation that lets lean teams operate like much larger ones, and executive assistant support that covers the long, multi-timezone American working day.",
    ],
    points: [
      "Performance marketing and SEO engineered for high-cost, high-competition US channels",
      "AI automation that helps lean teams operate at US scale",
      "Executive VA cover across multiple US time zones",
    ],
  },
  africa: {
    heading: "Supporting ambitious African founders building across borders",
    body: [
      "Africa's growth markets are mobile-first, fast-moving, and increasingly cross-border, with founders often building for several countries — and international customers — at once.",
      "We support that ambition with remote-first marketing, AI automation, and executive assistant services that work wherever the team and customers are, without the overhead of local infrastructure.",
    ],
    points: [
      "Mobile-first, cross-border marketing and SEO",
      "AI automation for lean teams operating across multiple markets",
      "Remote executive VA support without local overhead",
    ],
  },
};
