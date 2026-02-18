# Phase 4: Render Deployment Setup

**Duration**: 2-3 hours  
**Status**: ⬜ Not Started

---

## 🎯 Objective

Create Render.com deployment configuration, set up the project on Render, and successfully deploy the WhyNot application to production.

---

## 📋 Tasks

### Task 4.1: Create render.yaml (45min)

**Goal**: Define Render infrastructure as code.

**New file**: `render.yaml`

```yaml
services:
  # ============================================
  # Backend Service (Web)
  # ============================================
  - type: web
    name: whynot-backend
    env: docker
    dockerfilePath: ./Dockerfile
    region: oregon # or frankfurt, singapore, etc.
    plan: starter # hobby (free), starter ($7), standard ($25), pro ($85)
    healthCheckPath: /health
    envVars:
      # Database Connection
      - key: DATABASE_URL
        fromDatabase:
          name: whynot-db
          property: connectionString

      # Redis Connection
      - key: REDIS_URL
        fromService:
          type: redis
          name: whynot-redis
          property: connectionString

      # Application
      - key: NODE_ENV
        value: production

      - key: PORT
        value: 3000

      # Agora (from Render secret groups)
      - key: AGORA_APP_ID
        sync: false # Manual entry in Render dashboard

      - key: AGORA_CERTIFICATE
        sync: false

      - key: AGORA_CUSTOMER_ID
        sync: false

      - key: AGORA_CUSTOMER_SECRET
        sync: false

      # Cloudflare
      - key: CLOUDFLARE_ACCOUNT_ID
        sync: false

      - key: CLOUDFLARE_API_TOKEN
        sync: false

      # AWS (Optional)
      - key: AWS_ACCESS_KEY_ID
        sync: false

      - key: AWS_SECRET_ACCESS_KEY
        sync: false

      - key: AWS_S3_BUCKET
        sync: false

      - key: AWS_REGION
        value: us-east-1

      # Stripe (Optional)
      - key: STRIPE_SECRET_KEY
        sync: false

      - key: STRIPE_WEBHOOK_SECRET
        sync: false

# ============================================
# Databases
# ============================================
databases:
  - name: whynot-db
    databaseName: whynot
    user: postgres
    plan: free # free (1GB), starter ($7), standard ($20+)
    region: oregon
    ipAllowList: [] # Empty = allow all

  - name: whynot-redis
    plan: free # free (25MB), starter ($10), standard ($50+)
    maxmemoryPolicy: allkeys-lru # Evict least recently used
    region: oregon
    ipAllowList: []
```

**Steps**:

1. Create `render.yaml` in project root
2. Paste configuration above
3. Customize region if needed (oregon, frankfurt, etc.)

**Acceptance Criteria**:

- [ ] render.yaml created
- [ ] All services defined
- [ ] Environment variables configured
- [ ] Database connections mapped

---

### Task 4.2: Create Render Account & Project (20min)

**Goal**: Set up Render account and connect GitHub repo.

**Steps**:

1. Create Render account
   - Go to https://render.com
   - Sign up with GitHub (recommended)
   - Verify email

2. Connect GitHub repository
   - Dashboard → New → Web Service
   - Select "Deploy from Git repository"
   - Connect GitHub account
   - Select `whynot` repository
   - Authorize Render access

3. Configure deployment settings
   - **Build Command**: (leave empty, Docker handles it)
   - **Start Command**: (leave empty, Dockerfile CMD handles it)
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Branch**: `main`

4. Choose plan
   - **For PoC/Testing**: Hobby (Free, but sleeps after 15min)
   - **For Development**: Starter ($7/month)
   - **For Production**: Standard ($25/month) or Pro ($85/month)

**Acceptance Criteria**:

- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Project configured

---

### Task 4.3: Configure Environment Variables (45min)

**Goal**: Set all required secrets in Render dashboard.

**Steps**:

1. Navigate to service settings
   - Dashboard → whynot-backend → Environment

2. Add environment variables manually

   **Critical Variables** (must set):

   ```
   AGORA_APP_ID=<your-agora-app-id>
   AGORA_CERTIFICATE=<your-agora-certificate>
   AGORA_CUSTOMER_ID=<your-customer-id>
   AGORA_CUSTOMER_SECRET=<your-customer-secret>

   CLOUDFLARE_ACCOUNT_ID=<your-account-id>
   CLOUDFLARE_API_TOKEN=<your-api-token>
   ```

   **Optional Variables**:

   ```
   AWS_ACCESS_KEY_ID=<if-using-s3>
   AWS_SECRET_ACCESS_KEY=<if-using-s3>
   AWS_S3_BUCKET=<bucket-name>

   STRIPE_SECRET_KEY=<if-using-stripe>
   STRIPE_WEBHOOK_SECRET=<webhook-secret>
   ```

3. Verify DATABASE_URL and REDIS_URL
   - These should be auto-populated from render.yaml
   - Check in Environment tab

4. Create environment variable groups (optional)
   - Render → Environment Groups
   - Create group "agora-credentials"
   - Add all Agora vars
   - Attach to whynot-backend service
   - **Benefit**: Reuse across multiple services

**Security Best Practice**:

```
❌ Don't commit secrets to .env
❌ Don't hardcode in render.yaml
✅ Use Render dashboard for secrets
✅ Or use environment variable groups
```

**Acceptance Criteria**:

- [ ] All required env vars configured
- [ ] Secrets not exposed in git
- [ ] DATABASE_URL and REDIS_URL auto-populated

---

### Task 4.4: Run First Deployment (30min)

**Goal**: Deploy the application to Render.

**Steps**:

1. Trigger manual deploy
   - Dashboard → whynot-backend → Manual Deploy
   - Select branch: `main`
   - Click "Deploy"

2. Monitor build logs

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

3. Wait for health check
   - Should take 2-5 minutes
   - Status: Building → Deploying → Live

4. Check deploy logs for errors
   - Look for:
     ```
     ✅ Database connected successfully
     ✅ Redis connected successfully
     ✅ Server running on port 3000
     ```

5. Get deployment URL
   - Format: `https://whynot-backend-XXXX.onrender.com`
   - Or custom domain if configured

**Common Deploy Errors**:

| Error                         | Solution                                       |
| ----------------------------- | ---------------------------------------------- |
| "Health check failed"         | Check /health endpoint works, increase timeout |
| "Database connection refused" | Verify DATABASE_URL is correct                 |
| "Build failed"                | Check Dockerfile syntax, build logs            |
| "Port already in use"         | Check PORT env var, expose correct port        |

**Acceptance Criteria**:

- [ ] Build completes successfully
- [ ] Health check passes
- [ ] Service shows "Live" status
- [ ] Deployment URL accessible

---

### Task 4.5: Run Migrations on Render (20min)

**Goal**: Execute database migrations in production.

**Option A: Via Render Shell**

```bash
# Open shell in Render service
# Dashboard → whynot-backend → Shell

# Run migrations
npm run migrate
```

**Option B: Via Render Jobs**

Create one-time job in render.yaml:

```yaml
# Add to render.yaml
jobs:
  - type: job
    name: whynot-migrations
    env: docker
    dockerfilePath: ./Dockerfile
    dockerCommand: npm run migrate
    envVars:
      # Same as web service
      - key: DATABASE_URL
        fromDatabase:
          name: whynot-db
          property: connectionString
```

Run manually:

- Dashboard → Jobs → whynot-migrations → Run Job

**Option C: Migration Service (automated)**

```yaml
# Add to render.yaml
services:
  - type: worker
    name: whynot-migration-runner
    env: docker
    dockerfilePath: ./Dockerfile
    dockerCommand: npm run migrate && tail -f /dev/null
    # Runs migrations then sleeps (prevents restart loop)
```

**Recommended**: Option A for initial setup, Option B for regular migrations.

**Steps**:

1. Open Render shell
2. Run `npm run migrate`
3. Verify tables created
   ```bash
   # In shell
   psql $DATABASE_URL -c "\dt"
   ```

**Acceptance Criteria**:

- [ ] Migrations run successfully
- [ ] All tables created
- [ ] No migration errors
- [ ] Data schema matches local

---

### Task 4.6: Verify Production Deployment (30min)

**Goal**: Test that the deployed application works correctly.

**Steps**:

1. Test health endpoint

   ```bash
   curl https://whynot-backend-XXXX.onrender.com/health

   # Expected response:
   {
     "status": "healthy",
     "timestamp": "2026-02-18T...",
     "uptime": 123.45,
     "environment": "production"
   }
   ```

2. Test frontend loading
   - Open browser to deployment URL
   - Should show WhyNot homepage
   - Check browser console for errors

3. Test API endpoint

   ```bash
   curl https://whynot-backend-XXXX.onrender.com/trpc/user.me
   ```

4. Test database connection
   - Create a test user (if auth allows)
   - Or check logs for "Database connected"

5. Test Redis connection
   - Check logs for "Redis connected"

6. Monitor service logs
   - Dashboard → whynot-backend → Logs
   - Check for any errors or warnings

7. Check resource usage
   - Dashboard → Metrics
   - CPU, Memory, Request count

**Performance Check**:

```bash
# Page load time
curl -o /dev/null -s -w 'Total: %{time_total}s\n' \
  https://whynot-backend-XXXX.onrender.com/

# Should be < 2s (excluding cold start)
```

**Acceptance Criteria**:

- [ ] Health endpoint returns 200
- [ ] Frontend loads without errors
- [ ] API responds correctly
- [ ] Database queries work
- [ ] Redis connection active
- [ ] No critical errors in logs
- [ ] Response time acceptable (< 2s)

---

## 📁 Files Changed

### Created

- `render.yaml` - Render deployment configuration

### Documentation Needed (Phase 5)

- Update DEPLOYMENT.md with Render instructions
- Document environment variables
- Add troubleshooting guide

---

## ✅ Phase Completion Checklist

- [ ] Task 4.1: render.yaml created
- [ ] Task 4.2: Render account & project setup
- [ ] Task 4.3: Environment variables configured
- [ ] Task 4.4: First deployment successful
- [ ] Task 4.5: Migrations run on Render
- [ ] Task 4.6: Production deployment verified

**Deliverables**:

- [ ] Working render.yaml
- [ ] Live production deployment
- [ ] Migrations applied

---

## 🐛 Common Issues & Solutions

**Issue**: "Service suspended (Hobby plan sleep)"

```bash
# Solution: Ping service every 10 minutes to keep alive
# Or upgrade to Starter plan ($7/month, never sleeps)
```

**Issue**: "Database connection pool exhausted"

```yaml
# Solution: Reduce max connections in DATABASE_URL
DATABASE_URL=postgresql://user:pass@host/db?pool_timeout=30&connect_timeout=10
```

**Issue**: "Build timeout (> 15 minutes)"

```dockerfile
# Solution: Optimize Dockerfile
# - Use .dockerignore to reduce context
# - Cache npm dependencies
# - Use smaller base image
```

**Issue**: "Health check failing in production but works locally"

```yaml
# Solution: Increase health check timeout
healthCheckPath: /health
startCommand: node dist/index.js
# Allow more time for service startup
```

**Issue**: "Environment variable not working"

```bash
# Solution: Check variable is marked sync: false in render.yaml
# And manually set in dashboard
# Dashboard → Environment → Add Environment Variable
```

---

## 🎯 Next Phase

[Phase 5: Documentation & Cleanup](phase-5-documentation.md) - Update README, DEPLOYMENT.md, and finalize the track.
