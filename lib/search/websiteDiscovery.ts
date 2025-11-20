/**
 * 🌐 Website Discovery Pipeline
 * Complete pipeline: Search → Filter → Classify → Verify
 */

import { multiQuerySearch } from "./braveClient";
import { classifyWebsite, selectBestUrl } from "./domainClassifier";
import { sleepWithJitter } from "@/lib/utils/sleep";

export interface DiscoveredWebsite {
  homepage?: string;
  servicesPage?: string;
  menuPage?: string;
  searchQuery: string;
  success: boolean;
  confidence: "high" | "medium" | "low";
  score: number;
  error?: string;
}

/**
 * Fetch HTML content for classification
 */
async function fetchHtmlForClassification(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return html;
  } catch (error: any) {
    console.log(`   ⚠️  Failed to fetch HTML: ${error.message}`);
    return null;
  }
}

/**
 * Find services/menu pages from homepage
 */
function findSpecializedPages(
  html: string,
  baseUrl: string
): { services?: string; menu?: string } {
  const htmlLower = html.toLowerCase();
  const result: { services?: string; menu?: string } = {};

  // Look for services page links
  const servicesPatterns = [
    /href="([^"]*services[^"]*)"/i,
    /href="([^"]*pricing[^"]*)"/i,
    /href="([^"]*prices[^"]*)"/i,
  ];

  for (const pattern of servicesPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = new URL(match[1], baseUrl).href;
      result.services = url;
      break;
    }
  }

  // Look for menu page links
  const menuPatterns = [
    /href="([^"]*menu[^"]*)"/i,
    /href="([^"]*price-list[^"]*)"/i,
  ];

  for (const pattern of menuPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = new URL(match[1], baseUrl).href;
      result.menu = url;
      break;
    }
  }

  return result;
}

/**
 * Discover real business website for a competitor
 */
export async function discoverWebsite(
  name: string,
  address: string,
  phone?: string
): Promise<DiscoveredWebsite> {
  console.log(`\n🔍 Discovering website for: ${name}`);

  try {
    // Step 1: Multi-query search
    const searchResults = await multiQuerySearch(name, address);

    if (searchResults.length === 0) {
      console.log(`   ❌ No search results found`);
      return {
        searchQuery: `${name} ${address}`,
        success: false,
        confidence: "low",
        score: 0,
        error: "NO_RESULTS",
      };
    }

    // Step 2: Select best candidate URL
    const candidateUrl = selectBestUrl(
      searchResults.map((r) => r.url),
      name
    );

    if (!candidateUrl) {
      console.log(`   ❌ No valid candidate URLs`);
      return {
        searchQuery: `${name} ${address}`,
        success: false,
        confidence: "low",
        score: 0,
        error: "NO_VALID_CANDIDATES",
      };
    }

    console.log(`   🎯 Candidate URL: ${candidateUrl}`);

    // Step 3: Fetch HTML for classification
    console.log(`   📥 Fetching HTML for classification...`);
    const html = await fetchHtmlForClassification(candidateUrl);

    if (!html) {
      console.log(`   ⚠️  Could not fetch HTML, using domain-only classification`);
    }

    // Step 4: Classify website
    console.log(`   🔍 Classifying website...`);
    const classification = await classifyWebsite(candidateUrl, html || undefined);

    console.log(
      `   ${classification.isReal ? "✅" : "❌"} ${classification.reason} (score: ${classification.score})`
    );

    if (!classification.isReal) {
      return {
        searchQuery: `${name} ${address}`,
        success: false,
        confidence: "low",
        score: classification.score,
        error: "INVALID_DOMAIN",
      };
    }

    // Step 5: Find specialized pages (if we have HTML)
    let servicesPage: string | undefined;
    let menuPage: string | undefined;

    if (html) {
      const specialPages = findSpecializedPages(html, candidateUrl);
      servicesPage = specialPages.services;
      menuPage = specialPages.menu;

      if (servicesPage) {
        console.log(`   📄 Found services page: ${servicesPage}`);
      }
      if (menuPage) {
        console.log(`   📄 Found menu page: ${menuPage}`);
      }
    }

    // Step 6: Determine confidence
    let confidence: "high" | "medium" | "low" = "medium";
    if (classification.score >= 30) {
      confidence = "high";
    } else if (classification.score >= 15) {
      confidence = "medium";
    } else if (classification.score >= 10) {
      confidence = "low";
    }

    return {
      homepage: candidateUrl,
      servicesPage,
      menuPage,
      searchQuery: `${name} ${address}`,
      success: true,
      confidence,
      score: classification.score,
    };
  } catch (error: any) {
    console.error(`   ❌ Discovery failed: ${error.message}`);
    return {
      searchQuery: `${name} ${address}`,
      success: false,
      confidence: "low",
      score: 0,
      error: error.message || "DISCOVERY_FAILED",
    };
  }
}

/**
 * Batch discover websites for multiple competitors
 * Processes sequentially with delays to avoid rate limits
 */
export async function batchDiscoverWebsites(
  competitors: Array<{ name: string; address: string; phone?: string }>
): Promise<Map<string, DiscoveredWebsite>> {
  const results = new Map<string, DiscoveredWebsite>();

  console.log(`\n🚀 Batch discovering ${competitors.length} websites...`);

  for (let i = 0; i < competitors.length; i++) {
    const comp = competitors[i];

    console.log(`\n[${i + 1}/${competitors.length}] Processing: ${comp.name}`);

    try {
      const discovered = await discoverWebsite(
        comp.name,
        comp.address,
        comp.phone
      );

      results.set(comp.name, discovered);

      // Add delay between discoveries (2-3 seconds)
      if (i < competitors.length - 1) {
        await sleepWithJitter(2000, 1000); // 2s + 0-1s jitter
      }
    } catch (error: any) {
      console.error(`   ❌ Error processing ${comp.name}: ${error.message}`);

      results.set(comp.name, {
        searchQuery: `${comp.name} ${comp.address}`,
        success: false,
        confidence: "low",
        score: 0,
        error: error.message,
      });

      // Longer delay after error
      if (i < competitors.length - 1) {
        await sleepWithJitter(3000, 1000); // 3s + 0-1s jitter
      }
    }
  }

  console.log(`\n✅ Batch discovery complete: ${results.size} results`);

  return results;
}

