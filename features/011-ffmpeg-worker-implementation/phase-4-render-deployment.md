# Phase 4: Render Deployment & Scaling

**Duration**: 6-8 hours  
**Status**: ⬜ Not Started  
**Prerequisites**: Phase 3 completed ✅ (local testing successful)

---

## 🎯 Objective

Deploy the FFmpeg worker to Render.com for production:

1. Update render.yaml with ffmpeg-worker service
2. Configure auto-scaling rules
3. Deploy to Render
4. Validate production deployment
5. Test with real RTC streams
6. Configure monitoring and alerts

---

## 📋 Tasks

### Task 4.1: Update Render Blueprint (1h)

**Goal**: Add ffmpeg-worker service to render.yaml

**`render.yaml`** (add service):

```yaml
services:
  # ============================================
  # PostgreSQL Database
  # ============================================
  - type: pserv
    name: whynot-postgres
    env: docker
    plan: free
    dockerfilePath: ./Dockerfile.postgres
    databases:
      - name: whynot_db
        databaseName: whynot_production
        plan: free

  # ============================================
  # Backend API
  # ============================================
  - type: web
    name: whynot-backend
    env: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    plan: standard # $25/month for production
    numInstances: 1
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: whynot_db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: whynot-redis
          property: connectionString
      - key: AGORA_APP_ID
        sync: false
      - key: AGORA_APP_CERTIFICATE
        sync: false
      - key: CLOUDFLARE_STREAM_CUSTOMER_CODE
        sync: false
      - key: PORT
        value: 3000

  # ============================================
  # FFmpeg Worker (NEW)
  # ============================================
  - type: worker
    name: whynot-ffmpeg-worker
    env: docker
    dockerfilePath: ./ffmpeg-worker/Dockerfile
    dockerContext: ./ffmpeg-worker
    plan: standard # $25/month base
    numInstances: 1 # Start with 1, scale up as needed
    scaling:
      minInstances: 1
      maxInstances: 5
      targetCPUPercent: 70 # Scale up when CPU > 70%
      targetMemoryPercent: 80
    envVars:
      - key: NODE_ENV
        value: production
      - key: REDIS_URL
        fromService:
          type: redis
          name: whynot-redis
          property: connectionString
      - key: MAX_CONCURRENT_STREAMS
        value: 10
      - key: FFMPEG_LOG_LEVEL
        value: warning
      - key: HEALTH_PORT
        value: 8080
      - key: LOG_LEVEL
        value: info
    healthCheckPath: /health
    healthCheckPort: 8080
    healthCheckIntervalSeconds: 30
    healthCheckTimeoutSeconds: 5

  # ============================================
  # Redis (External: Upstash)
  # ============================================
  # Note: Using Upstash Redis (free tier 10K commands/day)
  # Set REDIS_URL in Render dashboard to Upstash connection string
```

**Important Notes**:

- **Worker Type**: Uses `type: worker` (no HTTP routing, only health checks)
- **Auto-Scaling**: 1-5 instances based on CPU (70%) and memory (80%)
- **Plan**: Standard ($25/month per instance)
- **Health Checks**: HTTP endpoint on port 8080

**Acceptance Criteria**:

- [x] render.yaml updated with ffmpeg-worker
- [x] Auto-scaling configured
- [x] Health checks configured
- [x] Environment variables set

---

### Task 4.2: Create Production Dockerfile (30min)

**Goal**: Optimize Dockerfile for Render deployment

**`ffmpeg-worker/Dockerfile.production`** (optional optimized version):

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --production && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install FFmpeg with required codecs
RUN apk add --no-cache \
    ffmpeg \
    ffmpeg-libs \
    && ffmpeg -version

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Expose health check port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:8080/health || exit 1

# Set user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Environment
ENV NODE_ENV=production

# Start worker
CMD ["node", "dist/index.js"]
```

**Build Test Locally**:

```bash
cd ffmpeg-worker

# Build production image
docker build -f Dockerfile.production -t whynot-ffmpeg-worker:prod .

# Test image
docker run --rm \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -p 8080:8080 \
  whynot-ffmpeg-worker:prod

# Verify health
curl http://localhost:8080/health
```

**Acceptance Criteria**:

- [x] Production Dockerfile builds
- [x] Image size < 250MB
- [x] Non-root user for security
- [x] Health check works

---

### Task 4.3: Deploy to Render (1-2h)

**Goal**: Push code and deploy via Render dashboard

**Pre-Deployment Checklist**:

1. **Commit all changes**:

   ```bash
   git add .
   git commit -m "feat: Add FFmpeg worker service for RTMP relay"
   git push origin main
   ```

2. **Set Upstash Redis URL** in Render dashboard:
   - Go to Render Dashboard → Environment Variables
   - Add `REDIS_URL` = `redis://default:YOUR_PASSWORD@YOUR_REGION.upstash.io:6379`

3. **Verify render.yaml syntax**:
   ```bash
   # Use Render CLI (optional)
   render blueprint validate render.yaml
   ```

**Deployment Steps**:

1. **Go to Render Dashboard** → Blueprint
2. **Click "Apply Blueprint"**
3. **Select repo**: `whynot` (GitHub)
4. **Review changes**:
   - ✅ New service: `whynot-ffmpeg-worker`
   - ✅ Plan: Standard ($25/month)
   - ✅ Auto-scaling: 1-5 instances
5. **Click "Apply"**
6. **Wait for deployment** (5-10 minutes)

**Monitor Deployment**:

```bash
# Via Render dashboard logs (real-time)
# Or use Render CLI
render logs whynot-ffmpeg-worker
```

**Verify Deployment**:

```bash
# Get worker URL from Render dashboard
WORKER_URL="https://whynot-ffmpeg-worker.onrender.com"

# Health check
curl $WORKER_URL/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2026-02-19T12:00:00.000Z",
#   "uptime": 45.2,
#   "activeStreams": 0,
#   "maxStreams": 10,
#   "utilization": 0
# }
```

**Acceptance Criteria**:

- [x] Deployment succeeds
- [x] Worker service is "Live"
- [x] Health endpoint responds
- [x] No errors in logs

---

### Task 4.4: Production Smoke Test (1h)

**Goal**: Test with real Agora RTC stream

**Test Script** (`scripts/test-production-relay.ts`):

```typescript
// scripts/test-production-relay.ts

import axios from "axios";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://whynot-backend.onrender.com";
const WORKER_URL =
  process.env.WORKER_URL || "https://whynot-ffmpeg-worker.onrender.com";

async function testProductionRelay() {
  console.log("🧪 Testing Production RTMP Relay\n");
  console.log("Backend:", BACKEND_URL);
  console.log("Worker:", WORKER_URL);
  console.log("");

  try {
    // 1. Health checks
    console.log("1️⃣  Checking service health...");
    const backendHealth = await axios.get(`${BACKEND_URL}/health`);
    const workerHealth = await axios.get(`${WORKER_URL}/health`);
    console.log("   Backend:", backendHealth.data.status);
    console.log("   Worker:", workerHealth.data.status);
    console.log("✅ Services healthy\n");

    // 2. Create real channel
    console.log("2️⃣  Creating production channel...");
    const channelResponse = await axios.post(
      `${BACKEND_URL}/trpc/channels.create`,
      {
        name: "production-test-channel",
        description: "Production test for FFmpeg worker",
        rtmp_url: process.env.CLOUDFLARE_RTMP_URL, // Real Cloudflare Stream URL
      },
    );
    const channelId = channelResponse.data.result.data.id;
    console.log("   Channel ID:", channelId);
    console.log("✅ Channel created\n");

    // 3. Start relay
    console.log("3️⃣  Starting RTMP relay...");
    await axios.post(`${BACKEND_URL}/trpc/streaming.startRelay`, {
      channelId,
    });
    console.log("✅ Relay started\n");

    // 4. Monitor for 2 minutes
    console.log("4️⃣  Monitoring stream for 2 minutes...");
    for (let i = 0; i < 12; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      const stats = await axios.get(`${WORKER_URL}/stats`);
      console.log(
        `   [${i * 10}s] Active streams: ${stats.data.activeStreams}`,
      );
    }
    console.log("✅ Monitoring complete\n");

    // 5. Verify on Cloudflare Stream
    console.log("5️⃣  Manual verification required:");
    console.log("   → Go to Cloudflare Stream dashboard");
    console.log("   → Check if stream is live");
    console.log("   → Verify video playback quality");
    console.log("");

    // 6. Stop relay
    console.log("6️⃣  Stopping relay...");
    await axios.post(`${BACKEND_URL}/trpc/streaming.stopRelay`, {
      channelId,
    });
    console.log("✅ Relay stopped\n");

    console.log("✅✅✅ Production smoke test PASSED!");
    console.log("⚠️  Manual verification on Cloudflare Stream still required");
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

testProductionRelay();
```

**Run Test**:

```bash
BACKEND_URL=https://whynot-backend.onrender.com \
WORKER_URL=https://whynot-ffmpeg-worker.onrender.com \
CLOUDFLARE_RTMP_URL=rtmp://live.cloudflare.com/live/YOUR_KEY \
npx tsx scripts/test-production-relay.ts
```

**Manual Verification**:

1. Open Cloudflare Stream dashboard
2. Find the stream (should show as "Live")
3. Play the stream in the dashboard
4. Verify:
   - ✅ Video plays smoothly
   - ✅ Audio is synchronized
   - ✅ Latency < 10 seconds
   - ✅ No buffering or stuttering

**Acceptance Criteria**:

- [x] Stream appears on Cloudflare
- [x] Video/audio quality is good
- [x] Latency is acceptable
- [x] No errors in worker logs

---

### Task 4.5: Configure Auto-Scaling (1h)

**Goal**: Test and tune auto-scaling parameters

**Scaling Test Script** (`scripts/test-autoscaling.ts`):

```typescript
// scripts/test-autoscaling.ts

import axios from "axios";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://whynot-backend.onrender.com";
const NUM_STREAMS = 12; // More than 10 to trigger scaling

async function testAutoScaling() {
  console.log(`🧪 Testing Auto-Scaling with ${NUM_STREAMS} streams\n`);

  const channelIds: number[] = [];

  try {
    // 1. Create channels
    console.log(`1️⃣  Creating ${NUM_STREAMS} channels...`);
    for (let i = 1; i <= NUM_STREAMS; i++) {
      const response = await axios.post(`${BACKEND_URL}/trpc/channels.create`, {
        name: `scale-test-${i}`,
        description: `Auto-scaling test ${i}`,
        rtmp_url: `rtmp://live.cloudflare.com/live/TEST_KEY_${i}`,
      });
      channelIds.push(response.data.result.data.id);
      console.log(`   Channel ${i} created`);
    }
    console.log("✅ Channels created\n");

    // 2. Start all relays
    console.log("2️⃣  Starting all relays...");
    for (const channelId of channelIds) {
      await axios.post(`${BACKEND_URL}/trpc/streaming.startRelay`, {
        channelId,
      });
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Stagger by 2s
    }
    console.log("✅ Relays started\n");

    // 3. Monitor scaling events
    console.log(
      "3️⃣  Monitoring for 10 minutes (watch Render dashboard for scaling)...",
    );
    console.log(
      "   Expected: Worker instances should scale from 1 → 2 (CPU > 70%)",
    );
    console.log("");

    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const relayStats = await axios.get(
        `${BACKEND_URL}/trpc/streaming.getRelayStats`,
      );
      const queueStats = relayStats.data.result.data.queue;

      console.log(
        `   [${i * 10}s] Active: ${queueStats.active}, Waiting: ${queueStats.waiting}`,
      );

      // Check Render dashboard manually:
      // - Go to whynot-ffmpeg-worker → Metrics
      // - Watch "Instances" graph
      // - Should see scale up to 2 instances when CPU > 70%
    }

    console.log("✅ Monitoring complete\n");

    // 4. Stop all relays
    console.log("4️⃣  Stopping all relays...");
    for (const channelId of channelIds) {
      await axios.post(`${BACKEND_URL}/trpc/streaming.stopRelay`, {
        channelId,
      });
    }
    console.log("✅ Relays stopped\n");

    // 5. Wait for scale-down (10-15 minutes)
    console.log("5️⃣  Waiting 15 minutes for scale-down...");
    console.log("   Expected: Worker instances should scale 2 → 1 (CPU < 50%)");
    await new Promise((resolve) => setTimeout(resolve, 900000)); // 15 min

    console.log("✅✅✅ Auto-scaling test complete!");
    console.log(
      "⚠️  Verify in Render dashboard that instances scaled correctly",
    );
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

testAutoScaling();
```

**Tuning Auto-Scaling**:

If scaling is too aggressive or too slow, adjust in `render.yaml`:

```yaml
scaling:
  minInstances: 1
  maxInstances: 5
  targetCPUPercent: 70 # Lower = more aggressive (e.g., 60)
  targetMemoryPercent: 80
  scaleDownDelaySeconds: 600 # Wait 10 min before scaling down
```

**Cost Implications**:

| Instances | Cost/Month | Concurrent Streams |
| --------- | ---------- | ------------------ |
| 1         | $25        | 0-10               |
| 2         | $50        | 11-20              |
| 3         | $75        | 21-30              |
| 5         | $125       | 41-50              |

**Acceptance Criteria**:

- [x] Auto-scaling triggers at 70% CPU
- [x] Scale-up happens within 2 minutes
- [x] Scale-down happens after 10 minutes idle
- [x] Cost stays within budget

---

### Task 4.6: Production Monitoring Setup (2-3h)

**Goal**: Set up monitoring and alerts for production

**4.6.1: Render Metrics Dashboard**

1. **Go to Render Dashboard** → whynot-ffmpeg-worker → Metrics
2. **Pin key metrics**:
   - CPU Usage
   - Memory Usage
   - Instance Count
   - Health Check Success Rate

**4.6.2: BullMQ Queue Metrics**

Add queue metrics endpoint to backend:

**`src/routers/admin.ts`** (new file):

```typescript
// src/routers/admin.ts

import { router, publicProcedure } from "../trpc";
import { streamingService } from "../services/StreamingService";

export const adminRouter = router({
  /**
   * Get system health and metrics
   */
  getSystemHealth: publicProcedure.query(async () => {
    const relayStats = await streamingService.getRelayStats();

    return {
      timestamp: new Date(),
      queue: relayStats.queue,
      workers: {
        // TODO: Get worker count from Render API
        expected: 1,
        actual: 1,
      },
      alerts: [],
    };
  }),

  /**
   * Get queue health
   */
  getQueueHealth: publicProcedure.query(async () => {
    const stats = await streamingService.getRelayStats();
    const { queue } = stats;

    const health = {
      status: "healthy" as "healthy" | "degraded" | "unhealthy",
      waiting: queue.waiting,
      active: queue.active,
      failed: queue.failed,
      warnings: [] as string[],
    };

    // Check for issues
    if (queue.waiting > 20) {
      health.status = "degraded";
      health.warnings.push("High number of waiting jobs");
    }

    if (queue.failed > 10) {
      health.status = "unhealthy";
      health.warnings.push("High failure rate");
    }

    return health;
  }),
});
```

**4.6.3: Alerts Configuration**

Create alert rules in Render dashboard:

1. **Critical: Worker Down**
   - Metric: Health check failures
   - Threshold: > 3 consecutive failures
   - Action: Email + Slack notification

2. **Warning: High CPU**
   - Metric: CPU usage
   - Threshold: > 80% for 5 minutes
   - Action: Email notification

3. **Warning: High Memory**
   - Metric: Memory usage
   - Threshold: > 90% for 5 minutes
   - Action: Email notification

4. **Info: Auto-Scale Event**
   - Metric: Instance count change
   - Action: Slack notification

**4.6.4: Log Aggregation**

Configure log drains (optional):

```yaml
# render.yaml (add to ffmpeg-worker service)
logDestinations:
  - name: datadog
    type: datadog
    apiKey:
      sync: false
```

Or use Render's built-in log search.

**Acceptance Criteria**:

- [x] Render metrics dashboard configured
- [x] Queue health endpoint created
- [x] Alerts configured
- [x] Receive test alert successfully

---

## ✅ Phase 4 Completion Checklist

- [ ] render.yaml updated with ffmpeg-worker
- [ ] Production Dockerfile optimized
- [ ] Deployed to Render successfully
- [ ] Production smoke test passed
- [ ] Manual Cloudflare Stream verification done
- [ ] Auto-scaling tested and tuned
- [ ] Monitoring and alerts configured
- [ ] Documentation updated with production URLs

---

## 📊 Estimated vs Actual Time

| Task      | Estimated | Actual | Notes |
| --------- | --------- | ------ | ----- |
| 4.1       | 1h        |        |       |
| 4.2       | 30min     |        |       |
| 4.3       | 1-2h      |        |       |
| 4.4       | 1h        |        |       |
| 4.5       | 1h        |        |       |
| 4.6       | 2-3h      |        |       |
| **Total** | **6-8h**  |        |       |

---

## 💰 Production Cost Breakdown

### Monthly Costs

| Service         | Plan     | Cost        | Notes                              |
| --------------- | -------- | ----------- | ---------------------------------- |
| PostgreSQL      | Free     | $0          | 1GB limit                          |
| Redis (Upstash) | Free     | $0          | 10K commands/day                   |
| Backend         | Standard | $25         | 1 instance                         |
| FFmpeg Worker   | Standard | $25-125     | 1-5 instances (auto-scale)         |
| **Total**       |          | **$50-150** | vs $540 with Agora Cloud Recording |

### Savings

- **Best case**: $490/month (91% reduction)
- **Worst case**: $390/month (72% reduction)

---

## 🔄 Next Phase

After completing Phase 4 and deploying to production, proceed to **Phase 5: Monitoring, Alerts & Optimization** to ensure production stability and performance.

**Phase 5 Preview**:

- Set up comprehensive monitoring with Prometheus/Grafana
- Configure alerting rules
- Optimize FFmpeg encoding settings
- Implement cost optimization strategies
- Create incident runbooks
