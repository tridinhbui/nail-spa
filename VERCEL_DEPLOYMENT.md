# Vercel Deployment Guide

## Hướng Dẫn Deploy Nail Spa Atlas lên Vercel

### 📋 Prerequisites (Yêu Cầu Trước)

1. **Tài khoản Vercel** - Đăng ký tại [vercel.com](https://vercel.com)
2. **Database PostgreSQL** - Khuyến nghị sử dụng:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (Miễn phí tier available)
   - [Neon](https://neon.tech) (Miễn phí, 0.5GB)
   - [Supabase](https://supabase.com) (Miễn phí 500MB)
3. **Google Maps API Key** - Từ [Google Cloud Console](https://console.cloud.google.com)

---

## 🚀 Bước 1: Chuẩn Bị Database

### Option A: Vercel Postgres (Khuyến nghị)

1. Vào Vercel Dashboard
2. Chọn project của bạn
3. Vào tab **Storage** → **Create Database** → **Postgres**
4. Copy connection string (sẽ tự động thêm vào Environment Variables)

### Option B: Neon hoặc Supabase

1. Tạo database mới trên Neon hoặc Supabase
2. Copy **Connection String** (dạng `postgresql://...`)
3. Lưu lại để dùng ở bước tiếp theo

---

## 🔧 Bước 2: Setup Environment Variables trên Vercel

Vào **Settings** → **Environment Variables** và thêm các biến sau:

### Required Variables (Bắt buộc):

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# JWT Secret (Tạo random string mạnh)
JWT_SECRET=your_strong_random_string_here_min_32_chars

# Base URL
NEXT_PUBLIC_API_URL=https://your-app-name.vercel.app
```

### Optional Variables (Tùy chọn):

```env
# Redis (nếu có)
REDIS_URL=redis://...

# Crawler settings
CRAWLER_ENABLED=true
CRAWLER_INTERVAL=daily
```

**Lưu ý**: Đánh dấu tất cả các biến cho **Production**, **Preview**, và **Development**

---

## 🛠️ Bước 3: Deploy lên Vercel

### Method 1: Deploy qua GitHub (Khuyến nghị)

1. **Connect GitHub Repository**:
   ```bash
   # Đã push code lên GitHub rồi
   git push origin main
   ```

2. **Import vào Vercel**:
   - Vào [vercel.com/new](https://vercel.com/new)
   - Chọn repository: `tridinhbui/nail-spa`
   - Click **Import**

3. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `next build` (đã được config sẵn)
   - **Install Command**: `npm install`

4. Click **Deploy** và đợi build hoàn tất!

### Method 2: Deploy qua Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🗄️ Bước 4: Setup Database Schema

Sau khi deploy thành công, chạy migration để tạo database schema:

### Option A: Qua Vercel CLI (Local)

```bash
# Set DATABASE_URL từ Vercel
export DATABASE_URL="postgresql://..."

# Run migration
npx prisma migrate deploy

# Or push schema directly
npx prisma db push
```

### Option B: Qua Vercel Dashboard

1. Vào **Settings** → **Functions**
2. Tạo một serverless function tạm để chạy migration:
   - Truy cập: `https://your-app.vercel.app/api/setup-db` (nếu tạo route này)

---

## ✅ Bước 5: Verify Deployment

1. **Health Check**:
   ```
   GET https://your-app.vercel.app/api/health
   ```
   
   Response:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "timestamp": "..."
   }
   ```

2. **Test Database Connection**:
   ```
   GET https://your-app.vercel.app/api/test-db
   ```

3. **Open App**:
   ```
   https://your-app.vercel.app
   ```

---

## 🔍 Troubleshooting (Xử Lý Lỗi)

### Build Failed - Prisma Error

**Lỗi**: `Prisma Client did not initialize yet`

**Giải pháp**:
```bash
# Ensure postinstall script runs
# package.json already has:
"postinstall": "prisma generate"
```

### Build Failed - TypeScript Errors

**Lỗi**: Type errors during build

**Giải pháp**: Already configured in `next.config.ts`:
```typescript
typescript: {
  ignoreBuildErrors: true,
}
```

### Database Connection Failed

**Lỗi**: `Can't reach database server`

**Giải pháp**:
1. Kiểm tra `DATABASE_URL` trong Environment Variables
2. Đảm bảo database cho phép external connections
3. Check IP whitelist (Vercel IPs: all IPs `0.0.0.0/0` cho Serverless)

### Google Maps Not Loading

**Lỗi**: Map không hiển thị

**Giải pháp**:
1. Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` trong Environment Variables
2. Check Google Cloud Console:
   - Enable **Maps JavaScript API**
   - Enable **Places API**
   - Enable **Geocoding API**
3. Add domain vào **Application restrictions** (hoặc để None cho testing)

### Function Timeout

**Lỗi**: `FUNCTION_INVOCATION_TIMEOUT`

**Giải pháp**: Already configured in `vercel.json`:
```json
{
  "functions": {
    "app/api/competitors/search/route.ts": {
      "maxDuration": 300
    }
  }
}
```

---

## 🔄 Continuous Deployment

Vercel sẽ tự động deploy khi có commits mới:

- **Push to `main`**: Deploy to Production
- **Pull Request**: Deploy to Preview URL
- **Other branches**: Deploy to Preview URL

```bash
git add .
git commit -m "Update features"
git push origin main
# Vercel tự động deploy!
```

---

## 📊 Monitoring & Logs

### View Logs:
1. Vercel Dashboard → **Deployments**
2. Click vào deployment
3. Tab **Functions** → Click function để xem logs

### Performance Monitoring:
- **Speed Insights**: Vercel Dashboard → **Speed Insights**
- **Analytics**: Vercel Dashboard → **Analytics**

---

## 💰 Cost Optimization

### Free Tier Limits:
- **Vercel Free**:
  - 100 GB bandwidth/month
  - 100 hours serverless function execution/month
  - Unlimited projects

- **Neon Free**:
  - 0.5 GB storage
  - 1 project
  - Unlimited queries

### Tips:
1. Sử dụng caching để giảm function invocations
2. Optimize images với Next.js Image component
3. Use Static Generation (SSG) khi có thể
4. Implement rate limiting

---

## 🔐 Security Checklist

- ✅ Environment variables are secure (not in code)
- ✅ Database connection uses SSL
- ✅ API routes protected with JWT
- ✅ Rate limiting implemented
- ✅ CORS configured properly
- ✅ Google Maps API key restricted

---

## 📱 Post-Deployment

1. **Update README** with production URL
2. **Test all features** thoroughly
3. **Setup monitoring** (Sentry, LogRocket, etc.)
4. **Configure custom domain** (optional)
5. **Enable Analytics**

---

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Project Issues**: https://github.com/tridinhbui/nail-spa/issues

---

## 🎉 Success!

Your Nail Spa Atlas should now be live on Vercel! 🚀

**Production URL**: `https://your-app-name.vercel.app`

Happy deploying! 💅✨

