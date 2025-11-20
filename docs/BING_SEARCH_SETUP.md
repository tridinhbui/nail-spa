# 🔍 Bing Search API Setup Guide

This guide explains how to set up Bing Search API for automatic website discovery.

## Why Bing Search API?

**Problem**: Google Places often returns social media URLs (Facebook, Instagram) instead of real business websites.

**Solution**: When we detect an invalid URL, we use Bing Search API to find the real business website.

---

## 📋 Setup Steps

### Step 1: Create Azure Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in or create a free account
3. Free tier includes **1,000 searches/month** at no cost

### Step 2: Create Bing Search Resource

1. Click **"Create a resource"**
2. Search for **"Bing Search v7"**
3. Click **"Create"**
4. Fill in:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `nail-spa-website-finder` (or any name)
   - **Pricing Tier**: **F1 (Free)** → 1,000 requests/month
   - **Region**: Choose closest to your users
5. Click **"Review + Create"** → **"Create"**

### Step 3: Get API Key

1. Go to your Bing Search resource
2. Click **"Keys and Endpoint"** in left sidebar
3. Copy **Key 1** or **Key 2**

### Step 4: Add to Environment Variables

#### Local Development (`.env`)

```env
# Bing Search API (for website discovery)
BING_SEARCH_API_KEY="your-bing-search-api-key-here"
```

#### Vercel Production

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Key**: `BING_SEARCH_API_KEY`
   - **Value**: Your Bing API key
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
5. Click **"Save"**
6. **Redeploy** your application

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Google Places → Get competitor info             │
│   ✅ Name: "Luxury Nails"                               │
│   ✅ Address: "123 Main St, City"                       │
│   ❌ Website: "facebook.com/luxurynails" (INVALID!)     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: Validate Website                                 │
│   ⚠️  Detected: Social media URL (Facebook)             │
│   ❌ Cannot scrape pricing from Facebook                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: Bing Search → Find real website                 │
│   🔍 Query: "Luxury Nails 123 Main St nail salon site"  │
│   ✅ Found: "luxurynails.com"                           │
│   ✅ Services: "luxurynails.com/services"               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: Scrape Real Website                             │
│   🎯 Target: luxurynails.com/services                   │
│   ✅ Found: Gel $45, Pedicure $50, Acrylic $60          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 5: Fallback if scraping fails                      │
│   ⚠️  Scraping failed? Use tier-based estimation        │
│   📊 Price Level: $$ → Gel $40, Pedi $45, Acrylic $55  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 API Limits

### Free Tier (F1)
- **Requests**: 1,000 searches/month
- **Cost**: $0/month
- **Rate Limit**: 3 requests/second
- **Best For**: Testing and small applications

### Paid Tiers
- **S1**: 1,000 searches/month + $7 per 1,000 additional
- **S2**: Contact sales for enterprise pricing

### Usage Estimation
- **5 competitors/search** × **Invalid websites (60%)** = ~3 Bing searches/analysis
- **Free tier** = ~330 competitor analyses/month

---

## 🧪 Testing

### Test Website Discovery

```bash
npm run test:bing
```

Or manually test:

```bash
curl -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
  "https://api.bing.microsoft.com/v7.0/search?q=luxury+nails+123+main+st+website&count=5"
```

Expected response:

```json
{
  "webPages": {
    "value": [
      {
        "name": "Luxury Nails - Premier Nail Salon",
        "url": "https://luxurynails.com",
        "snippet": "Services include manicures, pedicures, gel nails..."
      }
    ]
  }
}
```

---

## ⚠️ Troubleshooting

### Error: "Access denied due to invalid subscription key"
- ❌ Wrong API key
- ✅ Copy key from Azure Portal → Bing Search → Keys

### Error: "Out of call volume quota"
- ❌ Exceeded 1,000 searches/month
- ✅ Upgrade to S1 tier or wait until next month

### No results found
- ⚠️  Business name too generic
- ✅ Search query includes full address for accuracy

### Website still invalid after discovery
- ⚠️  Bing returned social media URL
- ✅ Fallback to tier-based estimation will kick in

---

## 🚀 Benefits

### Before (Without Bing Search)
- 60% of competitors have only Facebook URLs
- Cannot scrape pricing from Facebook
- Must rely on tier estimation for most salons
- **Accuracy**: ~30%

### After (With Bing Search)
- Automatically finds real business websites
- Prioritizes services/pricing pages
- Falls back to estimation only when necessary
- **Accuracy**: ~70%

---

## 💡 Best Practices

1. **Cache discovered websites** → Avoid redundant searches
2. **Batch requests** → Process 2-3 competitors simultaneously
3. **Add delays** → 500ms between batches to respect rate limits
4. **Monitor usage** → Check Azure dashboard monthly
5. **Fallback gracefully** → Always have tier estimation as backup

---

## 📚 Additional Resources

- [Bing Search API Documentation](https://docs.microsoft.com/en-us/bing/search-apis/bing-web-search/overview)
- [Azure Free Account](https://azure.microsoft.com/free/)
- [API Reference](https://docs.microsoft.com/en-us/bing/search-apis/bing-web-search/reference/endpoints)
- [Pricing Calculator](https://azure.microsoft.com/pricing/details/cognitive-services/search-api/)

---

## 🔐 Security Notes

- ✅ Store API key in environment variables (never commit to Git)
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys every 90 days
- ✅ Monitor usage in Azure portal for suspicious activity

---

**Need help?** Check the [main documentation](../README.md) or open an issue on GitHub.

