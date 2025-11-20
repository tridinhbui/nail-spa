/**
 * 🌐 Website Discovery Pipeline
 * Complete pipeline: Search → Filter → Classify → Verify
 */

import { multiQuerySearch } from "./braveClient";
import { classifyWebsite, selectBestUrl, isBlacklistedDomain } from "./domainClassifier";
import { sleepWithJitter } from "@/lib/utils/sleep";
import { fetchHtml } from "@/lib/utils/fetchHtml";

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

// Removed - now using lib/utils/fetchHtml.ts

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

    // Step 2: Get top 3 candidates (not just 1)
    const candidateUrls = searchResults
      .map((r) => r.url)
      .filter((url) => !isBlacklistedDomain(url))
      .slice(0, 3);

    if (candidateUrls.length === 0) {
      console.log(`   ❌ All candidates are blocked domains`);
      return {
        searchQuery: `${name} ${address}`,
        success: false,
        confidence: "low",
        score: 0,
        error: "ALL_BLOCKED",
      };
    }

    console.log(`   🎯 Testing ${candidateUrls.length} candidates...`);

    // Step 3: ULTRA STRICT - Fetch & classify ALL top 3 candidates
    for (let i = 0; i < candidateUrls.length; i++) {
      const candidateUrl = candidateUrls[i];
      console.log(`\n   [${i + 1}/${candidateUrls.length}] Testing: ${candidateUrl}`);

      // Check if blocked
      if (isBlacklistedDomain(candidateUrl)) {
        console.log(`   ⚠️  Blocked directory domain - skipping`);
        continue;
      }

      // Fetch HTML
      console.log(`   📥 Fetching HTML...`);
      const html = await fetchHtml(candidateUrl, { timeout: 10000 });

      if (!html) {
        console.log(`   ⚠️  Could not fetch HTML - skipping`);
        continue;
      }

      // Classify with STRICT validation
      console.log(`   🔍 Classifying website (STRICT)...`);
      const classification = await classifyWebsite(candidateUrl, html);

      // REJECT if score < 20 or not real
      if (!classification.isReal || classification.score < 20) {
        console.log(`   ❌ REJECTED: ${classification.reason}`);
        continue;
      }

      // ACCEPTED! This is a real business website
      console.log(`   ✅ ACCEPTED: Real business website`);

      // Find specialized pages
      const specialPages = findSpecializedPages(html, candidateUrl);
      const servicesPage = specialPages.services;
      const menuPage = specialPages.menu;

      if (servicesPage) {
        console.log(`   📄 Found services page: ${servicesPage}`);
      }
      if (menuPage) {
        console.log(`   📄 Found menu page: ${menuPage}`);
      }

      // Determine confidence based on score
      let confidence: "high" | "medium" | "low" = "medium";
      if (classification.score >= 40) {
        confidence = "high";
      } else if (classification.score >= 25) {
        confidence = "medium";
      } else {
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
    }

    // All candidates failed
    console.log(`   ❌ All candidates rejected (score < 20 or blocked)`);
    return {
      searchQuery: `${name} ${address}`,
      success: false,
      confidence: "low",
      score: 0,
      error: "ALL_CANDIDATES_REJECTED",
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

