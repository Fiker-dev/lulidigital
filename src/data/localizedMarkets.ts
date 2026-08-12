const siteUrl = "https://lulidigital.com";

export const regionalAlternates = [
  { hreflang: "x-default", href: `${siteUrl}/` },
  { hreflang: "en-nl", href: `${siteUrl}/amsterdam` },
  { hreflang: "en-de", href: `${siteUrl}/munich` },
  { hreflang: "en-se", href: `${siteUrl}/stockholm` },
  { hreflang: "en-us", href: `${siteUrl}/united-states` },
  { hreflang: "en-gb", href: `${siteUrl}/united-kingdom` },
  { hreflang: "en-dk", href: `${siteUrl}/denmark` },
  { hreflang: "en-ch", href: `${siteUrl}/switzerland` },
  { hreflang: "en-ie", href: `${siteUrl}/ireland` },
  { hreflang: "en-be", href: `${siteUrl}/belgium` },
  { hreflang: "en-no", href: `${siteUrl}/norway` },
];

const sharedTelephone = "+27602551513";
const openingHours = "Mo-Fr 09:00-18:00";

export const localizedOrganizationSchema = {
  "@type": "Organization",
  "name": "LuliDigital",
  "url": siteUrl,
  "logo": `${siteUrl}/favicon.png`,
  "description": "LuliDigital provides premium digital marketing, AI-driven business automation solutions, and specialized executive virtual assistant services for founders and modern brands across the United States, United Kingdom, and Europe.",
  "email": "info@lulidigital.com",
  "telephone": sharedTelephone,
  "sameAs": [
    "https://www.linkedin.com/company/lulidigital",
    "https://clutch.co/profile/lulidigital",
    "https://www.sortlist.com/agency/lulidigital",
  ],
  "areaServed": [
    { "@type": "AdministrativeArea", "name": "United States" },
    { "@type": "AdministrativeArea", "name": "United Kingdom" },
    { "@type": "AdministrativeArea", "name": "Europe" },
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
    "AI Automation and Business Workflow Systems",
    "Executive Virtual Assistant Services",
    "Brand Strategy",
    "Paid Media Execution",
    "Performance Marketing",
    "SEO Services",
    "Conversational AI Assistants",
  ],
};

export const markets = {
  amsterdam: {
    city: "Amsterdam",
    variant: "amsterdam",
    title: "Amsterdam Growth & Automation Studio | LuliDigital",
    description:
      "Marketing, AI automation, and executive support for Amsterdam founders and international scale-up teams.",
    h1: "Grow faster in Amsterdam without adding operational drag.",
    h2: "For Amsterdam tech founders, scale-ups, and enterprise marketing teams.",
    outcomeTitle: "Built to scale beyond the Netherlands.",
    eyebrow: "Amsterdam Digital Marketing Agency",
    positioning:
      "An international studio helping Amsterdam technology teams improve demand generation, automate repetitive operations, and protect leadership attention.",
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
      areaServed: [
        { "@type": "City", name: "Amsterdam" },
        { "@type": "Country", name: "Netherlands" },
        { "@type": "AdministrativeArea", name: "Europe" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital Amsterdam",
      logo: `${siteUrl}/favicon.png`,
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
        label: "Virtual Assistant Desk",
        title: "Executive virtual assistant services",
        copy: "Inbox management, calendar control, project coordination, and operational follow-through for Amsterdam founders and team leads.",
      },
    ],
    proofTitle: "One operating language for an international market",
    proofCopy:
      "Amsterdam teams operate across borders by default — selling into the UK, US, and Middle East while managing multilingual markets. English-first production removes translation lag, keeps campaign strategy aligned, and lets your team move at global speed without local-agency friction.",
    formTitle: "Start your Amsterdam project",
    formCopy: "Send your campaign target, AI challenge, or operations bottleneck. We will map the right system.",
  },
  munich: {
    city: "Munich",
    variant: "munich",
    title: "Munich B2B Growth & Automation Studio | LuliDigital",
    description:
      "Structured marketing, AI automation, and executive support for Munich B2B and technology teams.",
    h1: "Precision growth systems for ambitious Munich teams.",
    h2: "Performance marketing and AI systems for Munich enterprises and German tech companies.",
    outcomeTitle: "Structured execution for considered B2B growth.",
    eyebrow: "Munich Digital Marketing Agency",
    positioning:
      "An international studio helping Munich B2B teams build structured marketing, documented automation, and reliable executive operations.",
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
      areaServed: [
        { "@type": "City", name: "Munich" },
        { "@type": "Country", name: "Germany" },
        { "@type": "AdministrativeArea", name: "Europe" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital Munich",
      logo: `${siteUrl}/favicon.png`,
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
        copy: "Paid media, corporate brand strategy, and conversion systems built for considered B2B and industrial buying cycles.",
      },
      {
        label: "02",
        title: "Enterprise AI automation",
        copy: "AI workflow automation, conversational AI assistants, and agent systems that modernise operations and remove repetitive work at scale.",
      },
      {
        label: "03",
        title: "Brand systems for serious buyers",
        copy: "Clear digital design for corporate pages, executive campaigns, product launches, and investor-facing materials.",
      },
      {
        label: "04",
        title: "Executive virtual assistant services",
        copy: "Remote executive assistant support for Munich founders and leadership teams — inbox, calendar, project coordination, and operational follow-through.",
      },
    ],
    proofTitle: "Why English-first execution wins for Munich enterprises",
    proofCopy:
      "Munich teams sell into Europe, North America, and the Middle East. English-first production reduces translation delays and keeps executive, product, and campaign teams aligned without forcing a new internal process.",
    formTitle: "Start your Munich project",
    formCopy: "Share your campaign priority, AI challenge, or operations need. We will respond with a production path.",
  },
  stockholm: {
    city: "Stockholm",
    variant: "stockholm",
    title: "Stockholm Growth & Automation Studio | LuliDigital",
    description:
      "Design-led marketing, AI automation, and executive support for Stockholm startups and Nordic brands.",
    h1: "Nordic-quality growth, built to move at founder speed.",
    h2: "For Stockholm startups, Nordic tech platforms, and lifestyle brands.",
    outcomeTitle: "Design quality that keeps pace with your team.",
    eyebrow: "Stockholm Digital Marketing Agency",
    positioning:
      "A design-led international studio helping Stockholm teams connect sharper marketing with cleaner automation and dependable executive support.",
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
      areaServed: [
        { "@type": "City", name: "Stockholm" },
        { "@type": "Country", name: "Sweden" },
        { "@type": "AdministrativeArea", name: "Europe" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital Stockholm",
      logo: `${siteUrl}/favicon.png`,
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
        copy: "Sharp brand systems, focused interfaces, and campaign assets designed for fast-moving Nordic teams.",
      },
      {
        label: "Virtual Assistant Desk",
        title: "Executive virtual assistant services",
        copy: "Remote executive support for Stockholm founders — inbox, calendar, project management, and operations so you stay focused on building.",
      },
    ],
    proofTitle: "The Nordic design standard — at production velocity",
    proofCopy:
      "Stockholm brands set a high visual bar. We match it with campaign systems built for taste and speed — sharp brand assets, automated workflows, and AI systems that let your team produce at a level that looks like you have a team twice the size.",
    formTitle: "Start your Stockholm project",
    formCopy: "Send your brand, campaign, or AI challenge. We will respond with a focused recommendation.",
  },
  unitedStates: {
    city: "United States",
    variant: "united-states",
    title: "US Growth & Automation Partner | LuliDigital",
    description:
      "Marketing, AI automation, and executive support for ambitious US founders and remote-first teams.",
    h1: "A sharper growth engine for ambitious US businesses.",
    h2: "For US founders, SaaS teams, and remote-first businesses.",
    outcomeTitle: "More output across a demanding market.",
    eyebrow: "United States Growth Desk",
    positioning:
      "The US market moves fast and punishes hesitation. LuliDigital gives US founders a lean execution layer — marketing that compounds, AI that actually automates, and operations that don't fall apart at scale.",
    intro:
      "Built for SaaS founders, DTC brands, and remote-first teams who need marketing that converts, systems that scale, and operational support that never slips. One studio, three desks, no agency overhead.",
    primaryCta: "Start a US Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "US Digital Marketing Agency — AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency United States",
        "performance marketing USA",
        "paid media management USA",
        "brand strategy USA",
        "SEO services United States",
        "AI automation USA",
        "AI workflow automation USA",
        "conversational AI assistant USA",
        "virtual assistant services USA",
        "remote executive assistant USA",
      ],
      description:
        "US digital marketing agency offering performance marketing, paid media, brand strategy, AI workflow automation, and executive virtual assistant services for founders and remote-first teams.",
      areaServed: [
        { "@type": "AdministrativeArea", name: "United States" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital United States",
      logo: `${siteUrl}/favicon.png`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressCountry: "US",
      },
      description:
        "US digital marketing agency for founders and remote-first teams: performance marketing, AI automation, and executive virtual assistant services.",
    },
    capabilities: [
      {
        label: "Paid Media",
        title: "Performance marketing built for US growth",
        copy: "Meta, Google, and LinkedIn campaigns with audience strategy, creative variants, and automated reporting loops built for the US buyer cycle.",
      },
      {
        label: "AI Automation",
        title: "AI workflow automation for lean teams",
        copy: "Custom AI assistants, automated lead routing, and workflow systems that remove repetitive work and keep operations moving across time zones.",
      },
      {
        label: "Brand & SEO",
        title: "Brand strategy and search visibility",
        copy: "Positioning, landing pages, and SEO infrastructure built to rank in competitive US markets and convert high-intent traffic into pipeline.",
      },
      {
        label: "Virtual Assistant Desk",
        title: "Executive virtual assistant services",
        copy: "Inbox, calendar, project coordination, and follow-through for US founders who need reliable remote operational support.",
      },
    ],
    proofTitle: "Remote-first, US-standard execution",
    proofCopy:
      "US founders operate in one of the most competitive digital markets in the world. We build the paid media engine, automation layer, and operational support that helps remote-first teams move at the speed the US market demands without the overhead of a full in-house team.",
    formTitle: "Start your US project",
    formCopy: "Send the market, campaign target, or operations bottleneck. We will map the fastest route to a cleaner system.",
  },
  unitedKingdom: {
    city: "United Kingdom",
    variant: "united-kingdom",
    title: "UK Growth & Automation Partner | LuliDigital",
    description:
      "Marketing, AI automation, and executive support for UK founders and scale-ups competing in crowded markets.",
    h1: "Turn UK market attention into predictable growth.",
    h2: "For UK founders, agencies, and scale-ups.",
    outcomeTitle: "A clearer edge in a crowded market.",
    eyebrow: "United Kingdom Growth Desk",
    positioning:
      "UK founders don't need another agency. They need execution. LuliDigital is the remote studio that runs the marketing, builds the AI systems, and keeps operations clean — so you can focus on growing.",
    intro:
      "We work with UK founders and scale-ups who've outgrown the chaos but aren't ready to build a full in-house team. Paid media, AI automation, and executive VA support — all from one desk, without the overhead.",
    primaryCta: "Start a UK Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "UK Digital Marketing Agency — AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency UK",
        "performance marketing UK",
        "paid media management UK",
        "brand strategy UK",
        "SEO services United Kingdom",
        "AI automation UK",
        "AI workflow automation UK",
        "conversational AI assistant UK",
        "virtual assistant services UK",
        "remote executive assistant UK",
      ],
      description:
        "UK digital marketing agency offering performance marketing, paid media, brand strategy, AI workflow automation, and executive virtual assistant services for founders and scale-ups.",
      areaServed: [
        { "@type": "AdministrativeArea", name: "United Kingdom" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital United Kingdom",
      logo: `${siteUrl}/favicon.png`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressCountry: "GB",
      },
      description:
        "UK digital marketing agency for founders and scale-ups: performance marketing, AI automation, and executive virtual assistant services.",
    },
    capabilities: [
      {
        label: "Paid Media",
        title: "Performance marketing for UK scale-ups",
        copy: "Meta, Google, and LinkedIn campaigns with creative strategy, audience targeting, and reporting built for UK buyer expectations and market cycles.",
      },
      {
        label: "AI Automation",
        title: "AI workflow automation",
        copy: "Custom AI assistants, automated operations, and agent systems that handle customer queries, route leads, and free your team from repetitive work.",
      },
      {
        label: "Brand & SEO",
        title: "Brand strategy and search performance",
        copy: "Clear positioning, high-converting landing pages, and SEO infrastructure built to compete in UK search markets.",
      },
      {
        label: "Virtual Assistant Desk",
        title: "Executive virtual assistant services",
        copy: "Inbox, calendar, project coordination, and operational follow-through for UK founders who need reliable, quiet administrative support.",
      },
    ],
    proofTitle: "Built for the pace of UK agency and founder markets",
    proofCopy:
      "UK teams face competitive digital markets and increasingly sophisticated buyers. We build the marketing infrastructure, automation layer, and executive support that lets UK founders and scale-ups compete without building a large in-house team.",
    formTitle: "Start your UK project",
    formCopy: "Send your campaign priority, AI bottleneck, or operations challenge. We will map a direct route.",
  },
  denmark: {
    city: "Denmark",
    variant: "denmark",
    title: "Denmark Growth & Automation Studio | LuliDigital",
    description:
      "Clear marketing, AI automation, and executive support for Danish founders and lean Nordic teams.",
    h1: "Clearer growth systems for ambitious Danish teams.",
    h2: "For Danish tech founders, scale-ups, and Nordic businesses.",
    outcomeTitle: "Lean execution with no unnecessary noise.",
    eyebrow: "Denmark Digital Studio",
    positioning:
      "An international studio serving Danish founders and Nordic companies with performance marketing, AI workflow automation, and executive virtual assistant services — English-first, globally executed.",
    intro:
      "LuliDigital helps Danish tech companies, startups, and Nordic founders with paid media, SEO, brand strategy, AI workflow automation, and executive virtual assistant services from one focused desk.",
    primaryCta: "Start a Denmark Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "Denmark Digital Marketing Agency — AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency Denmark",
        "performance marketing Denmark",
        "paid media management Denmark",
        "brand strategy Denmark",
        "SEO services Denmark",
        "AI automation Denmark",
        "AI workflow automation Denmark",
        "virtual assistant services Denmark",
        "remote executive assistant Denmark",
        "digital marketing agency Copenhagen",
      ],
      description:
        "Denmark digital marketing agency offering performance marketing, paid media, brand strategy, AI workflow automation, and executive virtual assistant services for Danish tech founders and Nordic businesses.",
      areaServed: [
        { "@type": "Country", name: "Denmark" },
        { "@type": "AdministrativeArea", name: "Europe" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital Denmark",
      logo: `${siteUrl}/favicon.png`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Copenhagen",
        addressCountry: "DK",
      },
      description:
        "Denmark digital marketing agency for tech founders and Nordic businesses: performance marketing, AI automation, and executive virtual assistant services.",
    },
    capabilities: [
      {
        label: "Paid Media",
        title: "Performance marketing for Danish growth teams",
        copy: "Paid media campaigns across Meta, Google, and LinkedIn with creative strategy and reporting built for the Nordic buyer standard.",
      },
      {
        label: "AI Automation",
        title: "AI automation for Danish teams",
        copy: "Custom AI assistants, workflow automation, and agent systems that answer queries, route leads, and reduce manual work across the business.",
      },
      {
        label: "Brand & SEO",
        title: "Brand strategy and search visibility",
        copy: "Clean positioning, high-converting landing pages, and SEO infrastructure built for Danish and Nordic search markets.",
      },
      {
        label: "Virtual Assistant Desk",
        title: "Executive virtual assistant services",
        copy: "Inbox, calendar, coordination, and admin support for Danish founders who need reliable remote execution.",
      },
    ],
    proofTitle: "The Nordic standard — at global execution speed",
    proofCopy:
      "Danish companies compete internationally by default. We build the marketing systems, automation layer, and executive support infrastructure that lets Danish founders run at the speed of their product without building a large internal operations team.",
    formTitle: "Start your Denmark project",
    formCopy: "Send the campaign target, AI challenge, or operations bottleneck. We will map a direct, practical route.",
  },
  switzerland: {
    city: "Switzerland",
    variant: "switzerland",
    title: "Swiss Marketing & Automation Partner | LuliDigital",
    description:
      "Careful marketing, AI automation, and executive support for Swiss businesses and international teams.",
    h1: "Precision marketing and operations for Swiss businesses.",
    h2: "For Swiss enterprises, precision businesses, and international teams.",
    outcomeTitle: "Careful execution for high-trust markets.",
    eyebrow: "Switzerland Digital Studio",
    positioning:
      "An international studio helping Swiss teams improve demand generation, automate carefully, and add dependable executive support in English.",
    intro:
      "LuliDigital helps Swiss enterprises, financial services teams, and international businesses with paid media, SEO, brand strategy, AI workflow automation, and executive virtual assistant services from one focused desk.",
    primaryCta: "Start a Switzerland Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "Switzerland Digital Marketing Agency — AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency Switzerland",
        "performance marketing Switzerland",
        "enterprise digital marketing Switzerland",
        "brand strategy Switzerland",
        "SEO services Switzerland",
        "AI automation Switzerland",
        "AI workflow automation Switzerland",
        "virtual assistant Switzerland",
        "executive virtual assistant Switzerland",
        "remote executive assistant Switzerland",
        "digital marketing agency Zurich",
      ],
      description:
        "Switzerland digital marketing agency offering performance marketing, enterprise brand strategy, AI workflow automation, and executive virtual assistant services for Swiss enterprises and international businesses.",
      areaServed: [
        { "@type": "Country", name: "Switzerland" },
        { "@type": "AdministrativeArea", name: "Europe" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital Switzerland",
      logo: `${siteUrl}/favicon.png`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Zurich",
        addressCountry: "CH",
      },
      description:
        "Switzerland digital marketing agency for enterprises and international businesses: performance marketing, AI automation, and executive virtual assistant services.",
    },
    capabilities: [
      {
        label: "Paid Media",
        title: "Performance marketing for Swiss enterprises",
        copy: "Paid media campaigns with precise audience logic, brand controls, and clear optimization rules for Swiss and international markets.",
      },
      {
        label: "AI Automation",
        title: "AI automation for Swiss teams",
        copy: "AI workflow automation, conversational assistants, and agent systems that handle internal queries, route client requests, and reduce operational friction.",
      },
      {
        label: "Brand & SEO",
        title: "Premium brand strategy and SEO",
        copy: "Clean positioning, high-trust landing pages, and multilingual-ready SEO infrastructure built for Swiss and European search markets.",
      },
      {
        label: "Virtual Assistant Desk",
        title: "Executive virtual assistant services",
        copy: "Inbox, calendar, project coordination, and executive operations support for Swiss leadership teams and international founders.",
      },
    ],
    proofTitle: "European precision. Global execution.",
    proofCopy:
      "Swiss enterprises operate to a high standard of quality, trust, and detail. We build the marketing infrastructure, automation layer, and executive support that matches that standard — without the overhead of a large internal team.",
    formTitle: "Start your Switzerland project",
    formCopy: "Send the market priority, AI challenge, or operations need. We will respond with a focused, practical plan.",
  },
  ireland: {
    city: "Ireland",
    variant: "ireland",
    title: "Ireland Growth & Automation Partner | LuliDigital",
    description:
      "Marketing, AI automation, and executive support for Irish founders and EU-connected technology teams.",
    h1: "A practical growth partner for Ireland's ambitious teams.",
    h2: "For Irish tech founders, scale-ups, and EU-operating teams.",
    outcomeTitle: "One system for Irish, UK, EU, and US growth.",
    eyebrow: "Ireland Digital Studio",
    positioning:
      "An international studio serving Irish tech companies and EU-operating teams with performance marketing, AI workflow automation, and executive virtual assistant services — English-first, globally executed.",
    intro:
      "LuliDigital helps Irish founders, tech companies, and EU-facing businesses with paid media, SEO, brand strategy, AI workflow automation, and executive virtual assistant services from one focused desk.",
    primaryCta: "Start an Ireland Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "Ireland Digital Marketing Agency — AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency Ireland",
        "performance marketing Ireland",
        "paid media management Ireland",
        "brand strategy Ireland",
        "SEO services Ireland",
        "AI automation Ireland",
        "AI workflow automation Ireland",
        "virtual assistant services Ireland",
        "remote executive assistant Ireland",
        "digital marketing agency Dublin",
      ],
      description:
        "Ireland digital marketing agency offering performance marketing, paid media, brand strategy, AI workflow automation, and executive virtual assistant services for Irish tech founders and EU-operating teams.",
      areaServed: [
        { "@type": "Country", name: "Ireland" },
        { "@type": "AdministrativeArea", name: "Europe" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital Ireland",
      logo: `${siteUrl}/favicon.png`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dublin",
        addressCountry: "IE",
      },
      description:
        "Ireland digital marketing agency for tech founders and EU-operating teams: performance marketing, AI automation, and executive virtual assistant services.",
    },
    capabilities: [
      {
        label: "Paid Media",
        title: "Performance marketing for Irish tech",
        copy: "Meta, Google, and LinkedIn campaigns with audience strategy and creative systems built for the Irish and wider EU tech market.",
      },
      {
        label: "AI Automation",
        title: "AI automation for EU-facing teams",
        copy: "Custom AI assistants, workflow automation, and agent systems that handle inbound, route leads, and streamline operations for EU-facing businesses.",
      },
      {
        label: "Brand & SEO",
        title: "Brand strategy and search visibility",
        copy: "Clear positioning, high-converting pages, and SEO infrastructure built to compete in Irish and EU search markets.",
      },
      {
        label: "Virtual Assistant Desk",
        title: "Executive virtual assistant services",
        copy: "Inbox, calendar, coordination, and admin support for Irish founders who need reliable remote execution.",
      },
    ],
    proofTitle: "Built for the pace of Ireland's tech ecosystem",
    proofCopy:
      "Ireland's tech scene operates at global speed, with EU market obligations and an English-first commercial culture. We build the marketing, automation, and operations infrastructure that helps Irish founders and teams move fast without losing control.",
    formTitle: "Start your Ireland project",
    formCopy: "Send the campaign target, AI challenge, or operations bottleneck. We will map the most direct route.",
  },
  belgium: {
    city: "Belgium",
    variant: "belgium",
    title: "Belgium Growth & Automation Partner | LuliDigital",
    description:
      "Multilingual-ready marketing, AI automation, and executive support for Belgian and EU-facing teams.",
    h1: "Connect Belgian expertise with the customers who need it.",
    h2: "For Belgian businesses, EU agencies, and international teams.",
    outcomeTitle: "Cross-border growth for a multilingual market.",
    eyebrow: "Belgium Digital Studio",
    positioning:
      "An international studio serving Belgian businesses and EU-operating teams with performance marketing, AI workflow automation, and executive virtual assistant services — English-first, built to European standard.",
    intro:
      "LuliDigital helps Belgian companies, EU-facing startups, and international teams with paid media, SEO, brand strategy, AI workflow automation, and executive virtual assistant services from one focused desk.",
    primaryCta: "Start a Belgium Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "Belgium Digital Marketing Agency — AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency Belgium",
        "performance marketing Belgium",
        "paid media management Belgium",
        "brand strategy Belgium",
        "SEO services Belgium",
        "AI automation Belgium",
        "AI workflow automation Belgium",
        "virtual assistant services Belgium",
        "remote executive assistant Belgium",
        "digital marketing agency Brussels",
      ],
      description:
        "Belgium digital marketing agency offering performance marketing, paid media, brand strategy, AI workflow automation, and executive virtual assistant services for Belgian businesses and EU-operating teams.",
      areaServed: [
        { "@type": "Country", name: "Belgium" },
        { "@type": "AdministrativeArea", name: "Europe" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital Belgium",
      logo: `${siteUrl}/favicon.png`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Brussels",
        addressCountry: "BE",
      },
      description:
        "Belgium digital marketing agency for businesses and EU-operating teams: performance marketing, AI automation, and executive virtual assistant services.",
    },
    capabilities: [
      {
        label: "Paid Media",
        title: "Performance marketing for Belgian businesses",
        copy: "Paid media campaigns across Meta, Google, and LinkedIn with audience strategy and creative systems built for Belgian and EU market standards.",
      },
      {
        label: "AI Automation",
        title: "AI automation for EU-facing teams",
        copy: "Custom AI assistants, automated workflows, and agent systems that handle customer queries, route leads, and reduce operational overhead.",
      },
      {
        label: "Brand & SEO",
        title: "Brand strategy and multilingual SEO",
        copy: "Clear positioning, high-converting landing pages, and SEO infrastructure built for Belgian and EU search markets.",
      },
      {
        label: "Virtual Assistant Desk",
        title: "Executive virtual assistant services",
        copy: "Inbox, calendar, project coordination, and operational support for Belgian founders and international teams who need reliable remote execution.",
      },
    ],
    proofTitle: "EU-standard execution for Belgian businesses",
    proofCopy:
      "Belgian businesses operate at the centre of the EU market, with complex buyer expectations and multilingual commercial requirements. We build the marketing, automation, and operational infrastructure that helps Belgian companies compete without building a large internal team.",
    formTitle: "Start your Belgium project",
    formCopy: "Send the market priority, AI challenge, or operations bottleneck. We will map a direct, practical route.",
  },
  norway: {
    city: "Norway",
    variant: "norway",
    title: "Norway Growth & Automation Studio | LuliDigital",
    description:
      "Efficient marketing, AI automation, and executive support for Norwegian founders and Nordic businesses.",
    h1: "Build a stronger growth system for your Norwegian business.",
    h2: "For Norwegian enterprises, tech companies, and Nordic businesses.",
    outcomeTitle: "More capacity without another management layer.",
    eyebrow: "Norway Digital Studio",
    positioning:
      "An international studio serving Norwegian enterprises and Nordic companies with performance marketing, AI workflow automation, and executive virtual assistant services — English-first, built to Nordic standard.",
    intro:
      "LuliDigital helps Norwegian founders, enterprise teams, and Nordic businesses with paid media, SEO, brand strategy, AI workflow automation, and executive virtual assistant services from one focused desk.",
    primaryCta: "Start a Norway Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "Norway Digital Marketing Agency — AI Automation & Virtual Assistant Services",
      serviceType: [
        "digital marketing agency Norway",
        "performance marketing Norway",
        "paid media management Norway",
        "brand strategy Norway",
        "SEO services Norway",
        "AI automation Norway",
        "AI workflow automation Norway",
        "virtual assistant services Norway",
        "remote executive assistant Norway",
        "digital marketing agency Oslo",
      ],
      description:
        "Norway digital marketing agency offering performance marketing, paid media, brand strategy, AI workflow automation, and executive virtual assistant services for Norwegian enterprises and Nordic businesses.",
      areaServed: [
        { "@type": "Country", name: "Norway" },
        { "@type": "AdministrativeArea", name: "Europe" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital Norway",
      logo: `${siteUrl}/favicon.png`,
      telephone: sharedTelephone,
      openingHours,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Oslo",
        addressCountry: "NO",
      },
      description:
        "Norway digital marketing agency for enterprises and Nordic businesses: performance marketing, AI automation, and executive virtual assistant services.",
    },
    capabilities: [
      {
        label: "Paid Media",
        title: "Performance marketing for Norwegian enterprises",
        copy: "Paid media campaigns with precise audience logic and creative systems built for Norwegian and Nordic buyers.",
      },
      {
        label: "AI Automation",
        title: "AI automation for Norwegian teams",
        copy: "Custom AI assistants, workflow automation, and agent systems that reduce manual work, handle routine queries, and keep operations running cleanly.",
      },
      {
        label: "Brand & SEO",
        title: "Brand strategy and search visibility",
        copy: "Clear positioning, high-converting pages, and SEO infrastructure built for Norwegian and Nordic search markets.",
      },
      {
        label: "Virtual Assistant Desk",
        title: "Executive virtual assistant services",
        copy: "Inbox, calendar, project coordination, and operational follow-through for Norwegian founders and enterprise leadership teams.",
      },
    ],
    proofTitle: "Nordic precision — with global reach",
    proofCopy:
      "Norwegian companies operate to a high standard of quality and efficiency. We build the marketing systems, automation layer, and executive support that matches that standard and helps Norwegian businesses expand beyond the Nordic region.",
    formTitle: "Start your Norway project",
    formCopy: "Send the campaign priority, AI challenge, or operations need. We will respond with a focused, practical plan.",
  },
};
