# Phase 2: Backend Dockerization

**Duration**: 3-4 hours  
**Status**: ⬜ Not Started

---

## 🎯 Objective

Create a production-ready Docker image for the backend that builds both server and client code, installs dependencies, and serves the built frontend files.

---

## 📋 Tasks

### Task 2.1: Create Dockerfile (1h)

**Goal**: Build a multi-stage Dockerfile that compiles TypeScript backend + Vite frontend.

**New file**: `Dockerfile`

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build both backend and frontend
# npm run build = npm run build:server && npm run build:client
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./dist/public

# Copy migrations
COPY migrations ./migrations

# Copy .env for local development (will be overridden in production)
# COPY .env .env

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["node", "dist/index.js"]
```

**Steps**:

1. Create `Dockerfile` in project root
2. Paste the content above

**Acceptance Criteria**:

- [ ] Dockerfile created
- [ ] Multi-stage build configured
- [ ] Health check defined

---

### Task 2.2: Create .dockerignore (15min)

**Goal**: Exclude unnecessary files from Docker build context.

**New file**: `.dockerignore`

```
# Node modules (will be installed in container)
node_modules/
npm-debug.log

# Build outputs (will be built in container)
dist/
client/dist/

# Git
.git/
.gitignore

# Environment files (will be injected at runtime)
.env
.env.*

# Documentation
*.md
docs/

# Development files
dev-quality/
features/

# Tests
__tests__/
*.test.ts
*.spec.ts

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
Dockerfile
docker-compose.yml
.dockerignore

# Deployment configs
Procfile
heroku.yml
render.yaml

# Misc
*.log
coverage/
.cache/
```

**Steps**:

1. Create `.dockerignore` in project root
2. Paste content above

**Acceptance Criteria**:

- [ ] .dockerignore created
- [ ] Excludes node_modules, dist, and dev files

---

### Task 2.3: Add Health Check Endpoint (30min)

**Goal**: Add `/health` endpoint for Docker health checks and Render monitoring.

**Files to Update**:

- `src/index.ts`

**Changes**:

```typescript
// Add health check endpoint before tRPC routes
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});
```

**Steps**:

1. Add health endpoint to `src/index.ts`
2. Test locally
   ```bash
   npm run dev
   curl http://localhost:3000/health
   # Should return: {"status":"healthy", ...}
   ```

**Acceptance Criteria**:

- [ ] /health endpoint responds with 200
- [ ] Returns JSON with status info
- [ ] Works before tRPC initialization

---

### Task 2.4: Build Docker Image Locally (45min)

**Goal**: Test that Docker image builds successfully.

**Steps**:

1. Build the image

   ```bash
   docker build -t whynot-backend:latest .
   ```

   Expected output:

   ```
   [Stage 1/3] Building deps...
   [Stage 2/3] Building application...
   [Stage 3/3] Creating production image...
   Successfully tagged whynot-backend:latest
   ```

2. Inspect image size

   ```bash
   docker images | grep whynot-backend
   # Should be around 300-500MB for alpine-based image
   ```

3. Inspect image layers
   ```bash
   docker history whynot-backend:latest
   ```

**Common Build Errors**:

| Error                      | Solution                                         |
| -------------------------- | ------------------------------------------------ |
| `npm ERR! code ELIFECYCLE` | Check build scripts in package.json              |
| `Cannot find module`       | Ensure all dependencies in package.json          |
| `COPY failed`              | Check .dockerignore isn't excluding needed files |
| Build takes > 10min        | Check network, consider npm cache                |

**Acceptance Criteria**:

- [ ] Image builds without errors
- [ ] Build completes in < 5 minutes
- [ ] Image size reasonable (< 600MB)

---

### Task 2.5: Test Docker Image Locally (1h)

**Goal**: Run the built image and verify it works correctly.

**Steps**:

1. Run container (without docker-compose)

   ```bash
   docker run --rm \
     --name whynot-backend-test \
     -p 3000:3000 \
     -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54321/whynot \
     -e REDIS_URL=redis://host.docker.internal:6379 \
     -e NODE_ENV=development \
     -e AGORA_APP_ID=$AGORA_APP_ID \
     -e AGORA_CERTIFICATE=$AGORA_CERTIFICATE \
     -e CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
     -e CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN \
     whynot-backend:latest
   ```

   **Note**: `host.docker.internal` allows container to connect to services on host machine.

2. Test health endpoint

   ```bash
   curl http://localhost:3000/health
   ```

3. Test frontend serving

   ```bash
   # Open browser to http://localhost:3000
   # Should see WhyNot frontend
   ```

4. Test API endpoint

   ```bash
   # Try a tRPC endpoint
   curl http://localhost:3000/trpc/user.me
   ```

5. Check logs

   ```bash
   docker logs whynot-backend-test
   # Should see:
   # - Database connected successfully
   # - Redis connected successfully (if redis client active)
   # - Server running on port 3000
   ```

6. Stop container
   ```bash
   docker stop whynot-backend-test
   ```

**Acceptance Criteria**:

- [ ] Container starts without errors
- [ ] Health check returns 200
- [ ] Frontend accessible at localhost:3000
- [ ] API endpoints work
- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] Container stops gracefully

---

### Task 2.6: Create Environment Template (15min)

**Goal**: Document all required environment variables for Docker.

**New file**: `.env.docker.example`

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/whynot

# Redis
REDIS_URL=redis://redis:6379

# Application
NODE_ENV=production
PORT=3000

# Agora
AGORA_APP_ID=your_app_id_here
AGORA_CERTIFICATE=your_certificate_here
AGORA_CUSTOMER_ID=your_customer_id_here
AGORA_CUSTOMER_SECRET=your_customer_secret_here

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# AWS S3 (if needed)
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=your_bucket_name_here
AWS_REGION=us-east-1

# Stripe (if needed)
STRIPE_SECRET_KEY=your_stripe_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here
```

**Steps**:

1. Create `.env.docker.example`
2. Document all env vars

**Acceptance Criteria**:

- [ ] All required env vars documented
- [ ] Service names match docker-compose (postgres, redis)

---

### Task 2.7: Optimize Build Cache (30min)

**Goal**: Improve rebuild speed by optimizing layer caching.

**Files to Update**:

- `Dockerfile` (optional optimization)

**Optional Enhancement**:

```dockerfile
# In deps stage, add .dockerignore check
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only package files first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# In builder stage, copy source AFTER deps
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Copy source files (cache will invalidate only if these change)
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY client/ ./client/
COPY src/ ./src/
COPY migrations/ ./migrations/

RUN npm run build
```

**Test rebuild speed**:

```bash
# First build (cold cache)
time docker build -t whynot-backend:latest .

# Second build (warm cache, no changes)
time docker build -t whynot-backend:latest .
# Should be < 10 seconds

# Third build (change only src file)
touch src/index.ts
time docker build -t whynot-backend:latest .
# Should reuse deps layer, rebuild only builder layer
```

**Acceptance Criteria**:

- [ ] Rebuild with no changes < 10s
- [ ] Rebuild with src change < 2min
- [ ] package.json change rebuilds from deps stage

---

## 📁 Files Changed

### Created

- `Dockerfile` - Multi-stage build for backend
- `.dockerignore` - Exclude files from build context
- `.env.docker.example` - Docker environment template

### Modified

- `src/index.ts` - Added /health endpoint

### Temporary (for testing)

- `whynot-backend:latest` Docker image

---

## ✅ Phase Completion Checklist

- [ ] Task 2.1: Dockerfile created
- [ ] Task 2.2: .dockerignore created
- [ ] Task 2.3: Health endpoint added
- [ ] Task 2.4: Docker image builds successfully
- [ ] Task 2.5: Container runs and works locally
- [ ] Task 2.6: Environment template created
- [ ] Task 2.7: Build cache optimized

**Deliverables**:

- [ ] Working Dockerfile
- [ ] Health check endpoint
- [ ] Tested Docker image

---

## 🐛 Common Issues & Solutions

**Issue**: "Cannot find module '@/utils/xyz'"

```dockerfile
# Solution: Ensure tsconfig.json is copied in builder stage
COPY tsconfig.json ./
```

**Issue**: "ENOENT: no such file or directory, open '/app/dist/public/index.html'"

```bash
# Solution: Verify client build output path
# Check vite.config.ts output directory matches Dockerfile COPY
```

**Issue**: "Database connection refused"

```bash
# Solution: Use host.docker.internal for connecting to host services
DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54321/whynot
```

**Issue**: Frontend shows 404 for /assets/xyz.js

```dockerfile
# Solution: Ensure client dist is copied to correct location
COPY --from=builder /app/client/dist ./dist/public
```

**Issue**: Build fails with "npm ERR! enoent ENOENT"

```bash
# Solution: Check package-lock.json is not in .dockerignore
# Or use npm install instead of npm ci
```

---

## 🎯 Next Phase

[Phase 3: Docker Compose Integration](phase-3-compose-integration.md) - Integrate backend into docker-compose with postgres & redis.
