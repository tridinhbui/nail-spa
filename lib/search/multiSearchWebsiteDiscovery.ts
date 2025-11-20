/**
 * 🔍 Multi-Search Website Discovery Engine
 * Uses Brave + DuckDuckGo to find real business websites
 */

import { retryWithExponentialBackoff } from "@/lib/utils/retry";
import { sleepWithJitter } from "@/lib/utils/sleep";

interface SearchCandidate {
  url: string;
  title: string;
  snippet: string;
  source: "brave" | "duckduckgo";
  rank: number;
}

interface WebsiteDiscoveryResult {
  candidates: SearchCandidate[];
  bestCandidate: string | null;
  success: boolean;
  queries: string[];
}

/**
 * Search using Brave API
 */
async function searchBrave(query: string): Promise<SearchCandidate[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    console.log("   ⚠️  Brave API key not configured");
    return [];
  }

  try {
    const response = await retryWithExponentialBackoff(
      async () => {
        const res = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
          {
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip",
              "X-Subscription-Token": apiKey,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Brave API error: ${res.status}`);
        }

        return res;
      },
      3,
      300
    );

    const data = await response.json();

    if (!data.web || !data.web.results) {
      return [];
    }

    return data.web.results.map((result: any, index: number) => ({
      url: result.url,
      title: result.title,
      snippet: result.description || "",
      source: "brave" as const,
      rank: index + 1,
    }));
  } catch (error: any) {
    console.log(`   ❌ Brave search failed: ${error.message}`);
    return [];
  }
}

/**
 * Search using DuckDuckGo (HTML scraping - no API key needed)
 */
async function searchDuckDuckGo(query: string): Promise<SearchCandidate[]> {
  try {
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DuckDuckGo error: ${response.status}`);
    }

    const html = await response.text();

    // Simple regex to extract URLs and titles (not using Cheerio to keep it lightweight)
    const results: SearchCandidate[] = [];
    const linkPattern =
      /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    let match;
    let rank = 1;

    while ((match = linkPattern.exec(html)) !== null && rank <= 5) {
      const url = match[1];
      const title = match[2];

      // Decode DuckDuckGo redirect URLs
      const decodedUrl = url.startsWith("//duckduckgo.com/l/")
        ? decodeURIComponent(url.split("uddg=")[1]?.split("&")[0] || url)
        : url;

      if (decodedUrl && !decodedUrl.includes("duckduckgo.com")) {
        results.push({
          url: decodedUrl,
          title: title,
          snippet: "",
          source: "duckduckgo" as const,
          rank: rank++,
        });
      }
    }

    return results;
  } catch (error: any) {
    console.log(`   ❌ DuckDuckGo search failed: ${error.message}`);
    return [];
  }
}

/**
 * Multi-query multi-source website discovery
 */
export async function discoverWebsiteMultiSearch(
  name: string,
  address: string,
  city?: string
): Promise<WebsiteDiscoveryResult> {
  console.log(`\n🔍 Multi-Search Discovery: ${name}`);

  // Build multiple search queries
  const queries: string[] = [
    `${name} ${address} official website`,
    `${name} ${city || address.split(",")[1]?.trim() || ""} website`,
    `${name} nail salon official site`,
  ].filter((q) => q.trim().length > 0);

  console.log(`   📋 Running ${queries.length} queries across Brave + DuckDuckGo...`);

  const allCandidates: SearchCandidate[] = [];

  // Search each query on both engines
  for (const query of queries) {
    console.log(`   🔎 Query: "${query}"`);

    // Brave search
    const braveResults = await searchBrave(query);
    console.log(`      Brave: ${braveResults.length} results`);
    allCandidates.push(...braveResults);

    // Small delay between searches
    await sleepWithJitter(500, 200);

    // DuckDuckGo search
    const ddgResults = await searchDuckDuckGo(query);
    console.log(`      DuckDuckGo: ${ddgResults.length} results`);
    allCandidates.push(...ddgResults);

    // Delay between queries
    await sleepWithJitter(1000, 300);
  }

  if (allCandidates.length === 0) {
    console.log(`   ❌ No candidates found`);
    return {
      candidates: [],
      bestCandidate: null,
      success: false,
      queries,
    };
  }

  // Deduplicate by URL
  const uniqueCandidates = Array.from(
    new Map(allCandidates.map((c) => [c.url, c])).values()
  );

  // Filter out obvious non-business sites
  const blacklistedDomains = [
    "facebook.com",
    "instagram.com",
    "yelp.com",
    "yellowpages.com",
    "mapquest.com",
    "foursquare.com",
    "booksy.com",
    "styleseat.com",
    "google.com",
    "youtube.com",
  ];

  const filteredCandidates = uniqueCandidates.filter((c) => {
    const urlLower = c.url.toLowerCase();
    return !blacklistedDomains.some((domain) => urlLower.includes(domain));
  });

  console.log(
    `   ✅ Found ${filteredCandidates.length} unique candidates (after filtering)`
  );

  // Log top 5 candidates
  const top5 = filteredCandidates.slice(0, 5);
  top5.forEach((candidate, i) => {
    console.log(
      `      ${i + 1}. [${candidate.source}] ${candidate.url} - "${candidate.title}"`
    );
  });

  // Select best candidate (first non-blacklisted result from Brave, or first overall)
  const bestCandidate =
    filteredCandidates.find((c) => c.source === "brave")?.url ||
    filteredCandidates[0]?.url ||
    null;

  if (bestCandidate) {
    console.log(`   🎯 Best candidate: ${bestCandidate}`);
  }

  return {
    candidates: top5,
    bestCandidate,
    success: bestCandidate !== null,
    queries,
  };
}

/**
 * Batch discover websites for multiple businesses
 */
export async function batchDiscoverWebsites(
  businesses: Array<{ name: string; address: string; city?: string }>
): Promise<Map<string, WebsiteDiscoveryResult>> {
  const results = new Map<string, WebsiteDiscoveryResult>();

  console.log(
    `\n🔍 Multi-Search Batch Discovery: ${businesses.length} businesses`
  );

  for (const business of businesses) {
    const result = await discoverWebsiteMultiSearch(
      business.name,
      business.address,
      business.city
    );

    results.set(business.name, result);

    // Delay between businesses to avoid rate limits
    await sleepWithJitter(2000, 500);
  }

  return results;
}

