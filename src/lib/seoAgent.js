const ONE_DAY = 1000 * 60 * 60 * 24;
const CACHE_TTL = 1000 * 60 * 60 * 6;

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
