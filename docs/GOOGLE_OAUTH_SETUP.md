# Google OAuth Setup Guide

## Hướng Dẫn Cấu Hình Google Sign-In

### 📋 Prerequisites

- Google account
- Project deployed on Vercel hoặc có domain/localhost

---

## 🔧 Bước 1: Google Cloud Console Setup

### 1.1 Tạo Project

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Đặt tên: `Nail Spa Atlas`
4. Click **"Create"**

### 1.2 Enable APIs

1. Vào **APIs & Services** → **Library**
2. Tìm và enable:
   - Google+ API (for OAuth)

### 1.3 Configure OAuth Consent Screen

1. Vào **APIs & Services** → **OAuth consent screen**
2. Chọn **External** (cho public users)
3. Điền thông tin:
   - **App name**: `Nail Spa Atlas`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. **Scopes**: Click **Add or Remove Scopes**
   - Select: `email`, `profile`, `openid`
   - Click **Update** → **Save and Continue**
6. **Test users** (optional for development): Add your email
7. Click **Save and Continue** → **Back to Dashboard**

### 1.4 Create OAuth Credentials

1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Chọn **Application type**: `Web application`
4. Đặt tên: `Nail Spa Atlas Web`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://nail-rkfni9035-tribuis-projects.vercel.app
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://nail-rkfni9035-tribuis-projects.vercel.app/api/auth/callback/google
   ```
7. Click **Create**
8. **Copy Client ID và Client Secret** (sẽ cần ở bước sau)

---

## 🔐 Bước 2: Environment Variables

### 2.1 Local Development (.env)

Tạo/update file `.env`:

```env
# NextAuth
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id-from-google-console"
GOOGLE_CLIENT_SECRET="your-client-secret-from-google-console"
```

### 2.2 Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy output vào `NEXTAUTH_SECRET`

### 2.3 Production (Vercel)

1. Vào Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Add từng biến:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXTAUTH_SECRET` | (từ openssl rand) | Production, Preview |
| `NEXTAUTH_URL` | `https://nail-rkfni9035-tribuis-projects.vercel.app` | Production |
| `NEXTAUTH_URL` | `https://nail-rkfni9035-tribuis-projects.vercel.app` | Preview |
| `GOOGLE_CLIENT_ID` | (từ Google Console) | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | (từ Google Console) | Production, Preview, Development |

4. Click **Save** cho mỗi variable
5. Redeploy app

---

## ✅ Bước 3: Test Authentication

### 3.1 Local Testing

```bash
npm run dev
```

Visit: http://localhost:3000/auth/signin

1. Click **"Continue with Google"**
2. Select your Google account
3. Grant permissions
4. Should redirect to `/analyze`
5. Check if signed in

### 3.2 Test Email/Password

1. Go to http://localhost:3000/auth/signup
2. Fill in:
   - Salon Name (optional)
   - Email
   - Password (min 6 chars)
3. Click **"Sign Up"**
4. Should auto sign-in and redirect to `/analyze`

---

## 🗄️ Bước 4: Database Check

After first Google sign-in, check database:

```bash
npx prisma studio
```

Should see new user in `User` table with:
- `email` from Google
- `salonName` from Google profile name
- `passwordHash` = empty (OAuth user)

---

## 🔍 Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: Redirect URI not whitelisted

**Fix**:
1. Go to Google Cloud Console → Credentials
2. Edit OAuth client
3. Add exact redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Save

### Error: "access_denied"

**Cause**: User cancelled or app not verified

**Fix**:
- For development: Add user as test user
- For production: Submit app for verification

### Error: "invalid_client"

**Cause**: Wrong Client ID or Secret

**Fix**:
- Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Ensure no extra spaces
- Regenerate credentials if needed

### Error: "NEXTAUTH_URL missing"

**Fix**:
```env
NEXTAUTH_URL="http://localhost:3000"
```

### Google Sign-in Button Not Working

**Debug**:
1. Check browser console for errors
2. Verify all env vars are set
3. Restart dev server: `npm run dev`
4. Clear browser cookies

---

## 🎨 Customization

### Change Button Text

`app/auth/signin/page.tsx`:

```typescript
<Button onClick={handleGoogleSignIn}>
  <Chrome className="mr-2 h-4 w-4" />
  Sign in with Google  // <- Change this
</Button>
```

### Add More OAuth Providers

Install provider:
```bash
npm install next-auth
```

Update `app/api/auth/[...nextauth]/route.ts`:

```typescript
import GitHubProvider from "next-auth/providers/github";

providers: [
  GoogleProvider({...}),
  GitHubProvider({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }),
]
```

---

## 📊 Usage Analytics

Track sign-ups in database:

```sql
-- Count users by auth method
SELECT 
  CASE 
    WHEN passwordHash = '' THEN 'OAuth'
    ELSE 'Email'
  END as auth_method,
  COUNT(*) as count
FROM users
GROUP BY auth_method;
```

---

## 🔒 Security Best Practices

1. ✅ **Never commit credentials** to git
2. ✅ **Use strong NEXTAUTH_SECRET** (32+ chars)
3. ✅ **Restrict OAuth redirect URIs** to your domains only
4. ✅ **Enable HTTPS** in production
5. ✅ **Rotate secrets** periodically
6. ✅ **Monitor OAuth quota** in Google Console

---

## 📱 Mobile OAuth

For mobile apps, use:
- React Native: `expo-auth-session`
- Flutter: `google_sign_in`

Configure different OAuth client for mobile platform.

---

## 🚀 Production Checklist

- [ ] OAuth credentials created
- [ ] Redirect URIs configured for production domain
- [ ] Environment variables set in Vercel
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] `NEXTAUTH_URL` points to production domain
- [ ] Tested sign-in on production
- [ ] Tested sign-up on production
- [ ] Database user creation working
- [ ] Session persistence working

---

## 🆘 Support

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

✅ Setup Complete! Users can now sign in with Google! 🎉

