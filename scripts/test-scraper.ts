/**
 * Test script for web scraping
 * Run: npx ts-node scripts/test-scraper.ts
 */

import { smartScrapeCompetitorPrices } from "../lib/scraping/smart-price-scraper";

async function testScraping() {
  console.log("🧪 Testing Web Scraper\n");

  // Test with real nail salon websites
  const testCompetitors = [
    {
      name: "Glossy Nail Bar (SF)",
      website: "https://www.glossynailbar.com",
      priceLevel: "$$",
      rating: 4.5,
      reviews: 200
    },
    {
      name: "Painted Ladies Nail Salon (SF)",
      website: "https://www.paintedladiesnails.com",
      priceLevel: "$$",
      rating: 4.3,
      reviews: 150
    }
  ];

  for (const competitor of testCompetitors) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Testing: ${competitor.name}`);
    console.log(`Website: ${competitor.website}`);
    console.log("=".repeat(60));

    try {
      const result = await smartScrapeCompetitorPrices(
        competitor.website,
        competitor.name
      );

      console.log(`\n✅ Results:`);
      console.log(`   Success: ${result.success}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Source: ${result.source}`);
      console.log(`\n   Prices Found:`);

      if (result.gel) {
        console.log(`     - Gel Manicure: $${result.gel}`);
      }
      if (result.pedicure) {
        console.log(`     - Pedicure: $${result.pedicure}`);
      }
      if (result.acrylic) {
        console.log(`     - Acrylic: $${result.acrylic}`);
      }

      if (result.allServices && result.allServices.length > 0) {
        console.log(`\n   All Services (${result.allServices.length}):`);
        result.allServices.slice(0, 10).forEach(service => {
          console.log(`     - ${service.serviceName}: $${service.price}`);
        });
      }

      if (!result.success || !result.gel && !result.pedicure && !result.acrylic) {
        console.log(`     ❌ No prices extracted`);
      }

    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}`);
      console.error(error.stack);
    }

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ Testing Complete");
  console.log("=".repeat(60));

  process.exit(0);
}

testScraping().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});

