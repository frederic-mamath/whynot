# Phase 7: Testing & Optimization

## Objective

Comprehensive end-to-end testing, performance optimization, and production readiness verification for the hybrid streaming system before launch.

## User-Facing Changes

**For All Users**:

- Improved stability and reliability
- Optimized performance (faster load times, smoother playback)
- Better error messages and recovery

---

## Files to Update

### New Files

- `tests/integration/hybrid-streaming.test.ts` - E2E tests
- `tests/load/streaming-load-test.js` - Load testing script (k6 or Artillery)
- `docs/runbook.md` - Production operations guide
- `docs/troubleshooting.md` - Common issues and solutions

### Modified Files

- All services (add error logging, performance optimizations)
- Frontend components (add loading states, error boundaries)
- Environment configuration (production settings)

---

## Steps

### 1. Unit Testing

#### Backend Services

**File**: `tests/services/cloudflareStreamService.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CloudflareStreamService } from "../../src/services/cloudflareStreamService";

describe("CloudflareStreamService", () => {
  let service: CloudflareStreamService;

  beforeEach(() => {
    process.env.CLOUDFLARE_STREAM_ACCOUNT_ID = "test_account";
    process.env.CLOUDFLARE_STREAM_API_TOKEN = "test_token";
    service = new CloudflareStreamService();
  });

  it("should create live input successfully", async () => {
    // Mock Cloudflare API response
    const mockResponse = {
      result: {
        uid: "stream_123",
        rtmps: { url: "rtmps://live.cloudflare.com:443/live/stream_123" },
        playback: {
          hls: "https://customer-abc.cloudflarestream.com/stream_123/manifest/video.m3u8",
        },
      },
    };

    // Test implementation
    // ... (mock axios, test createLiveInput)
  });

  it("should handle API errors gracefully", async () => {
    // Test error handling
  });
});
```

**File**: `tests/services/recordingManager.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { RecordingManager } from "../../src/services/recordingManager";

describe("RecordingManager", () => {
  it("should start recording successfully", async () => {
    // Test recording start
  });

  it("should stop recording and record costs", async () => {
    // Test recording stop + cost tracking
  });

  it("should handle Agora API failures", async () => {
    // Test error scenarios
  });
});
```

---

### 2. Integration Testing

**File**: `tests/integration/hybrid-streaming.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../src/db";
import { HybridStreamingService } from "../../src/services/hybridStreamingService";

describe("Hybrid Streaming End-to-End", () => {
  let testChannelId: number;
  let hybridStreaming: HybridStreamingService;

  beforeAll(async () => {
    // Create test channel
    const result = await db
      .insertInto("channels")
      .values({
        title: "Test Channel",
        description: "E2E Test",
        host_user_id: 1,
        is_active: false,
      })
      .returning("id")
      .executeTakeFirst();

    testChannelId = result!.id;
    hybridStreaming = new HybridStreamingService(db);
  });

  afterAll(async () => {
    // Cleanup: stop streaming, delete channel
    try {
      await hybridStreaming.stopHybridStreaming(testChannelId);
    } catch {}
    await db.deleteFrom("channels").where("id", "=", testChannelId).execute();
  });

  it("should complete full streaming lifecycle", async () => {
    // 1. Start streaming
    const { hlsPlaybackUrl, streamKeyId } =
      await hybridStreaming.startHybridStreaming(
        testChannelId,
        `test_channel_${testChannelId}`,
        12345,
      );

    expect(hlsPlaybackUrl).toContain(".m3u8");
    expect(streamKeyId).toBeTruthy();

    // 2. Verify status
    const status = await hybridStreaming.getStreamingStatus(testChannelId);
    expect(status.isActive).toBe(true);

    // 3. Wait for stream to be live (simulate)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 4. Stop streaming
    await hybridStreaming.stopHybridStreaming(testChannelId);

    // 5. Verify stopped
    const finalStatus = await hybridStreaming.getStreamingStatus(testChannelId);
    expect(finalStatus.isActive).toBe(false);
  }, 30000); // 30s timeout
});
```

---

### 3. Load Testing

**File**: `tests/load/streaming-load-test.js` (using k6)

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up to 10 concurrent viewers
    { duration: "1m", target: 50 }, // Ramp up to 50
    { duration: "2m", target: 100 }, // Ramp up to 100
    { duration: "1m", target: 200 }, // Ramp up to 200
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    http_req_failed: ["rate<0.05"], // Error rate < 5%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // 1. Get HLS playback URL
  const channelId = 1; // Test channel
  const response = http.get(
    `${BASE_URL}/trpc/streaming.getPlaybackUrl?input={"channelId":${channelId}}`,
  );

  check(response, {
    "status is 200": (r) => r.status === 200,
    "has HLS URL": (r) => r.json().result?.data?.hlsUrl,
  });

  // 2. Simulate HLS manifest fetch
  const hlsUrl = response.json().result?.data?.hlsUrl;
  if (hlsUrl) {
    const manifestResponse = http.get(hlsUrl);
    check(manifestResponse, {
      "manifest loads": (r) => r.status === 200 || r.status === 404, // 404 if not live yet
    });
  }

  sleep(10); // Watch for 10 seconds
}
```

**Run load test**:

```bash
k6 run tests/load/streaming-load-test.js --env BASE_URL=https://your-app.herokuapp.com
```

---

### 4. Performance Optimization

#### Backend Optimizations

**a) Database Query Optimization**

```typescript
// Before: N+1 queries
for (const channel of channels) {
  const metrics = await db
    .selectFrom("stream_metrics")
    .where("channel_id", "=", channel.id)
    .execute();
}

// After: Single query with JOIN
const channelsWithMetrics = await db
  .selectFrom("channels")
  .leftJoin("stream_metrics", "stream_metrics.channel_id", "channels.id")
  .selectAll()
  .execute();
```

**b) Add Caching**

```typescript
import { LRUCache } from "lru-cache";

const playbackUrlCache = new LRUCache<number, string>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

async function getPlaybackUrl(channelId: number): Promise<string> {
  // Check cache first
  const cached = playbackUrlCache.get(channelId);
  if (cached) return cached;

  // Fetch from database
  const channel = await db
    .selectFrom("channels")
    .select("hls_playback_url")
    .where("id", "=", channelId)
    .executeTakeFirst();

  if (channel?.hls_playback_url) {
    playbackUrlCache.set(channelId, channel.hls_playback_url);
    return channel.hls_playback_url;
  }

  throw new Error("No HLS URL available");
}
```

**c) Add Request Rate Limiting**

```typescript
import rateLimit from "express-rate-limit";

const streamingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later",
});

app.use("/trpc/streaming", streamingLimiter);
```

#### Frontend Optimizations

**a) Lazy Load HLS.js**

```typescript
// Before: Always import
import Hls from "hls.js";

// After: Dynamic import
const loadHls = async () => {
  if (Hls.isSupported()) {
    return (await import("hls.js")).default;
  }
  throw new Error("HLS not supported");
};
```

**b) Optimize Video Player Rendering**

```typescript
// Use React.memo to prevent unnecessary re-renders
export const HLSVideoPlayer = React.memo(({ src, ...props }) => {
  // ... component logic
});
```

**c) Preconnect to Streaming Domains**

```html
<!-- Add to index.html -->
<link rel="preconnect" href="https://customer-abc.cloudflarestream.com" />
<link rel="dns-prefetch" href="https://customer-abc.cloudflarestream.com" />
```

---

### 5. Error Handling & Resilience

#### Retry Logic with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Retry attempt ${attempt} after ${delay}ms`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}

// Usage
const streamCredentials = await retryWithBackoff(() =>
  cloudflareStream.createLiveInput({ channelId }),
);
```

#### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private threshold = 5,
    private timeout = 60000,
  ) {} // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = "closed";
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = "open";
      console.error("Circuit breaker opened due to repeated failures");
    }
  }
}

// Usage
const cloudflareCircuitBreaker = new CircuitBreaker();

async function safeCreateLiveInput(options: CreateStreamOptions) {
  return cloudflareCircuitBreaker.execute(() =>
    cloudflareStream.createLiveInput(options),
  );
}
```

---

### 6. Production Readiness Checklist

#### Environment Variables

```bash
# Agora
AGORA_APP_ID=required
AGORA_APP_CERTIFICATE=required
AGORA_CUSTOMER_ID=required
AGORA_CUSTOMER_SECRET=required

# Cloudflare Stream
CLOUDFLARE_STREAM_ACCOUNT_ID=required
CLOUDFLARE_STREAM_API_TOKEN=required

# Database
DATABASE_URL=required

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

#### Logging

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Usage
logger.info("Starting hybrid streaming", { channelId, sellerUid });
logger.error("Failed to start recording", { channelId, error: error.message });
```

#### Health Check Endpoint

```typescript
// src/routers/healthRouter.ts
export const healthRouter = router({
  check: publicProcedure.query(async () => {
    const hybridStreaming = new HybridStreamingService(db);
    const health = await hybridStreaming.healthCheck();

    return {
      status: health.overall ? "healthy" : "degraded",
      services: {
        agora: health.agora,
        cloudflare: health.cloudflare,
      },
      timestamp: new Date().toISOString(),
    };
  }),
});
```

---

### 7. Monitoring & Alerting

#### Heroku Metrics

```bash
# Enable Heroku metrics
heroku labs:enable log-runtime-metrics

# View metrics
heroku logs --tail | grep "sample#"
```

#### Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Capture errors
try {
  await hybridStreaming.startHybridStreaming(channelId, channelName, sellerUid);
} catch (error) {
  Sentry.captureException(error, {
    tags: { channelId },
    extra: { channelName, sellerUid },
  });
  throw error;
}
```

---

### 8. Documentation

**File**: `docs/runbook.md`

```markdown
# Hybrid Streaming Runbook

## Starting a Stream

1. Seller clicks "Go Live"
2. System starts Agora Cloud Recording
3. Cloudflare Live Input created
4. RTMP forwarding configured
5. HLS URL becomes available (~10-30s)

## Common Issues

### Stream won't start

- Check Agora credentials
- Verify Cloudflare API token
- Check database connectivity

### HLS playback not working

- Verify stream is live (check Cloudflare dashboard)
- Check CORS headers
- Verify HLS URL is accessible

## Emergency Procedures

### Complete system failure

1. Switch to Agora-only mode (disable hybrid streaming)
2. Investigate root cause
3. Fix and re-enable hybrid streaming
```

---

## Acceptance Criteria

- [ ] Unit tests: >80% code coverage
- [ ] Integration tests: All critical paths covered
- [ ] Load tests: 200+ concurrent viewers stable
- [ ] Performance: P95 latency <500ms for API calls
- [ ] Error rate: <1% in production
- [ ] Documentation: Runbook and troubleshooting guide complete
- [ ] Monitoring: Health checks and error tracking configured
- [ ] Production readiness: All environment variables configured

---

## Testing Checklist

### Manual Testing

#### Happy Path

- [ ] Start channel → HLS URL available within 30s
- [ ] Seller streams video → Buyers see HLS playback
- [ ] End channel → Relay stops, costs recorded
- [ ] Multiple concurrent channels work

#### Error Scenarios

- [ ] Cloudflare API down → Error message shown
- [ ] Invalid Agora credentials → Clear error
- [ ] Network interruption → Automatic reconnection
- [ ] Seller disconnects → Graceful cleanup

#### Browser Compatibility

- [ ] Chrome (desktop)
- [ ] Safari (desktop + iOS)
- [ ] Firefox (desktop)
- [ ] Edge (desktop)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### Performance Testing

- [ ] Load test: 10 viewers
- [ ] Load test: 50 viewers
- [ ] Load test: 100 viewers
- [ ] Load test: 200 viewers
- [ ] Stress test: 500 viewers (should degrade gracefully)

### Security Testing

- [ ] API endpoints require authentication
- [ ] Cloudflare API token not exposed
- [ ] Agora credentials secure
- [ ] SQL injection prevention
- [ ] XSS prevention

---

## Optimization Results Target

| Metric                      | Before       | After Target |
| --------------------------- | ------------ | ------------ |
| **Stream start time**       | N/A          | <30s         |
| **API response time (P95)** | N/A          | <500ms       |
| **HLS playback latency**    | N/A          | 15-30s       |
| **Concurrent viewers**      | Limited by $ | 200+         |
| **Cost per 1000 viewers**   | $60/hour     | $1.05/hour   |
| **Error rate**              | N/A          | <1%          |
| **Uptime**                  | N/A          | 99.5%+       |

---

## Status

📝 PLANNING

## Estimated Time

**4-5 hours**

- Unit tests: 1 hour
- Integration tests: 1 hour
- Load testing: 1 hour
- Optimization: 1 hour
- Documentation: 1 hour

---

## Notes

### Pre-Launch Checklist

- [ ] All tests passing
- [ ] Load testing completed
- [ ] Production environment configured
- [ ] Monitoring and alerting set up
- [ ] Runbook documented
- [ ] Team trained on troubleshooting
- [ ] Rollback plan prepared
- [ ] Stakeholders informed

### Launch Plan

1. **Soft launch**: Enable for 1-2 test channels
2. **Monitor**: Watch metrics for 24-48 hours
3. **Gradual rollout**: Enable for 25% of channels
4. **Full launch**: Enable for all channels
5. **Post-launch**: Monitor for 1 week, optimize based on feedback

### Success Criteria

- [ ] 90% cost reduction achieved
- [ ] <5% user complaints about quality/latency
- [ ] 99.5% uptime in first month
- [ ] No critical bugs in first week
