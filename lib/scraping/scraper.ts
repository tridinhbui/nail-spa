/**
 * 🤖 Smart Scraper with Fallback
 * Only scrapes real custom domains, skips directories/social media
 */

import { isBlacklistedDomain } from "@/lib/search/domainClassifier";
import { batchScrapeWithCheerio } from "./cheerio-scraper";

export interface ScraperResult {
  success: boolean;
  gel?: number;
  pedicure?: number;
  acrylic?: number;
  services?: Array<{ name: string; price: number }>;
  source: "scraped" | "estimated" | "skipped";
  reason?: string;
}

/**
 * Smart scrape decision: Only scrape custom domains
 */
export function shouldScrape(url: string): {
  shouldScrape: boolean;
  reason: string;
} {
  if (!url || url === "#") {
    return {
      shouldScrape: false,
      reason: "No URL provided",
    };
  }

  if (isBlacklistedDomain(url)) {
    return {
      shouldScrape: false,
      reason: "Blacklisted domain (directory/social media)",
    };
  }

  return {
    shouldScrape: true,
    reason: "Custom domain detected",
  };
}

/**
 * Scrape a single website (with smart filtering)
 */
export async function smartScrape(
  name: string,
  url: string
): Promise<ScraperResult> {
  // Check if we should scrape
  const decision = shouldScrape(url);

  if (!decision.shouldScrape) {
    console.log(`⏭️  Skipping scrape for ${name}: ${decision.reason}`);
    return {
      success: false,
      source: "skipped",
      reason: decision.reason,
    };
  }

  // Scrape with Cheerio
  console.log(`🌐 Scraping ${name}: ${url}`);

  try {
    const scrapedData = await batchScrapeWithCheerio(
      [{ name, website: url }],
      1
    );

    const result = scrapedData.get(name);

    if (result && result.success) {
      console.log(`✅ Successfully scraped ${name}`);
      return {
        success: true,
        gel: result.gel,
        pedicure: result.pedicure,
        acrylic: result.acrylic,
        services: result.services,
        source: "scraped",
      };
    }

    console.log(`⚠️  Scraping failed for ${name}, will use estimation`);
    return {
      success: false,
      source: "estimated",
      reason: "Scraping failed - content not extractable",
    };
  } catch (error: any) {
    console.error(`❌ Scraping error for ${name}: ${error.message}`);
    return {
      success: false,
      source: "estimated",
      reason: `Scraping error: ${error.message}`,
    };
  }
}

/**
 * Batch scrape with smart filtering
 */
export async function batchSmartScrape(
  targets: Array<{ name: string; website: string }>
): Promise<Map<string, ScraperResult>> {
  const results = new Map<string, ScraperResult>();

  // Filter targets: only scrape custom domains
  const scrapableTargets = targets.filter((target) =>
    shouldScrape(target.website).shouldScrape
  );

  const skippedTargets = targets.filter(
    (target) => !shouldScrape(target.website).shouldScrape
  );

  console.log(
    `\n🤖 Smart Scraper: ${scrapableTargets.length} scrapable, ${skippedTargets.length} skipped`
  );

  // Mark skipped targets
  for (const target of skippedTargets) {
    const decision = shouldScrape(target.website);
    console.log(`⏭️  ${target.name}: ${decision.reason}`);

    results.set(target.name, {
      success: false,
      source: "skipped",
      reason: decision.reason,
    });
  }

  // Scrape valid targets
  if (scrapableTargets.length > 0) {
    try {
      const scrapedData = await batchScrapeWithCheerio(scrapableTargets, 2);

      for (const target of scrapableTargets) {
        const result = scrapedData.get(target.name);

        if (result && result.success) {
          results.set(target.name, {
            success: true,
            gel: result.gel,
            pedicure: result.pedicure,
            acrylic: result.acrylic,
            services: result.services,
            source: "scraped",
          });
        } else {
          results.set(target.name, {
            success: false,
            source: "estimated",
            reason: "Content not extractable",
          });
        }
      }
    } catch (error: any) {
      console.error(`❌ Batch scraping error: ${error.message}`);

      // Mark all as failed
      for (const target of scrapableTargets) {
        if (!results.has(target.name)) {
          results.set(target.name, {
            success: false,
            source: "estimated",
            reason: `Scraping error: ${error.message}`,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Puppeteer hook (stub for future implementation)
 * This would run on a separate server, not on Vercel
 */
export async function scrapWithPuppeteer(
  url: string
): Promise<ScraperResult> {
  // Stub implementation
  console.log(
    `🎭 Puppeteer scraping not available (requires separate server)`
  );

  return {
    success: false,
    source: "estimated",
    reason: "Puppeteer not available on serverless",
  };
}

/**
 * Estimate prices based on price tier
 */
export function estimatePrices(priceLevel: number): {
  gel: number;
  pedicure: number;
  acrylic: number;
} {
  const estimates: Record<
    number,
    { gel: number; pedicure: number; acrylic: number }
  > = {
    1: { gel: 30, pedicure: 35, acrylic: 45 },
    2: { gel: 40, pedicure: 45, acrylic: 55 },
    3: { gel: 50, pedicure: 60, acrylic: 70 },
    4: { gel: 65, pedicure: 80, acrylic: 90 },
  };

  return estimates[priceLevel] || estimates[2];
}

