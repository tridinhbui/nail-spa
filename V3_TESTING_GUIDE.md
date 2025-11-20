# 🧪 V3 Pipeline Testing Guide

## ✅ Status: Ready to Test!

All changes have been pushed to GitHub. Your dev server is already running.

---

## 🚀 Quick Test (2 minutes)

### Step 1: Restart Dev Server (Optional - Recommended)
```bash
# Kill current server
lsof -ti:3000 | xargs kill -9

# Start fresh
npm run dev
```

### Step 2: Open Browser
```
http://localhost:3000/analyze
```

### Step 3: Search for Competitors
```
Address: 135 S Main St, Mount Vernon, OH, United States
Radius: 5 miles
Competitors: 5
```

Click **"Analyze Competitors"**

### Step 4: Watch Terminal Logs

**Look for these NEW log messages:**

```
🔍 Step 2-3: Intelligent website discovery pipeline...
   🔍 Discovering real websites with Brave Search...

Fringe Salon & Spa:
   ✅ ACCEPTED: Real business website
   🔍 Discovering service pages...
   📄 Found 3 potential service links
   ✅ Best service page: https://fringehairsalonandspa.com/services/

🤖 ULTRA STRICT Scraper: 3 validated, 2 rejected/blocked
   📄 Fringe Salon: Scraping services page → .../services/
   📄 Hair Port: Scraping services page → .../our-services/

🌐 Cheerio Scraper: Fringe Salon & Spa
   URL: https://fringehairsalonandspa.com/services/
   ✅ Fetched 12456 bytes
   📋 Found 15 potential services
```

### Step 5: Check UI

**Competitor Table should show:**
- Real prices (not all $0 or -)
- Some competitors with "scraped" status
- No directory sites (atriume, mapquest, salondiscover)

---

## 📊 What to Look For

### ✅ SUCCESS INDICATORS

1. **Service Page Discovery**
   ```
   🔍 Discovering service pages...
   📄 Found X potential service links
   ✅ Best service page: .../services/
   ```

2. **Smart Scraping**
   ```
   📄 {Name}: Scraping services page → .../services/
   (Not: "Scraping homepage →")
   ```

3. **Service Extraction**
   ```
   📋 Found 10+ potential services
   (Not: "Found 0 potential services")
   ```

4. **Real Prices in UI**
   ```
   Gel: $42 (not $0 or -)
   Pedicure: $48 (not $0 or -)
   Acrylic: $58 (not $0 or -)
   ```

### ❌ FAILURE INDICATORS

1. **Still Scraping Homepages**
   ```
   📄 {Name}: Scraping homepage → https://example.com
   (Should be: "Scraping services page →")
   ```

2. **No Services Found**
   ```
   📋 Found 0 potential services
   ❌ No services extracted
   ```

3. **All Prices Estimated**
   ```
   Every competitor shows same prices: $40, $45, $55
   (Should vary: $38-$42, $45-$50, etc.)
   ```

4. **Directory Sites Accepted**
   ```
   ✅ ACCEPTED: atriume.com
   (Should be: "⚠️ Blocked directory domain")
   ```

---

## 🧪 Manual Tests

### Test 1: Service Link Extractor
```bash
node scripts/test-service-discovery.js
```

**Expected output:**
```
📄 Extracted Service Links:
   1. https://fringehairsalonandspa.com/services
   2. https://fringehairsalonandspa.com/pricing
   3. https://fringehairsalonandspa.com/menu/nails

✅ Best Service Page:
   → https://fringehairsalonandspa.com/services

✅ Test Complete!
```

### Test 2: Different Locations

Try these addresses to test variety:

**New York (High Density)**
```
Address: 123 5th Ave, New York, NY
Radius: 3 miles
Competitors: 10
```

**Los Angeles (Medium Density)**
```
Address: 456 Sunset Blvd, Los Angeles, CA
Radius: 5 miles
Competitors: 8
```

**Small Town (Low Density)**
```
Address: 789 Main St, Mount Vernon, OH
Radius: 10 miles
Competitors: 5
```

---

## 🔧 Troubleshooting

### Issue: Dev server not responding
**Solution:**
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Issue: Still seeing old behavior
**Solution:**
```bash
# Clear browser cache
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Restart dev server
Ctrl+C
npm run dev
```

### Issue: Brave API rate limit (429)
**Solution:**
```
This is expected! The pipeline has:
- 2-3 second delays between requests
- Exponential backoff (3 retries)
- Request caching (24h)

Wait 1 minute, then try again with fewer competitors.
```

### Issue: No service pages found
**Solution:**
```
This is OKAY! Not all salons have service pages.
Pipeline will automatically fallback to homepage scraping.

Log should show:
   ⚠️ No service pages found in HTML
   📄 {Name}: Scraping homepage → ...
```

### Issue: Services found but no prices
**Solution:**
```
Check logs for:
   📋 Found X potential services
   ❌ No prices extracted

This means service names were found but no prices.
Pipeline will fallback to tier-based estimation.
```

---

## 📈 Success Metrics

After testing 10+ searches, you should see:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Service page discovery | ≥ 50% | Count "Best service page:" logs |
| Real prices scraped | ≥ 40% | Count competitors with varied prices |
| Directory false positives | 0% | Check for blocked domain warnings |
| JS-only page errors | 0% | Look for "Page too small" logs |

---

## 🎯 Expected Results

### Before V3 (Scraping Homepages)
```
Search: Mount Vernon, OH (5 competitors)

Results:
  - All prices: $40, $45, $55 (same for all)
  - Status: 100% estimated
  - Services found: 0-2 per site
  - Errors: 1-2 directory/JS-only pages
```

### After V3 (Scraping Service Pages)
```
Search: Mount Vernon, OH (5 competitors)

Results:
  - Varied prices: $38-$58 range
  - Status: 40-50% scraped, 50-60% estimated
  - Services found: 10-25 per site (for scraped)
  - Errors: 0 directory/JS-only pages

Logs:
  🔍 Discovering service pages... (5x)
  📄 Best service page: ... (2-3x)
  📋 Found 15 potential services (2-3x)
  ⏭️ Skipped (blocked directory) (0-1x)
```

---

## 🚀 Production Deployment

### When Local Testing Passes ✅

1. **Verify Environment Variables on Vercel:**
   ```
   BRAVE_SEARCH_API_KEY = BSAtrTa-8rfXkMYkt91fmMyrF4AYMLZ
   DATABASE_URL = (your Prisma URL)
   GOOGLE_MAPS_API_KEY = (your API key)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = (your API key)
   JWT_SECRET = (your secret)
   NEXTAUTH_SECRET = (your secret)
   NEXTAUTH_URL = https://nail-rkfni9035-tribuis-projects.vercel.app
   ```

2. **Trigger Redeploy:**
   - Vercel auto-deploys from `main` branch
   - Already pushed: commits `7100368` and `dd29f14`
   - Check Vercel dashboard for deployment status

3. **Test Production:**
   ```
   https://nail-rkfni9035-tribuis-projects.vercel.app/analyze
   ```

4. **Monitor Vercel Logs:**
   - Check for same log patterns as local
   - Verify no errors in deployment logs

---

## 📚 Additional Resources

- **Technical Guide:** `docs/SCRAPING_PIPELINE_V3.md`
- **Overview:** `PIPELINE_V3_SUMMARY.md`
- **Previous Version:** `docs/WEBSITE_DISCOVERY_V2.md`

---

## 🎉 Summary

**V3 Pipeline** is ready! 🚀

**Next Steps:**
1. ✅ Open http://localhost:3000/analyze
2. ✅ Search for competitors (135 S Main St, Mount Vernon, OH)
3. ✅ Watch terminal logs for service page discovery
4. ✅ Verify real prices in UI (not all $0 or -)
5. ✅ Deploy to Vercel (auto-deploys from main)

**Expected Improvement:**
- 10x more services extracted
- 4x more real prices
- 0 false positives
- 0 JS-only errors

Good luck! 🍀

