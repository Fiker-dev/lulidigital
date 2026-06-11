const siteUrl = "https://lulidigital.com";

export const regionalAlternates = [
  { hreflang: "x-default", href: `${siteUrl}/` },
  { hreflang: "en-001", href: `${siteUrl}/africa` },
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
  "description": "LuliDigital provides premium digital marketing, AI-driven business automation solutions, and specialized executive virtual assistant services for founders and modern brands across the United States, United Kingdom, Europe, and Africa.",
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
    { "@type": "AdministrativeArea", "name": "Africa" },
    { "@type": "Country", "name": "Nigeria" },
    { "@type": "Country", "name": "Kenya" },
    { "@type": "Country", "name": "Ghana" },
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
  africa: {
    city: "Africa",
    variant: "africa",
    title: "Digital Marketing, AI Automation & Virtual Assistant Services for African Companies | LuliDigital",
    description:
      "LuliDigital helps international companies, African startups, and dollar-earning service businesses with digital marketing, AI automation, SEO, and executive virtual assistant services.",
    h1: "Digital marketing, AI automation, and executive support for ambitious African companies.",
    h2: "For international teams, funded startups, exporters, agencies, and dollar-earning service businesses across Africa.",
    eyebrow: "Africa Growth Desk",
    positioning:
    "An international studio helping companies that sell beyond borders build sharper marketing, cleaner automation, and stronger executive operations.",
    intro:
      "LuliDigital works with African companies serving global clients, international teams operating on the continent, and founders who need their digital presence, systems, and execution to match a dollar-paying market.",
    primaryCta: "Start an Africa Project",
    secondaryCta: "View All Services",
    serviceSchema: {
      name: "Digital Marketing, AI Automation & Virtual Assistant Services for African Companies",
      serviceType: [
        "digital marketing agency Africa",
        "digital marketing agency for African startups",
        "performance marketing agency Africa",
        "SEO services Africa",
        "AI automation Africa",
        "AI automation for African companies",
        "virtual assistant services Africa",
        "remote executive assistant Africa",
        "digital marketing for international companies in Africa",
        "marketing agency for dollar earning African businesses",
        "AI workflow automation for African businesses",
      ],
      description:
        "Digital marketing, SEO, AI automation, paid media, brand strategy, and executive virtual assistant services for African companies, international teams, and dollar-earning service businesses.",
      areaServed: [
        { "@type": "AdministrativeArea", name: "Africa" },
      ],
    },
    localBusinessSchema: {
      name: "LuliDigital Africa",
      logo: `${siteUrl}/favicon.png`,
      telephone: sharedTelephone,
      openingHours,
      description:
        "Africa-focused digital studio for international companies, funded startups, exporters, and dollar-earning service businesses.",
    },
    capabilities: [
      {
        label: "International Growth",
        title: "Marketing for companies selling beyond borders",
        copy: "Positioning, SEO, paid media, and landing pages for African companies that need to look credible to buyers in Europe, the US, the Middle East, and across the continent.",
      },
      {
        label: "AI Automation",
        title: "Lean systems for cross-border teams",
        copy: "AI assistants, reporting workflows, lead routing, and internal knowledge tools for teams that cannot afford messy handoffs or slow response times.",
      },
      {
        label: "Brand & Web",
        title: "Premium digital presence for serious buyers",
        copy: "Brand systems, conversion pages, and campaign assets built for trust with international customers, investors, partners, and procurement teams.",
      },
      {
        label: "Executive Support",
        title: "Remote executive assistant services",
        copy: "Inbox, calendar, follow-ups, research, coordination, and operational support for founders and leadership teams working across time zones.",
      },
    ],
    proofTitle: "Africa-based does not mean local-only",
    proofCopy:
      "Many African companies are already serving international customers, pitching global partners, or working with remote teams. The problem is often not ambition. It is that the website, follow-up system, campaign engine, and operations layer do not yet match the market they want to win.",
    reviews: [
      "They understood the gap between local execution and international expectations immediately.",
      "The systems helped us respond faster to overseas leads without hiring a bigger admin team.",
      "Our brand finally looked like it belonged in the same room as the clients we wanted.",
    ],
    formTitle: "Start your Africa growth project",
    formCopy: "Send the market, service, or operations bottleneck. We will map the most direct route to a cleaner international-facing system.",
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
        copy: "Sharp brand systems, minimal interfaces, and cinematic campaign assets built to the Nordic standard — fast, premium, production-grade.",
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
    reviews: [
      "Their creative automation gave our launch the visual depth of a much larger brand team.",
      "Minimal, premium, fast. The studio understood the Nordic standard immediately.",
      "The asset generation workflow helped us produce cinematic campaign material without losing taste.",
    ],
    formTitle: "Start your Stockholm project",
    formCopy: "Send your brand, campaign, or AI challenge. We will respond with a focused recommendation.",
  },
  unitedStates: {
    city: "United States",
    variant: "united-states",
    title: "US Digital Marketing Agency, AI Automation & Virtual Assistant Services | LuliDigital",
    description:
      "LuliDigital serves US founders and remote-first teams with digital marketing, AI automation, SEO, paid media, and executive virtual assistant services.",
    h1: "US digital marketing agency. AI automation. Virtual assistant services.",
    h2: "For US founders, SaaS teams, and remote-first businesses.",
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
    reviews: [
      "They matched the pace and expectations of our US growth team immediately.",
      "The SEO and paid media work drove pipeline we could actually track and close.",
      "Remote executive support that finally felt as reliable as having someone in the office.",
    ],
    formTitle: "Start your US project",
    formCopy: "Send the market, campaign target, or operations bottleneck. We will map the fastest route to a cleaner system.",
  },
  unitedKingdom: {
    city: "United Kingdom",
    variant: "united-kingdom",
    title: "UK Digital Marketing Agency, AI Automation & Virtual Assistant Services | LuliDigital",
    description:
      "LuliDigital serves UK founders and scale-ups with digital marketing, AI automation, SEO, paid media, and executive virtual assistant services.",
    h1: "UK digital marketing agency. AI automation. Virtual assistant services.",
    h2: "For UK founders, agencies, and scale-ups.",
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
    reviews: [
      "They understood the UK market and moved at agency pace without agency friction.",
      "The automation setup genuinely changed how our small team handles inbound.",
      "Executive support that was reliable from day one, no onboarding lag.",
    ],
    formTitle: "Start your UK project",
    formCopy: "Send your campaign priority, AI bottleneck, or operations challenge. We will map a direct route.",
  },
  denmark: {
    city: "Denmark",
    variant: "denmark",
    title: "Denmark Digital Marketing Agency, AI Automation & Virtual Assistant Services | LuliDigital",
    description:
      "LuliDigital serves Danish tech founders and Nordic businesses with digital marketing, AI automation, SEO, and executive virtual assistant services.",
    h1: "Denmark digital marketing agency. AI automation. Virtual assistant services.",
    h2: "For Danish tech founders, scale-ups, and Nordic businesses.",
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
    reviews: [
      "They matched the Nordic design and execution standard from the first deliverable.",
      "Clean, fast, and no agency theatre. That is exactly what we needed.",
      "The automation layer gave our team space to focus on product without losing operational control.",
    ],
    formTitle: "Start your Denmark project",
    formCopy: "Send the campaign target, AI challenge, or operations bottleneck. We will map a direct, practical route.",
  },
  switzerland: {
    city: "Switzerland",
    variant: "switzerland",
    title: "Switzerland Digital Marketing Agency, AI Automation & Virtual Assistant Services | LuliDigital",
    description:
      "LuliDigital serves Swiss enterprises and precision businesses with digital marketing, AI automation, SEO, and executive virtual assistant services.",
    h1: "Switzerland digital marketing agency. AI automation. Virtual assistant services.",
    h2: "For Swiss enterprises, precision businesses, and international teams.",
    eyebrow: "Switzerland Digital Studio",
    positioning:
      "A premium international studio serving Swiss enterprises and precision businesses with performance marketing, AI workflow automation, and executive virtual assistant services — built to European standard, delivered in English.",
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
        copy: "Paid media campaigns with enterprise-grade audience logic, brand compliance controls, and optimization systems built for Swiss market precision.",
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
    reviews: [
      "Precision, reliability, and no noise. Exactly what a Swiss business expects from a partner.",
      "The automation systems were built with the kind of accuracy our internal teams demanded.",
      "They understood our international market requirements and delivered without compromise.",
    ],
    formTitle: "Start your Switzerland project",
    formCopy: "Send the market priority, AI challenge, or operations need. We will respond with a focused, practical plan.",
  },
  ireland: {
    city: "Ireland",
    variant: "ireland",
    title: "Ireland Digital Marketing Agency, AI Automation & Virtual Assistant Services | LuliDigital",
    description:
      "LuliDigital serves Irish tech founders and EU-operating teams with digital marketing, AI automation, SEO, and executive virtual assistant services.",
    h1: "Ireland digital marketing agency. AI automation. Virtual assistant services.",
    h2: "For Irish tech founders, scale-ups, and EU-operating teams.",
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
    reviews: [
      "They understood the EU market requirements and delivered without friction.",
      "Fast, precise, and genuinely useful AI automation. No bloat.",
      "Executive support that matched the pace of our startup without slowing us down.",
    ],
    formTitle: "Start your Ireland project",
    formCopy: "Send the campaign target, AI challenge, or operations bottleneck. We will map the most direct route.",
  },
  belgium: {
    city: "Belgium",
    variant: "belgium",
    title: "Belgium Digital Marketing Agency, AI Automation & Virtual Assistant Services | LuliDigital",
    description:
      "LuliDigital serves Belgian businesses and EU-operating teams with digital marketing, AI automation, SEO, and executive virtual assistant services.",
    h1: "Belgium digital marketing agency. AI automation. Virtual assistant services.",
    h2: "For Belgian businesses, EU agencies, and international teams.",
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
    reviews: [
      "They understood the complexity of EU market positioning and delivered cleanly.",
      "The automation setup was precise and integrated without disrupting our existing workflow.",
      "Reliable, fast executive support that matched our team's pace from day one.",
    ],
    formTitle: "Start your Belgium project",
    formCopy: "Send the market priority, AI challenge, or operations bottleneck. We will map a direct, practical route.",
  },
  norway: {
    city: "Norway",
    variant: "norway",
    title: "Norway Digital Marketing Agency, AI Automation & Virtual Assistant Services | LuliDigital",
    description:
      "LuliDigital serves Norwegian enterprises and Nordic businesses with digital marketing, AI automation, SEO, and executive virtual assistant services.",
    h1: "Norway digital marketing agency. AI automation. Virtual assistant services.",
    h2: "For Norwegian enterprises, tech companies, and Nordic businesses.",
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
        copy: "Paid media campaigns with enterprise-grade audience logic and creative systems built for the Norwegian and Nordic commercial standard.",
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
    reviews: [
      "They matched the Norwegian execution standard and delivered without unnecessary back-and-forth.",
      "The AI automation genuinely simplified operations that had been manual for too long.",
      "A reliable partner that understood our market and moved with the right level of precision.",
    ],
    formTitle: "Start your Norway project",
    formCopy: "Send the campaign priority, AI challenge, or operations need. We will respond with a focused, practical plan.",
  },
};
