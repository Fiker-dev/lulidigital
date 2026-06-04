const siteUrl = "https://lulidigital.com";

export const regionalAlternates = [
  { hreflang: "en-za", href: `${siteUrl}/south-africa` },
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
  "description": "LuliDigital is an international digital studio offering performance marketing, AI workflow automation, conversational AI assistants, and executive virtual assistant services for founders and businesses across Europe and beyond.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Johannesburg",
    "addressCountry": "ZA",
  },
  "areaServed": [
    { "@type": "Country", "name": "South Africa" },
    { "@type": "Country", "name": "Netherlands" },
    { "@type": "Country", "name": "Germany" },
    { "@type": "Country", "name": "Sweden" },
    { "@type": "Country", "name": "United Kingdom" },
    { "@type": "Country", "name": "United Arab Emirates" },
    { "@type": "Country", "name": "Australia" },
    { "@type": "Country", "name": "Canada" },
  ],
  "knowsAbout": [
    "Digital Marketing",
    "Performance Marketing",
    "Brand Strategy",
    "Paid Media Management",
    "SEO Services",
    "Content Marketing",
    "AI Workflow Automation",
    "Conversational AI Assistants",
    "AI Agent Implementation",
    "Business Process Automation",
    "Executive Virtual Assistant Services",
    "Remote Executive Assistant",
    "Inbox and Calendar Management",
    "Project Management",
  ],
};

export const markets = {
  southAfrica: {
    city: "South Africa",
    variant: "south-africa",
    title: "South Africa Digital Marketing Agency, AI Automation & Virtual Assistant Services | LuliDigital",
    description:
      "LuliDigital helps South African founders and growing teams with digital marketing, AI automation, SEO, paid media, and executive virtual assistant services.",
    h1: "South Africa digital marketing agency. AI automation. Virtual assistant services.",
    h2: "For South African founders, service businesses, startups, and growing teams.",
    eyebrow: "South Africa Digital Marketing Agency",
    positioning:
      "A Johannesburg-led digital studio helping South African businesses get found, look credible, and run cleaner systems across marketing, AI automation, and executive operations.",
    intro:
      "LuliDigital helps South African founders and growing teams with paid media, SEO, brand strategy, AI workflow automation, conversational AI assistants, and executive virtual assistant services from one focused desk.",
    primaryCta: "Start a South Africa Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "South Africa Digital Marketing Agency — AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency South Africa",
        "digital marketing agency Johannesburg",
        "performance marketing South Africa",
        "paid media management South Africa",
        "brand strategy South Africa",
        "SEO services South Africa",
        "AI automation South Africa",
        "AI workflow automation South Africa",
        "conversational AI assistant South Africa",
        "virtual assistant services South Africa",
        "remote executive assistant South Africa",
      ],
      description:
        "South Africa digital marketing agency offering performance marketing, SEO, paid media, brand strategy, AI workflow automation, conversational AI assistants, and executive virtual assistant services.",
      areaServed: { "@type": "Country", name: "South Africa" },
    },
    localBusinessSchema: {
      name: "LuliDigital South Africa",
      logo: `${siteUrl}/favicon.svg`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Johannesburg",
        addressCountry: "ZA",
      },
      description:
        "South Africa digital marketing agency for founders and growing teams: performance marketing, SEO, AI automation, and executive virtual assistant services.",
    },
    capabilities: [
      {
        label: "Marketing",
        title: "Digital marketing that makes the business searchable",
        copy: "SEO, paid media, campaign planning, and brand positioning built for South African businesses that need visibility without wasting spend.",
      },
      {
        label: "AI Automation",
        title: "AI systems for lean teams",
        copy: "AI assistants, workflow automation, and internal tools that answer questions, route work, and reduce repetitive admin.",
      },
      {
        label: "Brand & Web",
        title: "Credible brand and landing page systems",
        copy: "Clear messaging, polished pages, and conversion-focused assets that help local and international customers trust the business faster.",
      },
      {
        label: "Virtual Assistant",
        title: "Executive virtual assistant services",
        copy: "Inbox, calendar, follow-ups, project coordination, and admin support for founders who need operational follow-through.",
      },
    ],
    proofTitle: "Built in South Africa, ready for global work",
    proofCopy:
      "South African businesses often need to compete locally and internationally at the same time. We build the marketing, automation, and operations layer that helps the business look serious, respond faster, and keep work moving without adding more chaos.",
    reviews: [
      "They helped us make the business look as sharp online as the work we do in real life.",
      "The AI and admin systems gave our team breathing room without hiring another full-time person.",
      "Clear strategy, cleaner execution, and no vague marketing theatre.",
    ],
    formTitle: "Start your South Africa project",
    formCopy: "Send the service, market, or operations bottleneck. We will map the next practical move.",
  },
  amsterdam: {
    city: "Amsterdam",
    variant: "amsterdam",
    title: "Amsterdam Digital Marketing Agency, AI Automation & Virtual Assistant Services | LuliDigital",
    description:
      "LuliDigital is Amsterdam's digital marketing agency for tech founders and enterprise teams — performance marketing, brand strategy, AI workflow automation, and executive virtual assistant services, delivered in English.",
    h1: "Amsterdam digital marketing agency. AI automation. Virtual assistant services.",
    h2: "For Amsterdam tech founders, scale-ups, and enterprise marketing teams.",
    eyebrow: "Amsterdam Digital Marketing Agency",
    positioning:
      "An international digital studio serving Amsterdam's tech ecosystem with performance marketing, AI automation, and executive virtual assistant services — English-first, globally executed.",
    intro:
      "LuliDigital helps Amsterdam tech founders, corporate marketing teams, and enterprise brands with paid media management, AI workflow automation, conversational AI assistants, and executive virtual assistant services — all in one desk.",
    primaryCta: "Start an Amsterdam Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "Amsterdam Digital Marketing Agency — AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency Amsterdam",
        "performance marketing Amsterdam",
        "paid media management Amsterdam",
        "brand strategy Amsterdam",
        "SEO services Amsterdam",
        "AI automation Amsterdam",
        "AI workflow automation Amsterdam",
        "conversational AI assistant Amsterdam",
        "AI agent implementation Amsterdam",
        "virtual assistant services Amsterdam",
        "remote executive assistant Amsterdam",
        "executive operations support Amsterdam",
      ],
      description:
        "Amsterdam digital marketing agency offering performance marketing, paid media, brand strategy, AI workflow automation, conversational AI assistants, and executive virtual assistant services for tech founders and enterprise teams.",
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
        "Amsterdam digital marketing agency for tech founders and enterprise teams: performance marketing, AI workflow automation, conversational AI assistants, and executive virtual assistant services.",
    },
    capabilities: [
      {
        label: "Paid Media",
        title: "Performance marketing & paid media",
        copy: "Launch-ready paid media campaigns across Meta, Google, and TikTok with audience logic, creative variants, reporting loops, and optimization triggers.",
      },
      {
        label: "AI Automation",
        title: "AI workflow automation",
        copy: "Custom AI assistants, automated workflows, and agent systems that handle customer questions, route leads, and remove repetitive work from your team.",
      },
      {
        label: "Brand Strategy",
        title: "Brand strategy & creative direction",
        copy: "High-end visual systems, brand positioning, conversion pages, and campaign interfaces built for international trust.",
      },
      {
        label: "Virtual Assistant",
        title: "Executive virtual assistant services",
        copy: "Inbox management, calendar control, project coordination, and operational follow-through for Amsterdam founders and team leads.",
      },
    ],
    proofTitle: "Why Amsterdam's fastest-growing teams go English-first",
    proofCopy:
      "Amsterdam teams operate across borders by default — selling into the UK, US, and Middle East while managing multilingual markets. English-first production removes translation lag, keeps campaign strategy aligned, and lets your team move at global speed without local-agency friction.",
    reviews: [
      "The studio moved faster than our internal campaign calendar and kept every asset on brand.",
      "English-first production made our European launch cleaner than any local-agency handoff.",
      "Their automation thinking changed how our team briefs, produces, and tests campaign assets.",
    ],
    formTitle: "Start your Amsterdam project",
    formCopy: "Send your campaign target, AI challenge, or operations bottleneck. We will map the right system.",
  },
  munich: {
    city: "Munich",
    variant: "munich",
    title: "Munich Digital Marketing Agency, Enterprise AI Automation & Virtual Assistant | LuliDigital",
    description:
      "LuliDigital serves Munich enterprises and German tech companies with performance marketing, corporate brand strategy, enterprise AI automation, and executive virtual assistant services — English-first, globally delivered.",
    h1: "Munich digital marketing agency. Enterprise AI automation. Virtual assistant services.",
    h2: "Performance marketing and AI systems for Munich enterprises and German tech companies.",
    eyebrow: "Munich Digital Marketing Agency",
    positioning:
      "A premium international studio serving Munich's leading enterprises with performance marketing, AI automation, and executive virtual assistant services — built in English, executed to global standards.",
    intro:
      "We serve mid-market B2B enterprises, industrial innovators, and fast-scaling German technology teams with performance marketing, corporate AI automation, and executive virtual assistant services.",
    primaryCta: "Start a Munich Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "Munich Digital Marketing Agency — Enterprise AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency Munich",
        "performance marketing Munich",
        "enterprise digital marketing Munich",
        "corporate brand strategy Munich",
        "paid media management Munich",
        "SEO services Munich",
        "enterprise AI automation Munich",
        "AI workflow automation Munich",
        "AI integration Munich",
        "virtual assistant Munich",
        "executive virtual assistant Munich",
        "remote executive assistant Munich",
      ],
      description:
        "Munich digital marketing agency offering corporate performance marketing, enterprise AI workflow automation, and executive virtual assistant services for B2B enterprises and German tech companies.",
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
        "Munich digital marketing agency for enterprises and German tech companies: performance marketing, corporate brand strategy, enterprise AI automation, and executive virtual assistant services.",
    },
    capabilities: [
      {
        label: "01",
        title: "Corporate performance marketing",
        copy: "Enterprise-grade paid media campaigns, corporate brand strategy, and conversion systems built to perform in B2B and industrial markets.",
      },
      {
        label: "02",
        title: "Enterprise AI automation",
        copy: "AI workflow automation, conversational AI assistants, and agent systems that modernise operations and remove repetitive work at scale.",
      },
      {
        label: "03",
        title: "High-end brand design Munich",
        copy: "Premium digital design standards for enterprise pages, executive campaigns, product launches, and investor-facing assets.",
      },
      {
        label: "04",
        title: "Executive virtual assistant services",
        copy: "Remote executive assistant support for Munich founders and leadership teams — inbox, calendar, project coordination, and operational follow-through.",
      },
    ],
    proofTitle: "Why English-first execution wins for Munich enterprises",
    proofCopy:
      "Munich teams sell into Europe, North America, and the Middle East. English-first production removes translation drag, reduces regional design friction, and keeps executive, product, and campaign teams aligned around one global standard — without rebuilding your internal process.",
    reviews: [
      "A disciplined partner for enterprise campaign execution, not another vendor waiting for instructions.",
      "They translated complex industrial value into a premium digital campaign system our board understood.",
      "The English-first workflow helped our German and international teams move with one source of truth.",
    ],
    formTitle: "Start your Munich project",
    formCopy: "Share your campaign priority, AI challenge, or operations need. We will respond with a production path.",
  },
  stockholm: {
    city: "Stockholm",
    variant: "stockholm",
    title: "Stockholm Digital Marketing Agency, AI Automation & Virtual Assistant Services | LuliDigital",
    description:
      "LuliDigital is Stockholm's digital marketing agency for startups and Nordic brands — performance marketing, brand strategy, AI workflow automation, and virtual assistant services for teams that move fast.",
    h1: "Stockholm digital marketing agency. AI automation. Virtual assistant services.",
    h2: "For Stockholm startups, Nordic tech platforms, and lifestyle brands.",
    eyebrow: "Stockholm Digital Marketing Agency",
    positioning:
      "A design-first international studio serving Stockholm's tech elite with performance marketing, AI automation, and executive virtual assistant services — engineered in English, built to Nordic standard.",
    intro:
      "We serve Nordic startups, tech platforms, and lifestyle brands with performance marketing, AI workflow automation, conversational AI assistants, and virtual assistant services that keep up with product velocity.",
    primaryCta: "Start a Stockholm Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "Stockholm Digital Marketing Agency — AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency Stockholm",
        "performance marketing Stockholm",
        "startup marketing agency Stockholm",
        "brand strategy Stockholm",
        "paid media management Stockholm",
        "SEO services Stockholm",
        "AI automation Stockholm",
        "AI workflow automation Stockholm",
        "conversational AI Stockholm",
        "virtual assistant Stockholm",
        "executive virtual assistant Stockholm",
        "remote executive assistant Stockholm",
      ],
      description:
        "Stockholm digital marketing agency for startups and Nordic brands: performance marketing, brand strategy, AI workflow automation, conversational AI assistants, and virtual assistant services.",
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
        "Stockholm digital marketing agency for startups and Nordic brands: performance marketing, AI workflow automation, conversational AI assistants, and virtual assistant services.",
    },
    capabilities: [
      {
        label: "Paid Media",
        title: "Performance marketing & paid media",
        copy: "Campaign systems built for startup velocity — audience strategy, paid media across Meta, Google, and TikTok, and automated creative workflows that scale with your growth.",
      },
      {
        label: "AI Automation",
        title: "AI workflow automation",
        copy: "Conversational AI assistants, workflow automation, and agent systems that answer questions, route leads, and remove operational drag from your team.",
      },
      {
        label: "Brand & Web",
        title: "Brand strategy & web production",
        copy: "Sharp brand systems, minimal interfaces, and cinematic campaign assets built to the Nordic standard — fast, premium, production-grade.",
      },
      {
        label: "Virtual Assistant",
        title: "Executive virtual assistant services",
        copy: "Remote executive support for Stockholm founders — inbox, calendar, project management, and operations so you stay focused on building.",
      },
    ],
    proofTitle: "The Nordic design standard — at production velocity",
    proofCopy:
      "Stockholm brands set a high visual bar. We match it with campaign systems built for taste and speed — sharp brand assets, automated workflows, and AI systems that let your team produce at a level that looks like you have a team twice the size.",
    reviews: [
      "Their creative automation gave our launch the visual depth of a much larger brand team.",
      "Minimal, premium, fast. The studio understood the Nordic standard immediately.",
      "The asset generation workflow helped us produce cinematic campaign material without losing taste.",
    ],
    formTitle: "Start your Stockholm project",
    formCopy: "Send your brand, campaign, or AI challenge. We will respond with a focused recommendation.",
  },
};
