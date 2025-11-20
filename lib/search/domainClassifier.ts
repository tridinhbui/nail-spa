/**
 * 🎯 Domain Classifier
 * Strict domain validation to filter out directories and social media
 */

interface DomainScore {
  domain: string;
  score: number;
  isReal: boolean;
  reason: string;
}

// ULTRA STRICT: Blocked domains (directories, social media, review sites, aggregators)
const BLOCKED_DOMAINS = [
  // Social media
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "linkedin.com",
  "youtube.com",
  "pinterest.com",
  "snapchat.com",
  
  // Maps & directories
  "mapquest.com",
  "maps.google.com",
  "google.com/maps",
  "yelp.com",
  "yellowpages.com",
  "whitepages.com",
  "superpages.com",
  "local.com",
  "manta.com",
  "hotfrog.com",
  "citysearch.com",
  "kudzu.com",
  "brownbook.net",
  "cylex.us",
  "tupalo.com",
  "ezlocal.com",
  "n49.com",
  "showmelocal.com",
  "merchantcircle.com",
  
  // Salon/beauty directories & review sites
  "salondiscover.com",
  "salonbooker.com",
  "haircutmen.com",
  "atriume.com",
  "manereviews.com",
  "salonratings.com",
  "beautyrater.com",
  "styleseat.com",
  "vagaro.com",
  "mindbodyonline.com",
  "fresha.com",
  "booksy.com",
  "schedulicity.com",
  
  // Business info aggregators
  "us-business.info",
  "bizapedia.com",
  "bizstanding.com",
  "find-us-here.com",
  "chamberofcommerce.com",
  "bbb.org",
  "dandb.com",
  "zoominfo.com",
  "apollo.io",
  
  // Generic business sites
  "business.site",
  "square.site",
  "sites.google.com",
  
  // Link aggregators
  "linktr.ee",
  "bio.link",
  "beacons.ai",
  "hoo.be",
  "tap.bio",
  
  // Generic builders (usually not real business sites)
  "wix.com",
  "weebly.com",
  "wordpress.com",
  "blogspot.com",
  "tumblr.com",
  "medium.com",
];

// ULTRA STRICT: Content scoring weights
const SCORING = {
  POSITIVE_KEYWORDS: {
    services: 15,
    "service menu": 15,
    pricing: 15,
    "price list": 15,
    prices: 15,
    menu: 10,
    manicure: 10,
    pedicure: 10,
    "nail salon": 8,
    nail: 5,
    gel: 5,
    acrylic: 5,
    "book now": 15,
    appointment: 15,
    booking: 10,
    schedule: 5,
  },
  NEGATIVE_KEYWORDS: {
    "directory": -50,
    "listing": -50,
    "find businesses": -50,
    "popular businesses near": -50,
    "business directory": -50,
    "local directory": -50,
    "review site": -50,
    "reviews for": -50,
    "read reviews": -30,
    "write a review": -30,
    "terms of service": -50,
    "privacy policy": -30,
    "redirecting to facebook": -50,
    "follow us on facebook": -30,
    "sponsored listing": -50,
    "paid advertisement": -50,
  },
  // STRICT: Real website requires score >= 20 (was 10)
  REAL_THRESHOLD: 20,
  // Minimum unique positive keywords required
  MIN_KEYWORDS: 2,
};

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Check if domain is blocked (ULTRA STRICT)
 */
export function isBlacklistedDomain(url: string): boolean {
  const domain = extractDomain(url);
  if (!domain) return true;

  // Check exact matches and subdomains
  return BLOCKED_DOMAINS.some((blocked) => {
    return domain === blocked || domain.endsWith(`.${blocked}`) || domain.includes(blocked);
  });
}

/**
 * Check if domain looks like a real business website (ULTRA STRICT)
 */
function isDomainStructureValid(domain: string): boolean {
  // Must have valid TLD (.com, .net, .org ONLY)
  const validTLDs = [".com", ".net", ".org"];
  if (!validTLDs.some((tld) => domain.endsWith(tld))) {
    console.log(`   ❌ Invalid TLD: ${domain}`);
    return false;
  }

  // Reject if domain contains suspicious keywords
  const suspiciousKeywords = [
    "review",
    "directory",
    "listing",
    "biz",
    "map",
    "guide",
    "find",
    "search",
    "local",
    "city",
  ];

  for (const keyword of suspiciousKeywords) {
    if (domain.includes(keyword)) {
      console.log(`   ❌ Suspicious keyword in domain: "${keyword}" in ${domain}`);
      return false;
    }
  }

  // Should not be too generic
  const tooGeneric = ["nails", "salon", "spa", "beauty", "hair"];
  const domainParts = domain.split(".")[0].split("-");

  // If domain is just a single generic word, it's likely not a real business
  if (
    domainParts.length === 1 &&
    tooGeneric.includes(domainParts[0].toLowerCase())
  ) {
    console.log(`   ❌ Too generic domain: ${domain}`);
    return false;
  }

  return true;
}

/**
 * Score HTML content for business relevance (ULTRA STRICT)
 */
function scoreContent(html: string, url: string): {
  score: number;
  uniqueKeywordsFound: number;
} {
  const htmlLower = html.toLowerCase();
  let score = 0;
  let uniqueKeywordsFound = 0;

  // Track unique positive keywords
  const foundPositiveKeywords: string[] = [];

  // Positive keywords
  for (const [keyword, points] of Object.entries(
    SCORING.POSITIVE_KEYWORDS
  )) {
    if (htmlLower.includes(keyword)) {
      score += points;
      foundPositiveKeywords.push(keyword);
      console.log(`   ✅ Found "${keyword}" (+${points})`);
    }
  }

  uniqueKeywordsFound = foundPositiveKeywords.length;

  // Negative keywords (STRICT penalties)
  for (const [keyword, points] of Object.entries(
    SCORING.NEGATIVE_KEYWORDS
  )) {
    if (htmlLower.includes(keyword)) {
      score += points; // points are negative (-50, -30)
      console.log(`   ❌ Found "${keyword}" (${points})`);
    }
  }

  return { score, uniqueKeywordsFound };
}

/**
 * Classify if a URL with HTML content is a real business website (ULTRA STRICT)
 */
export async function classifyWebsite(
  url: string,
  html?: string
): Promise<DomainScore> {
  const domain = extractDomain(url);

  // Step 1: HARD BLOCK - Check blocked domains list
  if (!domain || isBlacklistedDomain(url)) {
    console.log(`   ⚠️  Blocked directory domain: ${domain || url}`);
    return {
      domain: domain || url,
      score: -999,
      isReal: false,
      reason: "BLOCKED_DOMAIN (directory/social media/review site)",
    };
  }

  // Step 2: Check domain structure (TLD, suspicious keywords)
  if (!isDomainStructureValid(domain)) {
    return {
      domain,
      score: -100,
      isReal: false,
      reason: "Invalid domain structure (suspicious keywords/TLD)",
    };
  }

  // Step 3: If no HTML, cannot validate (mark as uncertain)
  if (!html) {
    console.log(`   ⚠️  No HTML to analyze for ${domain}`);
    return {
      domain,
      score: 0,
      isReal: false,
      reason: "No HTML content to validate (requires content check)",
    };
  }

  // Step 4: Score content (STRICT)
  const { score: contentScore, uniqueKeywordsFound } = scoreContent(html, url);

  // Step 5: STRICT validation
  // Must have at least 2 unique positive keywords AND score >= 20
  if (uniqueKeywordsFound < SCORING.MIN_KEYWORDS) {
    console.log(
      `   ❌ Invalid real-business website: Only ${uniqueKeywordsFound}/${SCORING.MIN_KEYWORDS} keywords found`
    );
    return {
      domain,
      score: contentScore,
      isReal: false,
      reason: `LOW_CONFIDENCE: Only ${uniqueKeywordsFound} keywords found (need ${SCORING.MIN_KEYWORDS})`,
    };
  }

  // Check score threshold
  const isReal = contentScore >= SCORING.REAL_THRESHOLD;

  if (isReal) {
    console.log(
      `   ✅ Real business website (score: ${contentScore}, keywords: ${uniqueKeywordsFound})`
    );
  } else {
    console.log(
      `   ❌ Invalid real-business website: Score ${contentScore} < ${SCORING.REAL_THRESHOLD}`
    );
  }

  return {
    domain,
    score: contentScore,
    isReal,
    reason: isReal
      ? `VALID: Real business website (score: ${contentScore}, keywords: ${uniqueKeywordsFound})`
      : `INVALID: Score ${contentScore} < ${SCORING.REAL_THRESHOLD} (keywords: ${uniqueKeywordsFound})`,
  };
}

/**
 * Batch classify multiple URLs
 */
export function classifyUrls(urls: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const url of urls) {
    if (isBlacklistedDomain(url)) {
      invalid.push(url);
    } else {
      const domain = extractDomain(url);
      if (domain && isDomainStructureValid(domain)) {
        valid.push(url);
      } else {
        invalid.push(url);
      }
    }
  }

  return { valid, invalid };
}

/**
 * Extract best candidate URL from search results
 */
export function selectBestUrl(
  urls: string[],
  businessName: string
): string | null {
  // Filter out blacklisted
  const validUrls = urls.filter((url) => !isBlacklistedDomain(url));

  if (validUrls.length === 0) return null;

  // Prefer URLs with business name in domain
  const nameInDomain = validUrls.filter((url) => {
    const domain = extractDomain(url);
    if (!domain) return false;

    const nameParts = businessName
      .toLowerCase()
      .split(/\s+/)
      .filter((p) => p.length > 3); // Ignore short words

    return nameParts.some((part) => domain.includes(part));
  });

  if (nameInDomain.length > 0) {
    return nameInDomain[0];
  }

  // Otherwise return first valid URL
  return validUrls[0];
}

