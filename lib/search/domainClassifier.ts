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

// Blacklisted domains (directories, social media, aggregators)
const BLACKLISTED_DOMAINS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "mapquest.com",
  "salondiscover.com",
  "us-business.info",
  "yelp.com",
  "yellowpages.com",
  "local.com",
  "superpages.com",
  "manta.com",
  "bbb.org",
  "chamberofcommerce.com",
  "hotfrog.com",
  "citysearch.com",
  "kudzu.com",
  "business.site",
  "square.site",
  "wix.com",
  "weebly.com",
  "wordpress.com",
  "blogspot.com",
  "tumblr.com",
  "linkedin.com",
  "youtube.com",
  "pinterest.com",
  "google.com",
  "maps.google.com",
  "linktr.ee",
  "bio.link",
  "beacons.ai",
];

// Content scoring weights
const SCORING = {
  POSITIVE_KEYWORDS: {
    services: 15,
    pricing: 15,
    "price list": 15,
    menu: 10,
    manicure: 8,
    pedicure: 8,
    gel: 5,
    acrylic: 5,
    "nail salon": 5,
    appointment: 5,
    booking: 5,
    "book now": 5,
  },
  NEGATIVE_KEYWORDS: {
    "directory listing": -30,
    "find businesses near": -30,
    "business directory": -30,
    "local directory": -30,
    "redirecting to facebook": -20,
    "follow us on facebook": -15,
    "find us on facebook": -15,
    "reviews for": -10,
    "sponsored listing": -10,
  },
  REAL_THRESHOLD: 10,
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
 * Check if domain is blacklisted
 */
export function isBlacklistedDomain(url: string): boolean {
  const domain = extractDomain(url);
  if (!domain) return true;

  return BLACKLISTED_DOMAINS.some((blocked) => domain.includes(blocked));
}

/**
 * Check if domain looks like a real business website
 */
function isDomainStructureValid(domain: string): boolean {
  // Must have valid TLD
  const validTLDs = [".com", ".net", ".org", ".us", ".biz", ".info"];
  if (!validTLDs.some((tld) => domain.endsWith(tld))) {
    return false;
  }

  // Should not be too generic
  const tooGeneric = ["nails", "salon", "spa", "beauty"];
  const domainParts = domain.split(".")[0].split("-");

  // If domain is just a generic word, it's likely not a real business
  if (
    domainParts.length === 1 &&
    tooGeneric.includes(domainParts[0].toLowerCase())
  ) {
    return false;
  }

  return true;
}

/**
 * Score HTML content for business relevance
 */
function scoreContent(html: string, url: string): number {
  const htmlLower = html.toLowerCase();
  let score = 0;

  // Positive keywords
  for (const [keyword, points] of Object.entries(
    SCORING.POSITIVE_KEYWORDS
  )) {
    if (htmlLower.includes(keyword)) {
      score += points;
      console.log(`   ✅ Found "${keyword}" (+${points})`);
    }
  }

  // Negative keywords
  for (const [keyword, points] of Object.entries(
    SCORING.NEGATIVE_KEYWORDS
  )) {
    if (htmlLower.includes(keyword)) {
      score += points; // points are negative
      console.log(`   ❌ Found "${keyword}" (${points})`);
    }
  }

  return score;
}

/**
 * Classify if a URL with HTML content is a real business website
 */
export async function classifyWebsite(
  url: string,
  html?: string
): Promise<DomainScore> {
  const domain = extractDomain(url);

  // Step 1: Check blacklist
  if (!domain || isBlacklistedDomain(url)) {
    return {
      domain: domain || url,
      score: -100,
      isReal: false,
      reason: "Blacklisted domain (directory/social media)",
    };
  }

  // Step 2: Check domain structure
  if (!isDomainStructureValid(domain)) {
    return {
      domain,
      score: -50,
      isReal: false,
      reason: "Invalid domain structure",
    };
  }

  // Step 3: If no HTML, give neutral score
  if (!html) {
    return {
      domain,
      score: 5,
      isReal: true,
      reason: "Valid domain structure (no content check)",
    };
  }

  // Step 4: Score content
  const contentScore = scoreContent(html, url);

  // Step 5: Final verdict
  const isReal = contentScore >= SCORING.REAL_THRESHOLD;

  return {
    domain,
    score: contentScore,
    isReal,
    reason: isReal
      ? `Real business website (score: ${contentScore})`
      : `Likely directory/invalid (score: ${contentScore})`,
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

