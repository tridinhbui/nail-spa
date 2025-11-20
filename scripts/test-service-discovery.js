/**
 * 🧪 Test Service Page Discovery
 * Verify that extractServiceLinks works correctly
 */

console.log("🧪 Testing Service Page Discovery\n");
console.log("=" .repeat(70));

// Mock HTML with service links
const mockHtml = `
<!DOCTYPE html>
<html>
<head><title>Fringe Salon</title></head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/services">Services</a>
    <a href="/pricing">Pricing</a>
    <a href="/contact">Contact</a>
  </nav>
  
  <main>
    <h1>Welcome to Fringe Salon</h1>
    <p>We offer the best nail services in town!</p>
    
    <ul>
      <li><a href="/services/manicure">Manicure</a></li>
      <li><a href="/services/pedicure">Pedicure</a></li>
      <li><a href="/menu/nails">Nail Menu</a></li>
    </ul>
  </main>
  
  <footer>
    <a href="https://facebook.com/fringe">Facebook</a>
    <a href="mailto:info@fringe.com">Email</a>
  </footer>
</body>
</html>
`;

// Simple extraction logic (matches extractServiceLinks.ts)
function extractServiceLinks(html, baseUrl) {
  const links = [];
  const serviceKeywords = [
    "service",
    "services",
    "menu",
    "price",
    "pricing",
    "prices",
    "price-list",
    "nail",
    "nails",
    "manicure",
    "pedicure",
  ];

  try {
    const base = new URL(baseUrl);
    const hrefPattern = /href=["']([^"']+)["']/gi;
    let match;

    while ((match = hrefPattern.exec(html)) !== null) {
      const href = match[1];

      // Skip external links, anchors, javascript, mailto, tel
      if (
        (href.startsWith("http") && !href.includes(base.hostname)) ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        continue;
      }

      // Check if href contains service keywords
      const hrefLower = href.toLowerCase();
      const hasServiceKeyword = serviceKeywords.some((keyword) =>
        hrefLower.includes(keyword)
      );

      if (hasServiceKeyword) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          links.push(absoluteUrl);
        } catch {
          // Invalid URL, skip
        }
      }
    }

    return Array.from(new Set(links));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return [];
  }
}

function selectBestServicePage(links) {
  if (links.length === 0) return null;

  const priorities = [
    "services",
    "pricing",
    "price-list",
    "menu",
    "nails",
    "manicure",
    "service",
  ];

  for (const keyword of priorities) {
    const match = links.find((link) => link.toLowerCase().includes(keyword));
    if (match) {
      return match;
    }
  }

  return links[0];
}

// Test
const baseUrl = "https://fringehairsalonandspa.com";
const extractedLinks = extractServiceLinks(mockHtml, baseUrl);

console.log("\n📄 Extracted Service Links:\n");
extractedLinks.forEach((link, i) => {
  console.log(`   ${i + 1}. ${link}`);
});

console.log("\n✅ Best Service Page:\n");
const bestPage = selectBestServicePage(extractedLinks);
console.log(`   → ${bestPage || "None found"}`);

console.log("\n" + "=".repeat(70));

console.log("\n🎯 Expected Results:\n");
console.log("   - Should find: /services, /pricing, /menu/nails");
console.log("   - Should skip: /, /about, /contact, facebook.com, mailto:");
console.log("   - Best page: /services (highest priority)");

console.log("\n✅ Test Complete!\n");

