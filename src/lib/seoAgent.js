const ONE_DAY = 1000 * 60 * 60 * 24;
const CACHE_TTL = 1000 * 60 * 60 * 6;
const SITE_URL = "https://lulidigital.com";

const cachedRecommendations = new Map();

const fallbackKeywords = [
  "AI automation services",
  "digital marketing services for small business",
  "executive virtual assistant services",
  "AI workflow automation",
  "performance marketing agency",
  "custom AI chatbot development",
  "remote executive assistant",
  "SEO services for small business",
];

const regionalFallbackKeywords = {
  AFRICA: [
    "digital marketing agency for African startups",
    "AI automation for African companies",
    "virtual assistant services for African businesses",
    "performance marketing agency Africa",
    "SEO services for African companies",
    "remote executive assistant Africa",
    "digital marketing agency for international companies in Africa",
  ],
  ZA: [
    "digital marketing agency South Africa",
    "AI automation South Africa",
    "virtual assistant services South Africa",
    "performance marketing South Africa",
    "SEO services South Africa",
    "digital marketing agency Johannesburg",
  ],
  NL: [
    "digital marketing agency Amsterdam",
    "AI automation Amsterdam",
    "virtual assistant services Amsterdam",
    "performance marketing Amsterdam",
    "SEO services Amsterdam",
  ],
  DE: [
    "digital marketing agency Munich",
    "enterprise AI automation Munich",
    "virtual assistant Munich",
    "performance marketing Munich",
    "SEO services Munich",
  ],
  SE: [
    "digital marketing agency Stockholm",
    "AI automation Stockholm",
    "virtual assistant services Stockholm",
    "performance marketing Stockholm",
    "SEO services Stockholm",
  ],
};

const pageKeywordTargets = {
  "/": {
    page: "Home",
    primary: [
      "digital marketing and AI automation services",
      "digital operations studio",
      "marketing AI automation virtual assistant services",
      "business automation and marketing support",
    ],
    secondary: [
      "performance marketing",
      "executive virtual assistant services",
      "AI workflow automation",
      "brand strategy services",
    ],
  },
  "/marketing": {
    page: "Marketing",
    primary: [
      "digital marketing services",
      "performance marketing agency",
      "AI powered digital marketing",
      "SEO and paid media services",
    ],
    secondary: [
      "brand strategy services",
      "Google ads management",
      "Meta ads management",
      "content marketing services",
    ],
  },
  "/ai": {
    page: "AI Automation",
    primary: [
      "AI automation services",
      "AI workflow automation",
      "AI agent implementation",
      "business process automation",
    ],
    secondary: [
      "conversational AI assistant",
      "custom AI chatbot development",
      "AI integration services",
      "AI automation for business",
    ],
  },
  "/virtual-assistant": {
    page: "Virtual Assistant",
    primary: [
      "executive virtual assistant services",
      "remote executive assistant",
      "virtual assistant for founders",
      "AI executive assistant support",
    ],
    secondary: [
      "inbox management services",
      "calendar management services",
      "remote admin support",
      "operations support services",
    ],
  },
  "/africa": {
    page: "Africa",
    primary: regionalFallbackKeywords.AFRICA,
    secondary: [
      "international companies in Africa",
      "dollar earning African businesses",
      "African startups digital marketing",
      "AI automation for African businesses",
    ],
  },
  "/south-africa": {
    page: "South Africa",
    primary: regionalFallbackKeywords.ZA,
    secondary: [
      "digital marketing agency Johannesburg",
      "SEO services South Africa",
      "AI workflow automation South Africa",
      "virtual assistant services South Africa",
    ],
  },
  "/amsterdam": {
    page: "Amsterdam",
    primary: regionalFallbackKeywords.NL,
    secondary: [
      "Amsterdam performance marketing",
      "AI automation for Amsterdam startups",
      "English digital marketing agency Amsterdam",
      "virtual assistant services Amsterdam",
    ],
  },
  "/munich": {
    page: "Munich",
    primary: regionalFallbackKeywords.DE,
    secondary: [
      "Munich performance marketing",
      "enterprise AI automation Germany",
      "English digital marketing agency Munich",
      "B2B marketing Munich",
    ],
  },
  "/stockholm": {
    page: "Stockholm",
    primary: regionalFallbackKeywords.SE,
    secondary: [
      "Stockholm performance marketing",
      "AI automation for Nordic startups",
      "English digital marketing agency Stockholm",
      "virtual assistant services Stockholm",
    ],
  },
};

const serviceSignals = [
  "ai",
  "digital",
  "automation",
  "assistant",
  "virtual assistant",
  "marketing",
  "seo",
  "business",
  "companies",
  "international",
  "global",
  "remote",
  "small business",
  "startup",
  "founder",
  "workflow",
  "chatbot",
  "google ads",
  "meta ads",
  "content",
  "brand",
  "productivity",
  "amsterdam",
  "munich",
  "stockholm",
  "south africa",
  "johannesburg",
  "cape town",
  "africa",
  "nigeria",
  "kenya",
  "ghana",
  "lagos",
  "nairobi",
  "accra",
];

const decodeXml = (value) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

const textBetween = (xml, tag) => {
  const escapedTag = tag.replace(":", "\\:");
  const match = xml.match(new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
};

const parseTraffic = (value) => {
  const normalized = value.toLowerCase().replace(/,/g, "").trim();
  const match = normalized.match(/([\d.]+)\s*([km])?/);

  if (!match) {
    return 0;
  }

  const amount = Number.parseFloat(match[1]);
  const multiplier = match[2] === "m" ? 1_000_000 : match[2] === "k" ? 1_000 : 1;

  return Math.round(amount * multiplier);
};

const parseGoogleTrendsRss = (xml, geo) => {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  return items
    .map((item) => {
      const title = textBetween(item, "title");
      const traffic = parseTraffic(textBetween(item, "ht:approx_traffic"));
      const publishedAt = textBetween(item, "pubDate");

      return {
        keyword: title,
        traffic,
        source: `Google Trends RSS (${geo})`,
        publishedAt,
      };
    })
    .filter((item) => item.keyword);
};

const relevanceScore = (keyword) => {
  const normalized = keyword.toLowerCase();

  return serviceSignals.reduce((score, signal) => {
    if (signal === "ai") {
      return /\bai\b/i.test(keyword) ? score + 1 : score;
    }

    return normalized.includes(signal) ? score + 1 : score;
  }, 0);
};

const fallbackForToday = (date = new Date(), geo = "ZA") => {
  const keywords = regionalFallbackKeywords[geo] ?? fallbackKeywords;
  const dayIndex = Math.floor(date.getTime() / ONE_DAY);
  return keywords[dayIndex % keywords.length];
};

const weekIndexFor = (date = new Date()) => Math.floor(date.getTime() / (ONE_DAY * 7));

const normalizePath = (path = "/") => {
  const cleanPath = path.split("?")[0].split("#")[0] || "/";
  return cleanPath === "/" ? "/" : cleanPath.replace(/\/+$/, "");
};

const isoDate = (date) => date.toISOString().slice(0, 10);

const dateDaysAgo = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
};

const urlToPath = (url) => {
  try {
    return normalizePath(new URL(url).pathname);
  } catch {
    return normalizePath(url);
  }
};

const isBrandedQuery = (query) => /\b(luli|lulidigital|luli digital)\b/i.test(query);

const getGoogleAccessToken = async ({ refreshToken }) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth credentials");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || `Google OAuth token request failed with ${response.status}`);
  }

  return data.access_token;
};

const searchConsoleProperty = () =>
  process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY || process.env.GSC_PROPERTY || process.env.SEARCH_CONSOLE_PROPERTY;

const searchConsoleRefreshToken = () =>
  process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN || process.env.GSC_REFRESH_TOKEN;

const querySearchConsole = async ({ dimensions = ["page", "query"], days = 28, rowLimit = 2500 } = {}) => {
  const property = searchConsoleProperty();
  const refreshToken = searchConsoleRefreshToken();

  if (!property || !refreshToken) {
    return {
      configured: false,
      rows: [],
      property,
      source: "Search Console not configured",
    };
  }

  const accessToken = await getGoogleAccessToken({ refreshToken });
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: isoDate(dateDaysAgo(days + 3)),
      endDate: isoDate(dateDaysAgo(3)),
      dimensions,
      rowLimit,
      startRow: 0,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Search Console query failed with ${response.status}`);
  }

  return {
    configured: true,
    rows: data.rows ?? [],
    property,
    source: "Google Search Console",
  };
};

const chooseKeyword = (trends, now = new Date(), geo = "ZA") => {
  const rankedTrends = trends
    .map((trend) => ({
      ...trend,
      relevance: relevanceScore(trend.keyword),
    }))
    .filter((trend) => trend.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || b.traffic - a.traffic);

  if (rankedTrends[0]) {
    return {
      keyword: rankedTrends[0].keyword,
      source: rankedTrends[0].source,
      trend: {
        keyword: rankedTrends[0].keyword,
        traffic: rankedTrends[0].traffic,
      },
    };
  }

  return {
    keyword: fallbackForToday(now, geo),
    source: trends.length > 0 ? "LuliDigital fallback rotation after Google Trends scan" : "LuliDigital fallback rotation",
  };
};

const buildRecommendation = (keyword, source, geo, trend) => ({
  keyword,
  title: `${keyword} | LuliDigital`,
  description: `LuliDigital helps founders turn ${keyword} into practical marketing, AI automation, and virtual assistant systems.`,
  source,
  geo,
  updatedAt: new Date().toISOString(),
  trend,
});

export const inferSeoCategory = (keyword) => {
  const normalized = keyword.toLowerCase();

  if (normalized.includes("assistant") || normalized.includes("admin") || normalized.includes("delegate")) {
    return "Virtual Assistant";
  }

  if (normalized.includes("marketing") || normalized.includes("seo") || normalized.includes("ads") || normalized.includes("brand") || normalized.includes("content")) {
    return "Digital Marketing";
  }

  return "AI Automation";
};

export const getWeeklyPageSeoTarget = (path = "/", date = new Date()) => {
  const normalizedPath = normalizePath(path);
  const config = pageKeywordTargets[normalizedPath] ?? pageKeywordTargets["/"];
  const weekIndex = weekIndexFor(date);
  const primaryKeyword = config.primary[weekIndex % config.primary.length];
  const secondaryKeywords = config.secondary
    .slice(weekIndex % config.secondary.length)
    .concat(config.secondary.slice(0, weekIndex % config.secondary.length))
    .slice(0, 4);

  return {
    path: normalizedPath,
    page: config.page,
    primaryKeyword,
    secondaryKeywords,
    keywords: [primaryKeyword, ...secondaryKeywords],
    source: "LuliDigital weekly page keyword rotation",
    week: weekIndex,
    updatedAt: date.toISOString(),
  };
};

export const getWeeklyPageSeoPlan = (date = new Date()) =>
  Object.keys(pageKeywordTargets).map((path) => getWeeklyPageSeoTarget(path, date));

const buildSearchConsoleOpportunityMap = (rows = []) => {
  const opportunities = new Map();

  rows.forEach((row) => {
    const [pageUrl, query] = row.keys ?? [];
    const normalizedQuery = String(query ?? "").trim();
    const path = urlToPath(String(pageUrl ?? SITE_URL));

    if (!pageKeywordTargets[path] || !normalizedQuery || isBrandedQuery(normalizedQuery)) {
      return;
    }

    const impressions = row.impressions ?? 0;
    const clicks = row.clicks ?? 0;
    const ctr = row.ctr ?? 0;
    const position = row.position ?? 100;
    const relevance = relevanceScore(normalizedQuery);

    if (impressions < 3 || relevance === 0) {
      return;
    }

    const opportunityScore =
      impressions * Math.max(1, 24 - Math.min(position, 24)) * (1 - Math.min(ctr, 0.9)) * (relevance + 1);

    const candidate = {
      query: normalizedQuery,
      clicks,
      impressions,
      ctr,
      position,
      relevance,
      opportunityScore,
    };

    const pageOpportunities = opportunities.get(path) ?? [];
    pageOpportunities.push(candidate);
    opportunities.set(path, pageOpportunities);
  });

  return opportunities;
};

const mergeSearchConsoleTargets = (fallbackPlan, rows = [], source = "Google Search Console") => {
  const opportunities = buildSearchConsoleOpportunityMap(rows);

  return fallbackPlan.map((target) => {
    const pageOpportunities = (opportunities.get(target.path) ?? [])
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 5);

    if (pageOpportunities.length === 0) {
      return target;
    }

    const primaryKeyword = pageOpportunities[0].query;
    const secondaryKeywords = [
      ...pageOpportunities.slice(1).map((opportunity) => opportunity.query),
      ...target.secondaryKeywords,
    ]
      .filter((keyword, index, list) => list.indexOf(keyword) === index)
      .slice(0, 4);

    return {
      ...target,
      primaryKeyword,
      secondaryKeywords,
      keywords: [primaryKeyword, ...secondaryKeywords],
      source,
      searchConsole: {
        property: searchConsoleProperty(),
        topOpportunities: pageOpportunities,
      },
    };
  });
};

export const getSearchConsolePerformance = async ({ days = 28 } = {}) => {
  const result = await querySearchConsole({ days });

  return {
    ...result,
    rows: result.rows.map((row) => {
      const [page, query] = row.keys ?? [];

      return {
        page,
        path: urlToPath(page ?? SITE_URL),
        query,
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      };
    }),
  };
};

export const getSearchConsolePageSeoPlan = async ({ date = new Date(), days = 28 } = {}) => {
  const fallbackPlan = getWeeklyPageSeoPlan(date);

  try {
    const performance = await querySearchConsole({ days });

    if (!performance.configured) {
      return {
        source: performance.source,
        configured: false,
        property: performance.property,
        plan: fallbackPlan,
      };
    }

    return {
      source: performance.source,
      configured: true,
      property: performance.property,
      plan: mergeSearchConsoleTargets(fallbackPlan, performance.rows, performance.source),
    };
  } catch (error) {
    console.error("Search Console SEO plan failed:", error);

    return {
      source: "LuliDigital weekly page keyword rotation",
      configured: Boolean(searchConsoleProperty() && searchConsoleRefreshToken()),
      property: searchConsoleProperty(),
      error: error.message,
      plan: fallbackPlan,
    };
  }
};

export const getDailySeoRecommendation = async ({ forceRefresh = false, geo, market } = {}) => {
  const selectedGeo = geo || process.env.SEO_AGENT_GEO || "ZA";
  const cacheKey = `${selectedGeo}:${market ?? "general"}`;

  if (!forceRefresh) {
    const cachedRecommendation = cachedRecommendations.get(cacheKey);

    if (cachedRecommendation && cachedRecommendation.expiresAt > Date.now()) {
      return cachedRecommendation.value;
    }
  }

  if (selectedGeo === "AFRICA") {
    const keyword = fallbackForToday(new Date(), selectedGeo);
    const recommendation = buildRecommendation(keyword, "LuliDigital Africa keyword rotation", selectedGeo);

    cachedRecommendations.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL,
      value: recommendation,
    });

    return recommendation;
  }

  try {
    const response = await fetch(`https://trends.google.com/trending/rss?geo=${encodeURIComponent(selectedGeo)}`, {
      headers: {
        "User-Agent": "LuliDigital SEO Agent/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Google Trends responded with ${response.status}`);
    }

    const xml = await response.text();
    const trends = parseGoogleTrendsRss(xml, selectedGeo);
    const selected = chooseKeyword(trends, new Date(), selectedGeo);
    const recommendation = buildRecommendation(selected.keyword, selected.source, selectedGeo, selected.trend);

    cachedRecommendations.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL,
      value: recommendation,
    });

    return recommendation;
  } catch (error) {
    console.error("SEO agent keyword research failed:", error);

    const keyword = fallbackForToday(new Date(), selectedGeo);
    const recommendation = buildRecommendation(keyword, "LuliDigital fallback rotation", selectedGeo);

    cachedRecommendations.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL,
      value: recommendation,
    });

    return recommendation;
  }
};

export const getBestRegionalSeoRecommendation = async ({
  geos = process.env.BLOG_SEO_AGENT_GEOS || "NL,DE,SE,ZA",
  forceRefresh = false,
} = {}) => {
  const geoList = String(geos)
    .split(",")
    .map((geo) => geo.trim().toUpperCase())
    .filter(Boolean);

  const recommendations = await Promise.all(
    geoList.map((geo) => getDailySeoRecommendation({ geo, forceRefresh })),
  );

  const recommendationWithTrend = recommendations
    .filter((recommendation) => recommendation.trend)
    .sort((a, b) => b.trend.traffic - a.trend.traffic)[0];

  if (recommendationWithTrend) {
    return recommendationWithTrend;
  }

  const dayIndex = Math.floor(Date.now() / ONE_DAY);
  return recommendations[dayIndex % recommendations.length];
};
