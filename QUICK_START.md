# 🚀 Quick Start - Deploy to Vercel in 5 Minutes

## Bước 1: Setup Database (Chọn 1 trong 3)

### Option A: Vercel Postgres (Khuyến nghị - Dễ nhất)
1. Vào [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database** → **Postgres**
3. Đặt tên database (ví dụ: `nail-spa-db`)
4. Chọn region gần bạn
5. Click **Create** → Database URL sẽ tự động thêm vào project

### Option B: Neon (Miễn phí tốt)
1. Vào [neon.tech](https://neon.tech) → Sign up
2. Create new project → Chọn region
3. Copy **Connection String**: `postgresql://...`

### Option C: Supabase
1. Vào [supabase.com](https://supabase.com) → New project
2. Settings → Database → Connection string
3. Chọn "URI" mode và copy

---

## Bước 2: Get Google Maps API Key

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project hoặc chọn existing project
3. Enable APIs:
   - **Maps JavaScript API**
   - **Places API** 
   - **Geocoding API**
4. Credentials → Create API Key
5. (Optional) Restrict API key:
   - Application restrictions: HTTP referrers
   - Add: `*.vercel.app/*`

---

## Bước 3: Generate JWT Secret

Chạy lệnh này để tạo JWT secret:

```bash
openssl rand -base64 32
```

Copy output (ví dụ: `abc123xyz789...`)

---

## Bước 4: Deploy to Vercel

### 4.1 Import Project

1. Vào [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Paste: `https://github.com/tridinhbui/nail-spa`
4. Click **Import**

### 4.2 Configure Environment Variables

Click **Environment Variables** và thêm:

| Variable Name | Value | Apply to |
|--------------|-------|----------|
| `DATABASE_URL` | `postgresql://...` (từ Bước 1) | Production, Preview, Development |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Your API key (từ Bước 2) | Production, Preview, Development |
| `JWT_SECRET` | Random string (từ Bước 3) | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | `https://YOUR_PROJECT.vercel.app` | Production |

**Lưu ý**: 
- Thay `YOUR_PROJECT` bằng tên project Vercel của bạn
- Hoặc để trống và update sau khi deploy

### 4.3 Deploy

1. Click **Deploy**
2. Đợi 2-3 phút để build
3. Click vào deployment URL khi xong

---

## Bước 5: Setup Database Schema

Sau khi deploy thành công, setup database:

### Method 1: Qua Terminal (Local)

```bash
# Set DATABASE_URL từ Vercel (copy từ Environment Variables)
export DATABASE_URL="postgresql://..."

# Push schema to database
npx prisma db push

# Verify
npx prisma studio
```

### Method 2: Qua Vercel Postgres Dashboard

Nếu dùng Vercel Postgres:
1. Vào Vercel Dashboard → Storage → Your Database
2. Tab **Data** → **Query**
3. Database schema sẽ tự động được tạo khi app chạy lần đầu

---

## Bước 6: Verify Deployment ✅

### Test Health Check:
```bash
curl https://YOUR_PROJECT.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-..."
}
```

### Open Application:
```
https://YOUR_PROJECT.vercel.app
```

---

## 🎉 Done!

Your Nail Spa Atlas is now live! 

### Next Steps:

1. **Test the search**: Nhập địa chỉ và tìm competitors
2. **Update API URL**: 
   - Vào Vercel → Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` với production URL
   - Redeploy
3. **Custom Domain** (Optional):
   - Vercel → Settings → Domains
   - Add your domain

---

## ⚠️ Troubleshooting

### Build Failed - Missing Environment Variables

**Lỗi**: `Environment variable not found: DATABASE_URL`

**Fix**:
1. Vào Vercel → Settings → Environment Variables
2. Ensure `DATABASE_URL` is added to **ALL environments** (Production, Preview, Development)
3. Click **Redeploy** (không cần push code mới)

### Database Connection Error

**Lỗi**: `Can't reach database server`

**Fix**:
1. Check DATABASE_URL format: `postgresql://user:password@host:5432/database`
2. Ensure database allows connections from `0.0.0.0/0` (all IPs)
3. Neon: Enable "Pooler" connection string
4. Supabase: Use "Transaction" mode connection string

### Google Maps Not Loading

**Fix**:
1. Verify API key in Environment Variables
2. Check Google Cloud Console:
   - APIs are enabled
   - Billing is enabled (required for production use)
   - API key restrictions allow your domain

### Function Timeout

**Fix**: Already configured in `vercel.json` (300 seconds for search/crawler)

If still timing out:
1. Reduce search radius
2. Limit competitor count
3. Optimize database queries

---

## 📞 Need Help?

- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Check Logs**: Deployment → Functions tab
- **Prisma Issues**: Run `npx prisma validate` locally
- **Full Guide**: See `VERCEL_DEPLOYMENT.md`

---

## 💡 Pro Tips

1. **Auto-deploy**: Mỗi khi push code mới, Vercel sẽ tự động deploy
2. **Preview URLs**: Mỗi Pull Request có preview URL riêng
3. **Rollback**: Có thể rollback về bất kỳ deployment nào
4. **Monitoring**: Enable Analytics trong Vercel Dashboard

Happy deploying! 💅✨

