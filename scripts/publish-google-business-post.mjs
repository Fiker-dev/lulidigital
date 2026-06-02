const requiredEnv = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_ACCOUNT_ID",
  "GOOGLE_LOCATION_ID",
];

const missing = requiredEnv.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.log(`Skipping Google Business Profile post. Missing secrets: ${missing.join(", ")}`);
  process.exit(0);
}

const [title, description, slug] = process.argv.slice(2);

if (!title || !slug) {
  console.error("Usage: node scripts/publish-google-business-post.mjs <title> <description> <slug>");
  process.exit(1);
}

const SITE_URL = "https://lulidigital.com";
const articleUrl = `${SITE_URL}/blog/${slug}`;

function trimSummary(value) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > 1450 ? `${text.slice(0, 1447).trim()}...` : text;
}

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Google OAuth token refresh failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  return data.access_token;
}

async function createLocalPost(accessToken) {
  const accountId = process.env.GOOGLE_ACCOUNT_ID.replace(/^accounts\//, "");
  const locationId = process.env.GOOGLE_LOCATION_ID.replace(/^locations\//, "");
  const endpoint = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`;

  const summary = trimSummary(`New from LuliDigital: ${title}. ${description || ""}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      languageCode: "en",
      summary,
      topicType: "STANDARD",
      callToAction: {
        actionType: "LEARN_MORE",
        url: articleUrl,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || "";
    const status = data?.error?.status || "";

    if (response.status === 429 || status === "RESOURCE_EXHAUSTED" || message.includes("Quota exceeded")) {
      console.log("Google Business Profile API quota is not approved yet. Skipping LocalPost for now.");
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
    }

    console.error("Google Business Profile LocalPost failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(`Google Business Profile post created: ${data.name || articleUrl}`);
}

const accessToken = await getAccessToken();
await createLocalPost(accessToken);
