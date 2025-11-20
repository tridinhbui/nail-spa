/**
 * MULTI-SOURCE DATA EXTRACTION AGENT
 * Crawls multiple sources to extract comprehensive pricing data
 */

import { createPage } from "./browser";
import {
  ExtractedCompetitorData,
  ServicePrices,
  extractPricesFromText,
  extractServicePrices,
  estimatePrice,
  calculateConfidenceScore,
  mergePricesFromSources,
  formatCompetitorData,
  extractPricesFromReviews
} from "./advanced-price-extractor";

export interface CompetitorInput {
  name: string;
  website?: string;
  googleMapsUrl?: string;
  yelpUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  rating?: number;
  reviews?: number;
  priceLevel?: string;
  distance?: number;
  amenities?: string[];
}

/**
 * DATA SOURCES IN PRIORITY ORDER
 */
const DATA_SOURCES = [
  'website_services',
  'booking_system',
  'yelp',
  'google_maps',
  'facebook',
  'instagram',
  'groupon',
  'third_party_booking'
] as const;

/**
 * BOOKING PLATFORM DOMAINS
 */
const BOOKING_PLATFORMS = [
  'vagaro.com',
  'fresha.com',
  'booksy.com',
  'schedulicity.com',
  'square.site',
  'squareup.com',
  'genbook.com',
  'appointy.com',
  'setmore.com',
  'acuityscheduling.com'
];

/**
 * Extract from website services page
 */
async function extractFromWebsite(url: string): Promise<Partial<ServicePrices>> {
  const page = await createPage();
  const dataSources: string[] = [];
  let allPrices: Partial<ServicePrices> = {};
  
  try {
    // Check if it's a booking platform
    const isBookingPlatform = BOOKING_PLATFORMS.some(platform => url.includes(platform));
    
    if (isBookingPlatform) {
      console.log(`📱 Detected booking platform: ${url}`);
      dataSources.push('booking_system');
    }
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Try common service page paths
    const servicePaths = ['/services', '/pricing', '/menu', '/price-list', '/rates'];
    
    for (const path of servicePaths) {
      try {
        const fullUrl = new URL(path, url).href;
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        
        const html = await page.content();
        const extracted = extractServicePrices(html);
        
        if (Object.keys(extracted).length > 0) {
          console.log(`✅ Found prices on ${path}`);
          allPrices = { ...allPrices, ...extracted };
          dataSources.push('website_services');
          break;
        }
      } catch (err) {
        // Continue to next path
      }
    }
    
    // If no dedicated page, try homepage
    if (Object.keys(allPrices).length === 0) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      const html = await page.content();
      const extracted = extractServicePrices(html);
      allPrices = { ...allPrices, ...extracted };
    }
    
    // Look for booking buttons that might lead to pricing
    const bookingButtons = await page.$$eval('a[href*="book"], button:has-text("book")', 
      (elements) => elements.map(el => (el as HTMLAnchorElement).href).filter(Boolean)
    ).catch(() => []);
    
    for (const bookingUrl of bookingButtons.slice(0, 2)) {
      try {
        await page.goto(bookingUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        const html = await page.content();
        const extracted = extractServicePrices(html);
        if (Object.keys(extracted).length > 0) {
          allPrices = { ...allPrices, ...extracted };
          dataSources.push('booking_system');
          break;
        }
      } catch (err) {
        // Continue
      }
    }
    
  } catch (error) {
    console.error(`Error extracting from website:`, error);
  } finally {
    await page.close().catch(() => {});
  }
  
  return allPrices;
}

/**
 * Extract from Yelp (if available)
 */
async function extractFromYelp(businessName: string): Promise<Partial<ServicePrices>> {
  // Yelp scraping would require:
  // 1. Search for business name
  // 2. Find business page
  // 3. Look for "Services Offered" section
  // 4. Parse pricing if available
  
  // For now, return empty (implement when needed)
  console.log(`🔍 Yelp extraction for ${businessName} - Not implemented yet`);
  return {};
}

/**
 * Extract from Google Maps reviews
 */
async function extractFromGoogleReviews(googleMapsUrl?: string): Promise<Partial<ServicePrices>> {
  if (!googleMapsUrl) return {};
  
  // Google Maps scraping for price mentions in reviews
  // This would require Puppeteer to navigate and parse reviews
  
  console.log(`🗺️ Google Maps extraction - Not implemented yet`);
  return {};
}

/**
 * Extract from social media (Facebook/Instagram)
 */
async function extractFromSocialMedia(
  facebookUrl?: string,
  instagramUrl?: string
): Promise<Partial<ServicePrices>> {
  // Social media extraction would look for:
  // - Posted menu images (OCR)
  // - Service price posts
  // - Pinned pricing information
  
  console.log(`📱 Social media extraction - Not implemented yet`);
  return {};
}

/**
 * Extract from third-party booking platforms
 */
async function extractFromThirdPartyPlatforms(
  businessName: string
): Promise<Partial<ServicePrices>> {
  // Search on platforms like:
  // - Fresha
  // - Vagaro
  // - Booksy
  // - Groupon
  
  console.log(`🔗 Third-party platform extraction - Not implemented yet`);
  return {};
}

/**
 * MAIN EXTRACTION FUNCTION
 * Crawls all sources and combines data
 */
export async function extractComprehensiveData(
  competitor: CompetitorInput
): Promise<ExtractedCompetitorData> {
  console.log(`\n🎯 Starting comprehensive extraction for: ${competitor.name}`);
  
  const dataSources: string[] = [];
  const allExtractedPrices: Array<Partial<ServicePrices>> = [];
  let rawPriceText = '';
  
  // 1. Extract from website
  if (competitor.website && competitor.website !== '#') {
    console.log(`\n📄 Extracting from website...`);
    try {
      const websitePrices = await extractFromWebsite(competitor.website);
      if (Object.keys(websitePrices).length > 0) {
        allExtractedPrices.push(websitePrices);
        dataSources.push('website');
        rawPriceText += JSON.stringify(websitePrices) + '\n';
      }
    } catch (error) {
      console.error(`Website extraction error:`, error);
    }
  }
  
  // 2. Extract from Yelp
  if (competitor.yelpUrl) {
    console.log(`\n🌟 Extracting from Yelp...`);
    try {
      const yelpPrices = await extractFromYelp(competitor.name);
      if (Object.keys(yelpPrices).length > 0) {
        allExtractedPrices.push(yelpPrices);
        dataSources.push('yelp');
      }
    } catch (error) {
      console.error(`Yelp extraction error:`, error);
    }
  }
  
  // 3. Extract from Google Maps
  if (competitor.googleMapsUrl) {
    console.log(`\n🗺️ Extracting from Google Maps...`);
    try {
      const gmapsPrices = await extractFromGoogleReviews(competitor.googleMapsUrl);
      if (Object.keys(gmapsPrices).length > 0) {
        allExtractedPrices.push(gmapsPrices);
        dataSources.push('google_maps');
      }
    } catch (error) {
      console.error(`Google Maps extraction error:`, error);
    }
  }
  
  // 4. Extract from social media
  if (competitor.facebookUrl || competitor.instagramUrl) {
    console.log(`\n📱 Extracting from social media...`);
    try {
      const socialPrices = await extractFromSocialMedia(
        competitor.facebookUrl,
        competitor.instagramUrl
      );
      if (Object.keys(socialPrices).length > 0) {
        allExtractedPrices.push(socialPrices);
        dataSources.push('social_media');
      }
    } catch (error) {
      console.error(`Social media extraction error:`, error);
    }
  }
  
  // 5. Extract from third-party platforms
  console.log(`\n🔗 Searching third-party booking platforms...`);
  try {
    const thirdPartyPrices = await extractFromThirdPartyPlatforms(competitor.name);
    if (Object.keys(thirdPartyPrices).length > 0) {
      allExtractedPrices.push(thirdPartyPrices);
      dataSources.push('third_party_booking');
    }
  } catch (error) {
    console.error(`Third-party extraction error:`, error);
  }
  
  // Merge all extracted prices
  let finalPrices = mergePricesFromSources(allExtractedPrices);
  
  // Fill in missing prices with estimates if we have price level
  if (competitor.priceLevel) {
    const serviceKeys = [
      'gel_manicure',
      'classic_manicure',
      'pedicure_classic',
      'acrylic_full_set',
      'dip_powder'
    ];
    
    serviceKeys.forEach(key => {
      if (!finalPrices[key as keyof ServicePrices]) {
        finalPrices[key as keyof ServicePrices] = estimatePrice(
          competitor.priceLevel!,
          key
        );
      }
    });
  }
  
  // Fill remaining with "unknown"
  const allServiceKeys: Array<keyof ServicePrices> = [
    'gel_manicure', 'classic_manicure', 'deluxe_manicure', 'dip_powder',
    'acrylic_full_set', 'acrylic_fill', 'gel_x', 'hard_gel', 'builder_gel',
    'pink_and_white', 'uv_gel_full_set', 'pedicure_classic', 'pedicure_deluxe',
    'pedicure_organic', 'pedicure_jelly', 'pedicure_spa', 'polish_change',
    'nail_art_basic', 'nail_art_advanced', 'ombre', 'removal', 'callus_removal',
    'addon_gel', 'addon_shaping', 'addon_design', 'addon_paraffin'
  ];
  
  allServiceKeys.forEach(key => {
    if (!finalPrices[key]) {
      finalPrices[key] = 'unknown';
    }
  });
  
  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(finalPrices, dataSources);
  
  // Format and return
  const result = formatCompetitorData({
    name: competitor.name,
    rating: competitor.rating || 'unknown',
    reviews: competitor.reviews || 'unknown',
    price_level: competitor.priceLevel || '$$',
    distance_mi: competitor.distance || 'unknown',
    amenities: competitor.amenities || [],
    hours_per_week: 'unknown', // Would need to extract from operating hours
    service_prices: finalPrices,
    raw_price_text: rawPriceText,
    data_sources: dataSources,
    confidence_score: confidenceScore
  });
  
  console.log(`\n✅ Extraction complete for ${competitor.name}`);
  console.log(`   Data sources: ${dataSources.join(', ')}`);
  console.log(`   Confidence: ${(confidenceScore * 100).toFixed(0)}%`);
  console.log(`   Services extracted: ${Object.values(finalPrices).filter(p => !p.includes('unknown')).length}`);
  
  return result;
}

/**
 * BATCH EXTRACTION
 * Process multiple competitors in parallel (with rate limiting)
 */
export async function batchExtractCompetitors(
  competitors: CompetitorInput[],
  concurrency: number = 2
): Promise<{
  results: ExtractedCompetitorData[];
  summary: {
    total: number;
    successful: number;
    avgConfidence: number;
    totalServices: number;
    estimated: number;
    unknown: number;
  };
}> {
  console.log(`\n🚀 Starting batch extraction for ${competitors.length} competitors`);
  console.log(`   Concurrency: ${concurrency}\n`);
  
  const results: ExtractedCompetitorData[] = [];
  
  // Process in batches
  for (let i = 0; i < competitors.length; i += concurrency) {
    const batch = competitors.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(comp => extractComprehensiveData(comp))
    );
    results.push(...batchResults);
    
    // Rate limiting: wait 2s between batches
    if (i + concurrency < competitors.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Calculate summary
  const summary = {
    total: results.length,
    successful: results.filter(r => r.confidence_score > 0.3).length,
    avgConfidence: results.reduce((sum, r) => sum + r.confidence_score, 0) / results.length,
    totalServices: results.reduce((sum, r) => 
      Object.values(r.service_prices).filter(p => p && !p.includes('unknown')).length, 0
    ),
    estimated: results.reduce((sum, r) => 
      Object.values(r.service_prices).filter(p => p && p.includes('estimated')).length, 0
    ),
    unknown: results.reduce((sum, r) => 
      Object.values(r.service_prices).filter(p => p === 'unknown').length, 0
    )
  };
  
  console.log(`\n📊 BATCH EXTRACTION SUMMARY:`);
  console.log(`   Total competitors: ${summary.total}`);
  console.log(`   Successful (>30% confidence): ${summary.successful}`);
  console.log(`   Average confidence: ${(summary.avgConfidence * 100).toFixed(1)}%`);
  console.log(`   Total services extracted: ${summary.totalServices}`);
  console.log(`   Estimated values: ${summary.estimated}`);
  console.log(`   Unknown values: ${summary.unknown}\n`);
  
  return { results, summary };
}

