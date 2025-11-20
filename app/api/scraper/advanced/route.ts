import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  batchExtractCompetitors,
  extractComprehensiveData,
  CompetitorInput
} from "@/lib/scraping/multi-source-scraper";

/**
 * POST /api/scraper/advanced
 * Advanced multi-source price extraction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { competitors, single } = body;

    // Single competitor extraction
    if (single && body.competitor) {
      const competitor: CompetitorInput = body.competitor;
      
      console.log(`\n🎯 Single extraction request for: ${competitor.name}`);
      
      const result = await extractComprehensiveData(competitor);
      
      return successResponse(
        { competitor: result },
        "Data extracted successfully"
      );
    }

    // Batch extraction
    if (Array.isArray(competitors) && competitors.length > 0) {
      console.log(`\n🚀 Batch extraction request for ${competitors.length} competitors`);
      
      const { results, summary } = await batchExtractCompetitors(
        competitors,
        2 // Concurrency
      );
      
      return successResponse(
        { competitors: results, summary },
        `Extracted data for ${results.length} competitors`
      );
    }

    return errorResponse(
      "Please provide either 'competitor' (single) or 'competitors' (array)",
      400,
      "INVALID_INPUT"
    );

  } catch (error: any) {
    console.error("Advanced scraper error:", error);
    return errorResponse(
      error.message || "Failed to extract competitor data",
      500,
      "SCRAPER_ERROR"
    );
  }
}

/**
 * GET /api/scraper/advanced
 * Get scraper capabilities and service list
 */
export async function GET() {
  return successResponse({
    version: "2.0",
    capabilities: [
      "website_services",
      "booking_system",
      "yelp",
      "google_maps",
      "facebook",
      "instagram",
      "groupon",
      "third_party_booking"
    ],
    services_tracked: [
      // Manicures
      "gel_manicure",
      "classic_manicure",
      "deluxe_manicure",
      "dip_powder",
      
      // Acrylics & Extensions
      "acrylic_full_set",
      "acrylic_fill",
      "gel_x",
      "hard_gel",
      "builder_gel",
      "pink_and_white",
      "uv_gel_full_set",
      
      // Pedicures
      "pedicure_classic",
      "pedicure_deluxe",
      "pedicure_organic",
      "pedicure_jelly",
      "pedicure_spa",
      
      // Additional Services
      "polish_change",
      "nail_art_basic",
      "nail_art_advanced",
      "ombre",
      "removal",
      "callus_removal",
      
      // Add-ons
      "addon_gel",
      "addon_shaping",
      "addon_design",
      "addon_paraffin"
    ],
    booking_platforms: [
      "vagaro.com",
      "fresha.com",
      "booksy.com",
      "schedulicity.com",
      "square.site",
      "squareup.com",
      "genbook.com",
      "appointy.com",
      "setmore.com",
      "acuityscheduling.com"
    ],
    features: {
      multi_source: true,
      price_estimation: true,
      review_extraction: true,
      confidence_scoring: true,
      auto_service_detection: true,
      range_normalization: true
    }
  }, "Advanced scraper ready");
}

