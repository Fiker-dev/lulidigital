const siteUrl = "https://lulidigital.com";

export const regionalAlternates = [
  { hreflang: "en-nl", href: `${siteUrl}/amsterdam` },
  { hreflang: "en-de", href: `${siteUrl}/munich` },
  { hreflang: "en-se", href: `${siteUrl}/stockholm` },
];

const sharedTelephone = "+27602551513";
const openingHours = "Mo-Fr 09:00-18:00";

export const localizedOrganizationSchema = {
  "@type": "Organization",
  "name": "LuliDigital",
  "url": siteUrl,
  "logo": `${siteUrl}/logo.png`,
  "description": "An elite international digital studio specializing in automated marketing campaigns and premium brand asset generation.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Johannesburg",
    "addressCountry": "ZA",
  },
  "areaServed": [
    { "@type": "Country", "name": "Netherlands" },
    { "@type": "Country", "name": "Germany" },
    { "@type": "Country", "name": "Sweden" },
  ],
  "knowsAbout": [
    "Automated Marketing Campaigns",
    "Digital Studio Production",
    "Brand Asset Generation",
  ],
};

export const markets = {
  amsterdam: {
    city: "Amsterdam",
    variant: "amsterdam",
    title: "Next-Gen Digital Studio & Campaign Production in Amsterdam | LuliDigital",
    description:
      "Amsterdam digital agency alternative for tech founders and enterprise marketing teams. Automated digital marketing campaigns, AI-driven production workflows, and premium brand styling.",
    h1: "Next-Gen Digital Studio & Campaign Production in Amsterdam",
    h2: "Scale Your Global Presence from the Netherlands Tech Capital",
    eyebrow: "Amsterdam Digital Agency Alternative",
    positioning:
      "An international digital studio serving Amsterdam's forward-thinking tech ecosystems. We design, code, and launch high-impact global campaigns completely in English.",
    intro:
      "LuliDigital helps tech founders, corporate marketing teams, and enterprise brands turn complex offers into automated digital marketing campaigns with premium brand styling and AI-driven production workflows.",
    primaryCta: "Plan an Amsterdam Campaign",
    secondaryCta: "View Studio Capabilities",
    serviceSchema: {
      name: "Amsterdam Digital Campaign Production Studio",
      serviceType: [
        "automated digital marketing campaigns",
        "AI-driven production workflows",
        "premium brand styling",
        "Amsterdam digital agency alternative",
      ],
      description:
        "Digital campaign production for Amsterdam technology companies, enterprise marketing teams, and global brands that need automated digital marketing campaigns, premium brand styling, and English-first execution.",
      areaServed: { "@type": "City", name: "Amsterdam" },
    },
    localBusinessSchema: {
      name: "LuliDigital Amsterdam",
      logo: `${siteUrl}/favicon.svg`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Amsterdam",
        addressRegion: "North Holland",
        addressCountry: "NL",
      },
      description:
        "International digital studio serving Amsterdam with automated digital marketing campaigns, AI-driven production workflows, premium brand styling, and English-first campaign production.",
    },
    capabilities: [
      {
        label: "Campaign Automation",
        title: "Automated digital marketing campaigns",
        copy: "Launch-ready campaign systems with audience logic, creative variants, reporting loops, and optimization triggers.",
      },
      {
        label: "Production AI",
        title: "AI-driven production workflows",
        copy: "Asset pipelines for ads, landing pages, copy, product visuals, and campaign localization without slowing your team.",
      },
      {
        label: "Brand Styling",
        title: "Premium brand styling",
        copy: "High-end visual systems, conversion pages, sales decks, and campaign interfaces built for international trust.",
      },
      {
        label: "Global Launch",
        title: "English-first execution",
        copy: "Strategy, production, development, and launch management for teams operating beyond the Dutch market.",
      },
    ],
    proofTitle: "Local Case Study Placeholder",
    proofCopy:
      "Amsterdam B2B SaaS launch system: paid campaign architecture, automated lead routing, premium landing page production, and board-ready reporting. Replace this placeholder with the next local client win.",
    reviews: [
      "The studio moved faster than our internal campaign calendar and kept every asset on brand.",
      "English-first production made our European launch cleaner than any local-agency handoff.",
      "Their automation thinking changed how our team briefs, produces, and tests campaign assets.",
    ],
    formTitle: "Let's Scale from Amsterdam",
    formCopy: "Send the campaign target, launch window, and market priority. We will map the production system.",
  },
  munich: {
    city: "Munich",
    variant: "munich",
    title: "Premium Digital Agency & Campaign Studio in Munich | LuliDigital",
    description:
      "Premium Munich campaign studio for B2B enterprises and German tech companies. Corporate digital transformation, automated marketing infrastructure, and performance marketing optimization.",
    h1: "Premium Digital Agency & Campaign Studio in Munich",
    h2: "Modernizing Enterprise Digital Campaigns Across Germany",
    eyebrow: "Munich Enterprise Campaign Studio",
    positioning:
      "A premium international studio bringing global agility to Munich's leading enterprises. Full-scale digital campaign production and optimization, delivered seamlessly in English.",
    intro:
      "We bridge advanced technology with elite digital creative for mid-market B2B enterprises, industrial innovators, and fast-scaling German technology teams.",
    primaryCta: "Build the Enterprise Pipeline",
    secondaryCta: "Review Services",
    serviceSchema: {
      name: "Munich Digital Campaign and Transformation Studio",
      serviceType: [
        "corporate digital transformation",
        "automated marketing infrastructure",
        "high-end brand design Munich",
        "performance marketing optimization",
      ],
      description:
        "Corporate-grade digital campaign production for Munich enterprises, including automated marketing infrastructure, high-end brand design, and performance marketing optimization.",
      areaServed: { "@type": "City", name: "Munich" },
    },
    localBusinessSchema: {
      name: "LuliDigital Munich",
      logo: `${siteUrl}/favicon.svg`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Munich",
        addressRegion: "Bavaria",
        addressCountry: "DE",
      },
      description:
        "Premium international digital studio for Munich enterprises, delivering corporate digital transformation, automated marketing infrastructure, high-end brand design, and performance optimization in English.",
    },
    capabilities: [
      {
        label: "01",
        title: "Corporate digital transformation",
        copy: "Modern campaign systems that connect brand, data, creative production, and revenue operations.",
      },
      {
        label: "02",
        title: "Automated marketing infrastructure",
        copy: "Lead capture, segmentation, nurture flows, reporting architecture, and production governance.",
      },
      {
        label: "03",
        title: "High-end brand design Munich",
        copy: "Premium digital design standards for enterprise pages, executive campaigns, and product launches.",
      },
      {
        label: "04",
        title: "Performance marketing optimization",
        copy: "Testing systems for paid search, paid social, landing pages, messaging, and conversion quality.",
      },
    ],
    proofTitle: "Why English-First Collaboration Wins Globally",
    proofCopy:
      "Munich teams often sell into Europe, North America, and the Middle East. English-first production removes translation drag, reduces regional design friction, and keeps executive, product, and campaign teams aligned around one global standard.",
    reviews: [
      "A disciplined partner for enterprise campaign execution, not another vendor waiting for instructions.",
      "They translated complex industrial value into a premium digital campaign system our board understood.",
      "The English-first workflow helped our German and international teams move with one source of truth.",
    ],
    formTitle: "Capture Enterprise Demand",
    formCopy: "Share your corporate email and campaign priority. We will respond with a production path.",
  },
  stockholm: {
    city: "Stockholm",
    variant: "stockholm",
    title: "Design-Forward Digital Studio & Creative Studio Stockholm | LuliDigital",
    description:
      "Design-forward Stockholm creative studio for Nordic startups and lifestyle brands. Cutting-edge digital asset production, automated brand campaigns, and modern web experiences.",
    h1: "Design-Forward Digital Studio & Creative Studio Stockholm",
    h2: "Advanced Digital Production for Nordic Scale",
    eyebrow: "Stockholm Startup Marketing Partner",
    positioning:
      "A design-first international digital studio for Stockholm's tech elite. Elevating brand storytelling through automated scale and advanced asset generation, engineered in English.",
    intro:
      "We build sharp digital experiences, custom automation systems, cinematic brand assets, and automated brand campaigns for Nordic startups, tech platforms, and lifestyle brands.",
    primaryCta: "Start a Design Sprint",
    secondaryCta: "Explore Asset Systems",
    serviceSchema: {
      name: "Stockholm Design-Forward Digital Production Studio",
      serviceType: [
        "cutting-edge digital asset production",
        "automated brand campaigns",
        "modern web experiences",
        "Stockholm startup marketing partner",
      ],
      description:
        "Design-forward digital production for Stockholm startups and lifestyle brands, including cutting-edge digital asset production, automated brand campaigns, and modern web experiences.",
      areaServed: { "@type": "City", name: "Stockholm" },
    },
    localBusinessSchema: {
      name: "LuliDigital Stockholm",
      logo: `${siteUrl}/favicon.svg`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Stockholm",
        addressRegion: "Stockholm County",
        addressCountry: "SE",
      },
      description:
        "Design-first international digital studio for Stockholm startups, delivering cutting-edge digital asset production, automated brand campaigns, modern web experiences, and advanced asset generation in English.",
    },
    capabilities: [
      {
        label: "Motion",
        title: "Cutting-edge digital asset production",
        copy: "Premium cinematic product visuals, campaign graphics, launch concepts, and image systems built for scale.",
      },
      {
        label: "Systems",
        title: "Automated brand campaigns",
        copy: "Reusable campaign frameworks that preserve taste while multiplying creative output across channels.",
      },
      {
        label: "Web",
        title: "Modern web experiences",
        copy: "Fast, minimalist interfaces with a strong creative point of view and production-grade implementation.",
      },
      {
        label: "Growth",
        title: "Stockholm startup marketing partner",
        copy: "A peer-level studio for founders who need brand execution to keep up with product velocity.",
      },
    ],
    proofTitle: "Elite Client Review Carousel",
    proofCopy:
      "For the next Stockholm client story: show a before-and-after asset system, launch page, automated brand campaign, and investor-facing creative kit.",
    reviews: [
      "Their creative automation gave our launch the visual depth of a much larger brand team.",
      "Minimal, premium, fast. The studio understood the Nordic standard immediately.",
      "The asset generation workflow helped us produce cinematic campaign material without losing taste.",
    ],
    formTitle: "Book a Stockholm Consultation",
    formCopy: "Send your brand, product, or campaign challenge. We will respond with a focused production recommendation.",
  },
};
