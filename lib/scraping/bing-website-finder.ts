/**
 * 🔍 Bing Web Search API Integration
 * Finds real business websites when Google Places only returns social media
 */

interface BingSearchResult {
  name: string;
  url: string;
  snippet: string;
  displayUrl: string;
}

interface BingApiResponse {
  webPages?: {
    value: BingSearchResult[];
  };
}

export interface DiscoveredWebsite {
  homepage?: string;
  servicesPage?: string;
  menuPage?: string;
  searchQuery: string;
  success: boolean;
  error?: string;
}

/**
 * Search for a business's real website using Bing Search API
 * @param name Business name
 * @param address Business address
 * @param phone Optional phone for better accuracy
 */
export async function findRealWebsite(
  name: string,
  address: string,
  phone?: string
): Promise<DiscoveredWebsite> {
  const apiKey = process.env.BING_SEARCH_API_KEY;

  if (!apiKey) {
    console.warn("⚠️  Bing Search API key not configured");
    return {
      searchQuery: "",
      success: false,
      error: "BING_API_KEY_MISSING",
    };
  }

  // Construct search query
  const searchQuery = `${name} ${address} nail salon website`;

  try {
    console.log(`🔍 Bing Search: "${searchQuery}"`);

    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(searchQuery)}&count=10&mkt=en-US`,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Bing API error: ${response.status} ${response.statusText}`);
      return {
        searchQuery,
        success: false,
        error: `BING_API_ERROR_${response.status}`,
      };
    }

    const data: BingApiResponse = await response.json();

    if (!data.webPages || data.webPages.value.length === 0) {
      console.log(`⚠️  No results found for: ${name}`);
      return {
        searchQuery,
        success: false,
        error: "NO_RESULTS",
      };
    }

    // Filter out social media and aggregators from results
    const validResults = data.webPages.value.filter((result) => {
      const url = result.url.toLowerCase();
      return (
        !url.includes("facebook.com") &&
        !url.includes("instagram.com") &&
        !url.includes("linktr.ee") &&
        !url.includes("yelp.com") &&
        !url.includes("google.com") &&
        !url.includes("yellowpages.com")
      );
    });

    if (validResults.length === 0) {
      console.log(`⚠️  No valid websites found for: ${name}`);
      return {
        searchQuery,
        success: false,
        error: "NO_VALID_RESULTS",
      };
    }

    // Extract homepage (first valid result)
    const homepage = validResults[0].url;

    // Try to find services/menu pages
    const servicesPage = findPageByKeywords(validResults, [
      "services",
      "price",
      "pricing",
      "menu",
    ]);
    const menuPage = findPageByKeywords(validResults, [
      "menu",
      "price-list",
      "services",
    ]);

    console.log(`✅ Found website for ${name}: ${homepage}`);
    if (servicesPage) console.log(`   → Services: ${servicesPage}`);
    if (menuPage) console.log(`   → Menu: ${menuPage}`);

    return {
      homepage,
      servicesPage: servicesPage || undefined,
      menuPage: menuPage || undefined,
      searchQuery,
      success: true,
    };
  } catch (error: any) {
    console.error(`❌ Bing search error for ${name}:`, error.message);
    return {
      searchQuery,
      success: false,
      error: error.message || "SEARCH_FAILED",
    };
  }
}

/**
 * Find a page URL that matches certain keywords
 */
function findPageByKeywords(
  results: BingSearchResult[],
  keywords: string[]
): string | null {
  for (const result of results) {
    const urlLower = result.url.toLowerCase();
    const snippetLower = result.snippet.toLowerCase();

    for (const keyword of keywords) {
      if (urlLower.includes(keyword) || snippetLower.includes(keyword)) {
        return result.url;
      }
    }
  }
  return null;
}

/**
 * Batch find websites for multiple competitors
 * @param competitors Array of competitors with name and address
 * @param concurrency Number of simultaneous requests (default: 2)
 */
export async function batchFindWebsites(
  competitors: Array<{ name: string; address: string; phone?: string }>,
  concurrency: number = 2
): Promise<Map<string, DiscoveredWebsite>> {
  const results = new Map<string, DiscoveredWebsite>();

  // Process in batches to avoid rate limits
  for (let i = 0; i < competitors.length; i += concurrency) {
    const batch = competitors.slice(i, i + concurrency);

    const batchPromises = batch.map((comp) =>
      findRealWebsite(comp.name, comp.address, comp.phone)
    );

    const batchResults = await Promise.all(batchPromises);

    // Store results
    batch.forEach((comp, index) => {
      results.set(comp.name, batchResults[index]);
    });

    // Small delay between batches to be nice to Bing API
    if (i + concurrency < competitors.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

