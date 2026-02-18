# Render.com Deployment Guide

## 🎯 Objective

Deploy WhyNot to Render.com for production use. This guide walks you through creating a Render account, connecting your GitHub repository, and deploying the application.

---

## ⚙️ Prerequisites

- [x] Docker infrastructure complete (Phases 1-3)
- [x] `render.yaml` created
- [ ] GitHub repository accessible
- [ ] Render account (free to create)
- [ ] All environment variables ready (Agora, Cloudflare, Stripe)

---

## 📋 Step-by-Step Deployment

### Step 1: Create Render Account (5 min)

1. **Sign up**
   - Go to https://render.com
   - Click "Get Started for Free"
   - **Recommended**: Sign up with GitHub (easier repository access)
   - Verify your email address

2. **Confirm account**
   - Check your inbox for verification email
   - Click the verification link

---

### Step 2: Connect GitHub Repository (5 min)

1. **Navigate to Dashboard**
   - After login, you'll see the Render Dashboard
   - Click "New +" button (top right)
   - Select **"Blueprint"** (this uses render.yaml)

2. **Connect GitHub**
   - Click "Connect GitHub"
   - Authorize Render to access your GitHub account
   - Select the repositories you want to grant access to
   - Find and select **whynot** repository

3. **Configure Blueprint**
   - Render will detect `render.yaml` automatically
   - Service name: `whynot-backend`
   - Branch: `main` (or your default branch)
   - Click "Apply"

---

### Step 3: Configure Environment Variables (15 min)

Once the blueprint is applied, you'll need to set the SECRET environment variables manually.

#### 🔴 **IMPORTANT: Setup Redis First!**

Render doesn't support Redis natively. You need to use **Upstash** (free tier available):

1. **Create Upstash account**: https://upstash.com
2. **Create database**:
   - Name: `whynot-redis`
   - Type: Regional
   - Region: US-East-1 (or closest to oregon)
3. **Copy connection string**: Format `redis://default:XXX@us1-xxx.upstash.io:6379`
4. **Add to Render**: Environment → Add `REDIS_URL` with your Upstash URL

**See [RENDER_ENV_CHECKLIST.md](RENDER_ENV_CHECKLIST.md) for detailed Redis setup.**

---

#### Required Variables (must set before first deploy)

Go to: **Dashboard → whynot-backend → Environment**

**Redis** (from Upstash):

```
REDIS_URL=redis://default:XXXXXXX@us1-xxxxx.upstash.io:6379
```

**Agora RTC**:

```
AGORA_APP_ID=<your-app-id>
AGORA_APP_CERTIFICATE=<your-certificate>
AGORA_CUSTOMER_ID=<your-customer-id>
AGORA_CUSTOMER_SECRET=<your-customer-secret>
```

**Cloudflare Stream**:

```
CLOUDFLARE_STREAM_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_STREAM_API_TOKEN=<your-api-token>
```

**Stripe**:

```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
```

#### Optional Variables (AWS S3)

Only if using S3 for recordings:

```
AWS_S3_ACCESS_KEY=<your-access-key>
AWS_S3_SECRET_KEY=<your-secret-key>
AWS_S3_BUCKET=whynot-agora-recordings
```

#### Auto-populated Variables

These are set automatically from render.yaml:

- ✅ `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (from whynot-db)
- ✅ `NODE_ENV=production`
- ✅ `PORT=3000`
- ✅ `JWT_SECRET` (auto-generated securely)

**Note**: `REDIS_URL` must be set manually from Upstash (see above)

---

### Step 4: First Deployment (10-15 min)

1. **Trigger Deploy**
   - Render will auto-deploy when you apply the blueprint
   - Or click "Manual Deploy" → "Deploy latest commit"

2. **Monitor Build**
   - Watch the build logs in real-time
   - You'll see:

     ```
     Building Docker image...
     [1/3] Building deps...
     [2/3] Building application...
     [3/3] Creating production image...
     Successfully built image

     Deploying to Render...
     Health check passed ✓
     Deployment successful!
     ```

3. **Wait for Services**
   - **whynot-backend** (Web): ~2-3 minutes (first build)
   - **Redis** (Upstash): Already running (external service
   - **whynot-backend** (Web): ~2-3 minutes (first build)

4. **Check Status**
   - Dashboard shows "Live" when ready
   - Get your deployment URL: `https://whynot-backend-XXXX.onrender.com`

---

### Step 5: Run Migrations (5 min)

**⚠️ Important**: Run migrations before using the app!

#### Option A: Via Render Shell (Recommended)

1. Go to **Dashboard → whynot-backend → Shell**
2. Run:
   ```bash
   npm run migrate
   ```
3. Wait for "✅ All migrations completed"

#### Option B: Create Migration Job (Automated)

Add to `render.yaml` (for future migrations):

```yaml
jobs:
  - type: job
    name: whynot-migrations
    env: docker
    dockerfilePath: ./Dockerfile
    dockerCommand: npm run migrate
    envVars:
      # Same database connection as backend
      - key: DB_HOST
        fromDatabase:
          name: whynot-db
          property: host
      # ... (other DB vars)
```

Then run manually: **Dashboard → Jobs → whynot-migrations → Run Job**

---

### Step 6: Verify Deployment (10 min)

1. **Test Health Endpoint**

   ```bash
   curl https://whynot-backend-XXXX.onrender.com/health
   ```

   Expected:

   ```json
   {
     "status": "healthy",
     "timestamp": "2026-02-18T...",
     "uptime": 123.45,
     "environment": "production"
   }
   ```

2. **Test Frontend**
   - Open browser: `https://whynot-backend-XXXX.onrender.com`
   - Should show WhyNot homepage
   - Check browser console for errors

3. **Test API**

   ```bash
   curl https://whynot-backend-XXXX.onrender.com/trpc/auth.me
   ```

4. **Check Logs**
   - Dashboard → whynot-backend → Logs
   - Look for:
     ```
     ✅ Database connected successfully
     ✅ Redis connected successfully
     Server running on http://localhost:3000
     ```

5. **Check Metrics**
   - Dashboard → whynot-backend → Metrics
   - CPU, Memory, Request count should show activity

---

## 🔧 Troubleshooting

### Issue: "Build failed"

**Check**:

- Dockerfile syntax
- All dependencies in package.json
- Build logs for specific error

**Solution**:

```bash
# Test build locally first
docker build -t whynot-backend:latest .
```

---

### Issue: "Health check failed"

**Check**:

- /health endpoint exists
- Backend starts without errors
- Port 3000 exposed correctly

**Solution**:

- Increase health check timeout in render.yaml:
  ```yaml
  healthCheckPath: /health
  # Add more time for cold start
  ```

---

### Issue: "Database connection failed"

**Check**:

- Database service is running (Dashboard → whynot-db)
- Environment variables populated correctly

**Solution**:

- Verify DB_HOST, DB_PORT, etc. in Environment tab
- Check database logs

---

### Issue: "Service suspended (Free plan sleep)"

**Note**: Free Hobby plan sleeps after 15 minutes of inactivity

**Solutions**:

1. **Upgrade to Starter** ($7/month, never sleeps)
2. **Use uptime monitor** (e.g., UptimeRobot pings every 5 min)
3. **Accept cold starts** (~30s wake time)

---

## 💰 Cost Estimation

### Development/Testing

- Backend: **Hobby (Free)** - sleeps after 15 min
- Database: **Free** (1GB)
- Redis: **Upstash Free** (10K commands/day, 256MB)
- **Total**: **$0/month** ⚠️ with sleep

### Production (Recommended)

- Backend: **Starter** ($7/month)
- Database: **Free** (1GB) or Starter ($7/month) for 10GB
- Redis: **Upstash Free** (10K commands/day) or Pro ($10/month) for unlimited
- **Total**: **$7-24/month** ✅ no sleep

### Comparison

| Platform            | Monthly Cost    | Notes                  |
| ------------------- | --------------- | ---------------------- |
| Render (Dev)        | $0              | Free with sleep        |
| Render (Starter)    | $7              | No sleep, good for MVP |
| Render (Production) | $24             | More resources         |
| Heroku (Equivalent) | $815            | Previous setup         |
| **Savings**         | **97% cheaper** | 🎉                     |

---

## 🚀 Continuous Deployment

Once set up, Render auto-deploys on every push to `main`:

```bash
git add .
git commit -m "Add new feature"
git push origin main

# Render automatically:
# 1. Detects push
# 2. Builds Docker image
# 3. Runs health check
# 4. Deploys if successful
# 5. Switches traffic to new version
```

**Rollback**: Dashboard → Events → Select previous deploy → "Redeploy"

---

## 📝 Post-Deployment Checklist

- [ ] Health endpoint returns 200
- [ ] Frontend loads without errors
- [ ] Database migrations applied
- [ ] API endpoints work
- [ ] WebSocket connections work
- [ ] Logs show no critical errors
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)
- [ ] Monitoring/alerts set up

---

## 🔗 Useful Links

- **Render Dashboard**: https://dashboard.render.com
- **Render Docs**: https://render.com/docs
- **Blueprint Spec**: https://render.com/docs/blueprint-spec
- **Pricing**: https://render.com/pricing

---

## 🎉 Success!

Your WhyNot application is now live on Render! 🚀

**Next Steps**:

- Monitor logs for first 24 hours
- Test all features in production
- Set up custom domain (optional)
- Configure environment-specific settings
- Plan for FFmpeg worker deployment (next track)
