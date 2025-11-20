# 🎯 Scraping Pipeline V3: Service Page Discovery

## Overview

Complete refactor of the web scraping pipeline to **scrape REAL service pages** instead of homepages, ensuring maximum price extraction accuracy.

---

## 🔑 Key Improvements

### 1. Service Page Discovery
**Problem:** Previously scraped homepages, which often lack pricing.

**Solution:** 
- After finding a business website, analyze homepage HTML
- Extract **all internal links** containing service keywords:
  - `services`, `service`, `menu`, `nails`, `pricing`, `price-list`
- Build absolute URLs and prioritize them over homepage
- Log: `📄 Found 3 potential service links`

### 2. Smart URL Priority
**Problem:** Used homepage even when service pages were available.

**Solution:**
```typescript
// Priority order for scraping:
1. servicesPage (discovered via Brave Search)
2. menuPage (discovered via Brave Search)
3. discoveredServiceLink (internal link from homepage)
4. homepage (fallback only)
```

### 3. Enhanced Content Validation
**Problem:** Scraped directory sites and JS-only pages.

**Solution:**
- **Size check:** Reject pages < 5000 chars (likely JS-only)
- **Directory keywords:** Reject pages containing:
  - `"directory"`, `"find businesses"`, `"review site"`, etc.
- **Redirect loop detection:** Max 5 redirects, detect circular redirects

### 4. Improved Service Extraction
**Problem:** Extracted non-nail services or missed valid services.

**Solution:**
- **Keyword filtering:** Only extract text containing nail keywords:
  - `manicure`, `pedicure`, `gel`, `acrylic`, `nail`, `nails`, `polish`, `dip`, `powder`, `spa`
- **Multi-tag search:** Extract from:
  - `h1-h6` (service titles)
  - `li` (menu lists)
  - `div, p, span` (price blocks)
- **Better patterns:**
  - `$xx`, `xx dollars`, `xx usd`, `starting at $xx`, `from $xx`

---

## 📂 Architecture

### New Files

#### `lib/utils/extractServiceLinks.ts`
- `extractServiceLinks(html, baseUrl)` → Extract internal service/menu/pricing links
- `selectBestServicePage(links)` → Priority: services > pricing > menu > nails
- `isLikelyJsOnlyPage(html)` → Detect pages < 5000 chars
- `containsDirectoryPatterns(html)` → Detect directory/review sites

#### Updated Files

1. **`lib/search/websiteDiscovery.ts`**
   - Integrated `extractServiceLinks` after fetching homepage
   - Logs: `🔍 Discovering service pages...`
   - Returns: `{ homepage, servicesPage, menuPage, ... }`

2. **`lib/scraping/scraper.ts`**
   - Accepts `{ website, servicesPage, menuPage }` for each competitor
   - Determines `scrapeUrl = servicesPage || menuPage || website`
   - Logs: `📄 Fringe Salon: Scraping services page → .../services/`

3. **`lib/scraping/cheerio-scraper.ts`**
   - Redirect loop detection (max 5 redirects)
   - Rejects pages < 5000 chars
   - Rejects directory pages after fetch
   - Enhanced service extraction with nail keyword filtering

4. **`app/api/competitors/search/route.ts`**
   - Passes `{ website, servicesPage, menuPage }` to scraper
   - Logs scraping target for each competitor

---

## 🔄 Pipeline Flow

```
1. Google Places API
   ↓
   Returns: name, address, phone, initialWebsite

2. Website Discovery (Brave Search)
   ↓
   Query: "{name} {address} nail salon website"
   ↓
   Find: homepage
   ↓
   Fetch homepage HTML
   ↓
   Extract internal links: /services/, /menu/, /pricing/
   ↓
   Return: { homepage, servicesPage, menuPage }

3. Domain Classifier
   ↓
   Validate: score >= 20, not blacklisted
   ↓
   If invalid → skip scraping

4. Smart Scraper
   ↓
   Determine scrapeUrl = servicesPage || menuPage || homepage
   ↓
   Fetch scrapeUrl
   ↓
   Validate: size >= 5000, no directory keywords
   ↓
   Extract services (h1-h6, li, div, p, span) with nail keywords
   ↓
   Parse prices: $xx, xx dollars, starting at $xx
   ↓
   Categorize: gel, pedicure, acrylic
   ↓
   Return: { gel: 40, pedicure: 45, acrylic: 55 }

5. Fallback Estimation
   ↓
   If scraping fails → use Google Maps price level (tier-based)
```

---

## 🎯 Expected Outcomes

### Before (V2)
```
Fringe Salon
  Scraping: fringehairsalonandspa.com (homepage)
  Result: 0 services found → estimated

Hair Port
  Scraping: hairport.com (homepage)
  Result: 0 services found → estimated
```

### After (V3)
```
Fringe Salon
  Discovery: fringehairsalonandspa.com
  Service links: /services/, /menu/
  Scraping: fringehairsalonandspa.com/services/
  Result: 15 services found → scraped ✅

Hair Port
  Discovery: hairport.com
  Service links: /our-services/, /pricing/
  Scraping: hairport.com/our-services/
  Result: 22 services found → scraped ✅
```

---

## 🧪 Testing

### Test 1: Real salon website
```bash
curl "http://localhost:3000/api/competitors/search" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Main St, New York, NY",
    "radius": 5,
    "competitorCount": 3,
    "lat": 40.7128,
    "lng": -74.0060
  }'
```

**Check logs for:**
```
🔍 Discovering service pages...
📄 Found 3 potential service links
✅ Best service page: .../services/
📄 Fringe Salon: Scraping services page → .../services/
✅ Fetched 12456 bytes
📋 Found 15 potential services
```

### Test 2: Verify no directory scraping
```
⚠️ Blocked directory domain: atriume.com
❌ Invalid real-business website: Score 5 < 20
⏭️ Fringe Salon: Skipped (blocked directory)
```

---

## 📊 Metrics

### Success Criteria
- **Website discovery accuracy:** ≥ 70%
- **Service page discovery rate:** ≥ 50%
- **Price extraction rate:** ≥ 40% (from service pages)
- **False positives (directories):** 0%

### Expected Results
| Competitor | Homepage | Service Page | Scraped? | Prices |
|-----------|----------|--------------|----------|--------|
| Fringe Salon | ✅ | ✅ /services/ | ✅ | 15 |
| Hair Port | ✅ | ✅ /our-services/ | ✅ | 22 |
| Budget Nails | ✅ | ❌ | ❌ | 0 (estimated) |
| Luxury Spa | ✅ (FB) | ❌ | ❌ | 0 (estimated) |

---

## 🚀 Deployment

### Local Testing
1. Restart dev server: `npm run dev`
2. Clear browser cache: `Cmd+Shift+R`
3. Search on `/analyze` page
4. Check terminal logs for service page discovery

### Production (Vercel)
1. Commit and push changes
2. Verify environment variables:
   - `BRAVE_SEARCH_API_KEY`
3. Redeploy on Vercel
4. Test with real searches

---

## 🔧 Troubleshooting

### No service pages found
- **Cause:** Homepage doesn't link to service pages
- **Solution:** Fallback to homepage scraping (automatic)

### Directory pages still scraped
- **Cause:** New directory domain not blacklisted
- **Solution:** Add to `BLACKLISTED_DOMAINS` in `domainClassifier.ts`

### Prices not extracted
- **Cause:** Unusual price format or no nail keywords
- **Solution:**
  1. Add new price pattern to `extractPrices()` regex
  2. Add new nail keyword to extraction filters

### JS-only pages
- **Cause:** Page < 5000 chars
- **Solution:** Automatic rejection, fallback to estimation

---

## 📝 Code Examples

### Extract Service Links
```typescript
import { extractServiceLinks, selectBestServicePage } from "@/lib/utils/extractServiceLinks";

const html = await fetchHtml("https://example.com");
const links = extractServiceLinks(html, "https://example.com");
// Returns: ["/services/", "/pricing/", "/menu/"]

const bestPage = selectBestServicePage(links);
// Returns: "https://example.com/services/"
```

### Smart Scraping
```typescript
import { batchSmartScrape } from "@/lib/scraping/scraper";

const results = await batchSmartScrape([
  {
    name: "Fringe Salon",
    website: "https://fringehairsalonandspa.com",
    servicesPage: "https://fringehairsalonandspa.com/services/",
    websiteScore: 35
  }
]);

// Scraper will use servicesPage if available
```

---

## 🎉 Summary

**V3 Scraping Pipeline** ensures:
1. ✅ Service pages are discovered and prioritized
2. ✅ Homepages are scraped only as fallback
3. ✅ Directory/review sites are rejected
4. ✅ JS-only pages are detected and skipped
5. ✅ Only nail-related services are extracted
6. ✅ Redirect loops are prevented
7. ✅ Robust fallback to tier-based estimation

**Result:** Higher price extraction accuracy and zero false positives! 🚀

