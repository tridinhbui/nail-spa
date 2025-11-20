/**
 * Advanced Price Extractor
 * Multi-source data extraction agent for nail salon pricing
 */

export interface ServicePrices {
  // Manicures
  gel_manicure?: string;
  classic_manicure?: string;
  deluxe_manicure?: string;
  dip_powder?: string;
  
  // Acrylics & Extensions
  acrylic_full_set?: string;
  acrylic_fill?: string;
  gel_x?: string;
  hard_gel?: string;
  builder_gel?: string;
  pink_and_white?: string;
  uv_gel_full_set?: string;
  
  // Pedicures
  pedicure_classic?: string;
  pedicure_deluxe?: string;
  pedicure_organic?: string;
  pedicure_jelly?: string;
  pedicure_spa?: string;
  
  // Additional Services
  polish_change?: string;
  nail_art_basic?: string;
  nail_art_advanced?: string;
  ombre?: string;
  removal?: string;
  callus_removal?: string;
  
  // Add-ons
  addon_gel?: string;
  addon_shaping?: string;
  addon_design?: string;
  addon_paraffin?: string;
}

export interface ExtractedCompetitorData {
  name: string;
  rating: string | number;
  reviews: string | number;
  price_level: string;
  distance_mi: string | number;
  amenities: string[];
  hours_per_week: string | number;
  service_prices: ServicePrices;
  raw_price_text: string;
  data_sources: string[];
  confidence_score: number;
  extraction_timestamp: string;
}

/**
 * SERVICE NAME VARIATIONS MAPPING
 * Maps common variations to standardized service names
 */
const SERVICE_VARIATIONS: Record<string, string[]> = {
  gel_manicure: [
    'gel mani', 'gel manicure', 'no-chip gel', 'shellac', 
    'gel polish', 'gel nail', 'gelish', 'soak-off gel'
  ],
  classic_manicure: [
    'basic manicure', 'regular manicure', 'classic mani',
    'traditional manicure', 'standard manicure', 'regular mani'
  ],
  deluxe_manicure: [
    'deluxe mani', 'spa manicure', 'luxury manicure',
    'premium manicure', 'signature manicure'
  ],
  dip_powder: [
    'dip', 'powder dip', 'sns', 'dipping powder',
    'dip nails', 'powder gel', 'nexgen'
  ],
  acrylic_full_set: [
    'full set acrylic', 'acrylic nails', 'full acrylic',
    'acrylic set', 'new set', 'full set'
  ],
  acrylic_fill: [
    'fill', 'acrylic fill', 'fill-in', 'refill',
    'infill', 'backfill', 'maintenance'
  ],
  gel_x: [
    'gelx', 'gel x', 'gel extensions', 'soft gel extensions',
    'apres gel x', 'gel tips'
  ],
  pedicure_classic: [
    'basic pedicure', 'classic pedi', 'regular pedicure',
    'standard pedicure', 'traditional pedicure'
  ],
  pedicure_deluxe: [
    'deluxe pedi', 'spa pedicure', 'luxury pedicure',
    'premium pedicure', 'signature pedicure'
  ],
  nail_art_basic: [
    'simple design', 'basic design', 'nail design',
    'art per nail', 'basic art', 'simple nail art'
  ],
  nail_art_advanced: [
    'complex design', 'advanced design', '3d art',
    'custom design', 'detailed art', 'special design'
  ],
  removal: [
    'gel removal', 'acrylic removal', 'polish removal',
    'soak off', 'take off', 'removal service'
  ],
  ombre: [
    'ombré', 'ombre nails', 'gradient', 'fade',
    'color fade', 'ombre design'
  ],
  pink_and_white: [
    'pink & white', 'pink white', 'p&w',
    'french acrylic', 'permanent french'
  ]
};

/**
 * PRICE PATTERNS
 * Regex patterns to detect prices in various formats
 */
const PRICE_PATTERNS = [
  // Standard: $35, $35.00
  /\$(\d+(?:\.\d{2})?)/g,
  // Range: $35-$45, $35 - $45, $35–$45
  /\$(\d+)\s*[-–—]\s*\$?(\d+)/g,
  // Starting from: from $35, starting at $35
  /(?:from|starting\s+at|starts\s+at)\s*\$?(\d+)/gi,
  // Up to: up to $45
  /up\s+to\s*\$?(\d+)/gi,
  // Word format: thirty-five dollars
  /(\w+)\s+dollars?/gi
];

/**
 * Extract prices from raw text using multiple patterns
 */
export function extractPricesFromText(text: string): string[] {
  const prices: string[] = [];
  
  PRICE_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[2]) {
        // Range detected
        prices.push(`$${match[1]}-$${match[2]}`);
      } else if (match[1]) {
        prices.push(`$${match[1]}`);
      }
    }
  });
  
  return [...new Set(prices)]; // Remove duplicates
}

/**
 * Normalize service name to standard key
 */
export function normalizeServiceName(serviceName: string): string | null {
  const normalized = serviceName.toLowerCase().trim();
  
  for (const [standardName, variations] of Object.entries(SERVICE_VARIATIONS)) {
    if (variations.some(v => normalized.includes(v))) {
      return standardName;
    }
  }
  
  return null;
}

/**
 * Extract service prices from structured HTML/text
 */
export function extractServicePrices(html: string): Partial<ServicePrices> {
  const servicePrices: Partial<ServicePrices> = {};
  const text = html.replace(/<[^>]*>/g, ' ').toLowerCase();
  
  // Split into lines or sections
  const lines = text.split(/\n|<br>|<\/div>|<\/p>/i);
  
  lines.forEach(line => {
    // Check if line contains both service name and price
    const prices = extractPricesFromText(line);
    if (prices.length === 0) return;
    
    // Try to match service name
    const serviceKey = normalizeServiceName(line);
    if (serviceKey) {
      servicePrices[serviceKey as keyof ServicePrices] = prices[0];
    }
  });
  
  return servicePrices;
}

/**
 * Estimate price based on price level and service type
 */
export function estimatePrice(priceLevel: string, serviceType: string): string {
  const priceRanges: Record<string, Record<string, string>> = {
    '$': {
      gel_manicure: 'estimated $25-$30',
      classic_manicure: 'estimated $15-$20',
      pedicure_classic: 'estimated $25-$30',
      acrylic_full_set: 'estimated $35-$45',
    },
    '$$': {
      gel_manicure: 'estimated $30-$40',
      classic_manicure: 'estimated $20-$25',
      pedicure_classic: 'estimated $30-$40',
      acrylic_full_set: 'estimated $45-$60',
    },
    '$$$': {
      gel_manicure: 'estimated $40-$55',
      classic_manicure: 'estimated $25-$35',
      pedicure_classic: 'estimated $45-$65',
      acrylic_full_set: 'estimated $60-$80',
    },
    '$$$$': {
      gel_manicure: 'estimated $55-$75',
      classic_manicure: 'estimated $35-$50',
      pedicure_classic: 'estimated $65-$90',
      acrylic_full_set: 'estimated $80-$120',
    }
  };
  
  return priceRanges[priceLevel]?.[serviceType] || 'unknown';
}

/**
 * Calculate confidence score based on data sources and completeness
 */
export function calculateConfidenceScore(
  servicePrices: Partial<ServicePrices>,
  dataSources: string[]
): number {
  const totalServices = Object.keys(SERVICE_VARIATIONS).length;
  const extractedServices = Object.values(servicePrices).filter(p => 
    p && !p.includes('unknown') && !p.includes('estimated')
  ).length;
  
  const completeness = extractedServices / totalServices;
  const sourceBonus = Math.min(dataSources.length * 0.1, 0.3);
  
  return Math.min((completeness * 0.7) + sourceBonus, 1.0);
}

/**
 * Merge prices from multiple sources, preferring real data over estimates
 */
export function mergePricesFromSources(
  sources: Array<Partial<ServicePrices>>
): ServicePrices {
  const merged: Partial<ServicePrices> = {};
  
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (!value) continue;
      
      const currentValue = merged[key as keyof ServicePrices];
      
      // Priority: real price > estimated > unknown
      if (!currentValue || 
          (currentValue.includes('unknown') && !value.includes('unknown')) ||
          (currentValue.includes('estimated') && !value.includes('estimated') && !value.includes('unknown'))) {
        merged[key as keyof ServicePrices] = value;
      }
    }
  }
  
  return merged as ServicePrices;
}

/**
 * Extract prices from review text
 */
export function extractPricesFromReviews(reviews: string[]): Partial<ServicePrices> {
  const servicePrices: Partial<ServicePrices> = {};
  
  reviews.forEach(review => {
    const text = review.toLowerCase();
    
    // Look for mentions like "paid $35 for gel manicure"
    const priceMatches = extractPricesFromText(text);
    if (priceMatches.length === 0) return;
    
    // Try to find service name near the price
    const serviceKey = normalizeServiceName(text);
    if (serviceKey && !servicePrices[serviceKey as keyof ServicePrices]) {
      servicePrices[serviceKey as keyof ServicePrices] = `${priceMatches[0]} (from reviews)`;
    }
  });
  
  return servicePrices;
}

/**
 * Format final output for competitor
 */
export function formatCompetitorData(
  competitorData: Partial<ExtractedCompetitorData>
): ExtractedCompetitorData {
  const now = new Date().toISOString();
  
  return {
    name: competitorData.name || 'Unknown',
    rating: competitorData.rating || 'unknown',
    reviews: competitorData.reviews || 'unknown',
    price_level: competitorData.price_level || '$$',
    distance_mi: competitorData.distance_mi || 'unknown',
    amenities: competitorData.amenities || [],
    hours_per_week: competitorData.hours_per_week || 'unknown',
    service_prices: competitorData.service_prices || {},
    raw_price_text: competitorData.raw_price_text || '',
    data_sources: competitorData.data_sources || [],
    confidence_score: competitorData.confidence_score || 0,
    extraction_timestamp: now
  };
}

