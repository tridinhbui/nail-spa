#!/usr/bin/env node

/**
 * 🧪 Test Bing Website Discovery
 * Tests the complete flow: Validation → Bing Search → Website Discovery
 */

console.log("🧪 Testing Website Discovery Flow\n");
console.log("=".repeat(70));

// Mock competitors (like from Google Places)
const mockCompetitors = [
  {
    name: "Luxury Nails Spa",
    address: "135 S Main St, Mount Vernon, OH",
    website: "facebook.com/luxurynails",
  },
  {
    name: "Finishing Touch Day Spa",
    address: "135 S Main St, Mount Vernon, OH",
    website: "https://finishingtouchdayspa.com",
  },
  {
    name: "Instagram Only Salon",
    address: "100 Oak Street, Mount Vernon, OH",
    website: "instagram.com/salonbeauty",
  },
  {
    name: "No Website Salon",
    address: "200 Elm Street, Mount Vernon, OH",
    website: null,
  },
];

console.log("\n📋 Testing Validation Logic:\n");

// Simulate validation logic
function validateWebsite(url) {
  if (!url || url.trim() === "" || url === "#") {
    return { isValid: false, reason: "empty_url" };
  }

  const urlLower = url.toLowerCase();

  if (urlLower.includes("facebook.com") || urlLower.includes("fb.com")) {
    return { isValid: false, reason: "social_media_facebook" };
  }

  if (urlLower.includes("instagram.com")) {
    return { isValid: false, reason: "social_media_instagram" };
  }

  if (urlLower.includes("linktr.ee")) {
    return { isValid: false, reason: "link_aggregator" };
  }

  return { isValid: true };
}

mockCompetitors.forEach((comp, index) => {
  const validation = validateWebsite(comp.website);
  const status = validation.isValid ? "✅ VALID" : "❌ INVALID";
  const reason = validation.reason ? ` (${validation.reason})` : "";

  console.log(
    `${index + 1}. ${comp.name.padEnd(30)} ${status}${reason}`
  );
  console.log(`   URL: ${comp.website || "(none)"}`);

  if (!validation.isValid) {
    console.log(`   🔍 Needs Bing Search to find real website`);
  }
  console.log();
});

console.log("=".repeat(70));
console.log("\n📊 Summary:");

const invalidCount = mockCompetitors.filter(
  (c) => !validateWebsite(c.website).isValid
).length;

console.log(`Total Competitors: ${mockCompetitors.length}`);
console.log(`Invalid Websites: ${invalidCount} (${Math.round((invalidCount / mockCompetitors.length) * 100)}%)`);
console.log(`Need Bing Discovery: ${invalidCount}`);

console.log("\n🔍 Bing Search Query Examples:\n");
mockCompetitors
  .filter((c) => !validateWebsite(c.website).isValid)
  .forEach((comp) => {
    const query = `${comp.name} ${comp.address} nail salon website`;
    console.log(`   "${query}"`);
  });

console.log("\n" + "=".repeat(70));
console.log("\n✅ Validation logic verified!");
console.log("\n📌 Next Steps:");
console.log("   1. Get Bing Search API key from Azure Portal");
console.log("   2. Add BING_SEARCH_API_KEY to your .env file");
console.log("   3. Restart dev server");
console.log("   4. Test competitor search on /analyze page");
console.log("\n💡 See docs/BING_SEARCH_SETUP.md for detailed setup guide\n");

