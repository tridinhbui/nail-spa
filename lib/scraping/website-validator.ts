/**
 * 🔍 Website Validator
 * Detects invalid websites (social media, linktree, etc.) that won't have pricing info
 */

export interface WebsiteValidation {
  isValid: boolean;
  reason?: string;
  originalUrl?: string;
}

/**
 * Check if a website URL is valid for scraping pricing data
 * Invalid = social media, link aggregators, or empty URLs
 */
export function validateWebsite(url: string | null | undefined): WebsiteValidation {
  // Empty or null
  if (!url || url.trim() === "" || url === "#") {
    return {
      isValid: false,
      reason: "empty_url",
      originalUrl: url || undefined,
    };
  }

  const urlLower = url.toLowerCase();

  // Social media platforms (won't have pricing pages)
  const socialPlatforms = [
    "facebook.com",
    "fb.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "tiktok.com",
    "youtube.com",
    "linkedin.com",
  ];

  for (const platform of socialPlatforms) {
    if (urlLower.includes(platform)) {
      return {
        isValid: false,
        reason: `social_media_${platform.split(".")[0]}`,
        originalUrl: url,
      };
    }
  }

  // Link aggregators (not real websites)
  const aggregators = [
    "linktr.ee",
    "linktree",
    "bio.link",
    "beacons.ai",
    "hoo.be",
    "tap.bio",
  ];

  for (const aggregator of aggregators) {
    if (urlLower.includes(aggregator)) {
      return {
        isValid: false,
        reason: `link_aggregator_${aggregator}`,
        originalUrl: url,
      };
    }
  }

  // Google Maps URLs (not useful for scraping)
  if (
    urlLower.includes("google.com/maps") ||
    urlLower.includes("goo.gl/maps")
  ) {
    return {
      isValid: false,
      reason: "google_maps_url",
      originalUrl: url,
    };
  }

  // Valid website!
  return {
    isValid: true,
    originalUrl: url,
  };
}

/**
 * Batch validate multiple websites
 */
export function batchValidateWebsites(
  competitors: Array<{ name: string; website?: string | null }>
): Map<string, WebsiteValidation> {
  const results = new Map<string, WebsiteValidation>();

  for (const comp of competitors) {
    results.set(comp.name, validateWebsite(comp.website));
  }

  return results;
}

