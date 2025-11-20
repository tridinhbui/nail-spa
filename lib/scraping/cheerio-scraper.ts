/**
 * Lightweight scraper using Cheerio (no browser needed)
 * Works on Vercel and local environments
 */

import * as cheerio from "cheerio";
import https from "https";
import http from "http";

export interface ScrapedService {
  name: string;
  price: number;
  priceRange?: string;
}

export interface ScrapeResult {
  success: boolean;
  services: ScrapedService[];
  gel?: number;
  pedicure?: number;
  acrylic?: number;
  source: string;
  confidence: number;
}

/**
 * Fetch HTML content
 */
async function fetchHTML(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    
    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Extract prices from text
 */
function extractPrices(text: string): number[] {
  const prices: number[] = [];
  
  // Match patterns like $25, $25.00, 25$, etc.
  const patterns = [
    /\$\s*(\d+(?:\.\d{2})?)/g,
    /(\d+(?:\.\d{2})?)\s*\$/g,
    /USD\s*(\d+(?:\.\d{2})?)/gi,
  ];

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const price = parseFloat(match[1]);
      if (price >= 10 && price <= 500) { // Reasonable nail service range
        prices.push(price);
      }
    }
  });

  return prices;
}

/**
 * Categorize service by name
 */
function categorizeService(name: string): string | null {
  const lower = name.toLowerCase();
  
  if (lower.includes('gel') && (lower.includes('mani') || lower.includes('manicure'))) {
    return 'gel';
  }
  if (lower.includes('pedicure') || lower.includes('pedi')) {
    return 'pedicure';
  }
  if (lower.includes('acrylic') || lower.includes('full set')) {
    return 'acrylic';
  }
  if (lower.includes('dip') || lower.includes('powder')) {
    return 'dip';
  }
  
  return null;
}

/**
 * Parse services from HTML
 */
function parseServices(html: string): ScrapedService[] {
  const $ = cheerio.load(html);
  const services: ScrapedService[] = [];
  
  // Strategy 1: Look for table rows
  $('table tr, .service-item, .price-item, .menu-item').each((_, elem) => {
    const $elem = $(elem);
    const text = $elem.text();
    
    const prices = extractPrices(text);
    if (prices.length > 0) {
      const serviceName = text
        .replace(/\$\d+/g, '')
        .replace(/\d+\$/g, '')
        .trim()
        .slice(0, 100);
      
      if (serviceName.length > 3) {
        services.push({
          name: serviceName,
          price: prices[0],
        });
      }
    }
  });

  // Strategy 2: Look for price lists
  $('ul li, ol li, div.service, div.price').each((_, elem) => {
    const $elem = $(elem);
    const text = $elem.text();
    
    const prices = extractPrices(text);
    if (prices.length > 0) {
      const serviceName = text
        .replace(/\$\d+/g, '')
        .replace(/\d+\$/g, '')
        .trim()
        .slice(0, 100);
      
      if (serviceName.length > 3 && !services.some(s => s.name === serviceName)) {
        services.push({
          name: serviceName,
          price: prices[0],
        });
      }
    }
  });

  // Strategy 3: Look for any element with price-related classes
  $('.price, .cost, .pricing, [class*="price"], [class*="cost"]').each((_, elem) => {
    const $elem = $(elem);
    const text = $elem.text();
    const prices = extractPrices(text);
    
    if (prices.length > 0) {
      // Try to find service name in parent or sibling
      const $parent = $elem.parent();
      const serviceName = $parent.text()
        .replace(text, '')
        .replace(/\$\d+/g, '')
        .trim()
        .slice(0, 100);
      
      if (serviceName.length > 3 && !services.some(s => s.name === serviceName)) {
        services.push({
          name: serviceName,
          price: prices[0],
        });
      }
    }
  });

  return services;
}

/**
 * Main scraping function
 */
export async function scrapeWithCheerio(
  url: string,
  competitorName: string
): Promise<ScrapeResult> {
  console.log(`\n🌐 Cheerio Scraper: ${competitorName}`);
  console.log(`   URL: ${url}`);

  const result: ScrapeResult = {
    success: false,
    services: [],
    source: url,
    confidence: 0,
  };

  try {
    // Fetch HTML
    const html = await fetchHTML(url);
    console.log(`   ✅ Fetched ${html.length} bytes`);

    // Parse services
    const services = parseServices(html);
    console.log(`   📋 Found ${services.length} potential services`);

    if (services.length === 0) {
      console.log(`   ❌ No services extracted`);
      return result;
    }

    result.services = services;
    result.success = true;

    // Categorize services
    services.forEach(service => {
      const category = categorizeService(service.name);
      
      if (category === 'gel' && !result.gel) {
        result.gel = service.price;
      } else if (category === 'pedicure' && !result.pedicure) {
        result.pedicure = service.price;
      } else if (category === 'acrylic' && !result.acrylic) {
        result.acrylic = service.price;
      }
    });

    // Calculate confidence
    const hasGel = !!result.gel;
    const hasPedicure = !!result.pedicure;
    const hasAcrylic = !!result.acrylic;
    result.confidence = ((hasGel ? 1 : 0) + (hasPedicure ? 1 : 0) + (hasAcrylic ? 1 : 0)) / 3;

    console.log(`   ✅ Gel: ${result.gel ? `$${result.gel}` : 'N/A'}`);
    console.log(`   ✅ Pedicure: ${result.pedicure ? `$${result.pedicure}` : 'N/A'}`);
    console.log(`   ✅ Acrylic: ${result.acrylic ? `$${result.acrylic}` : 'N/A'}`);
    console.log(`   ✅ Confidence: ${(result.confidence * 100).toFixed(0)}%`);

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
  }

  return result;
}

/**
 * Batch scrape multiple competitors
 */
export async function batchScrapeWithCheerio(
  competitors: Array<{ name: string; website: string }>,
  concurrency: number = 2
): Promise<Map<string, ScrapeResult>> {
  const results = new Map<string, ScrapeResult>();

  console.log(`\n🚀 Batch scraping ${competitors.length} competitors (Cheerio mode)`);

  for (let i = 0; i < competitors.length; i += concurrency) {
    const batch = competitors.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(comp => 
        scrapeWithCheerio(comp.website, comp.name)
          .catch(error => ({
            success: false,
            services: [],
            source: comp.website,
            confidence: 0,
          } as ScrapeResult))
      )
    );

    batch.forEach((comp, idx) => {
      results.set(comp.name, batchResults[idx]);
    });

    // Rate limiting
    if (i + concurrency < competitors.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const successful = Array.from(results.values()).filter(r => r.success).length;
  console.log(`\n✅ Batch complete: ${successful}/${competitors.length} successful`);

  return results;
}

