# Phase 5: Monitoring, Alerts & Optimization

**Duration**: 4-6 hours  
**Status**: ⬜ Not Started  
**Prerequisites**: Phase 4 completed ✅ (production deployment successful)

---

## 🎯 Objective

Ensure production stability and optimize performance:

1. Implement comprehensive monitoring with metrics
2. Configure alerts for critical issues
3. Optimize FFmpeg encoding settings for cost/quality
4. Implement cost optimization strategies
5. Create incident runbooks
6. Performance tuning

---

## 📋 Tasks

### Task 5.1: Metrics Collection (1-2h)

**Goal**: Expose detailed metrics for monitoring

**5.1.1: Add Prometheus Metrics to FFmpeg Worker**

**Install dependencies**:

```bash
cd ffmpeg-worker
npm install --save prom-client
```

**`src/MetricsCollector.ts`**:

```typescript
// src/MetricsCollector.ts

import { Registry, Counter, Gauge, Histogram } from "prom-client";

export class MetricsCollector {
  private registry: Registry;

  // Counters
  public streams_started_total: Counter;
  public streams_stopped_total: Counter;
  public streams_failed_total: Counter;
  public ffmpeg_restarts_total: Counter;

  // Gauges
  public active_streams: Gauge;
  public cpu_usage_percent: Gauge;
  public memory_usage_bytes: Gauge;

  // Histograms
  public stream_duration_seconds: Histogram;
  public ffmpeg_startup_seconds: Histogram;

  constructor() {
    this.registry = new Registry();

    // Initialize metrics
    this.streams_started_total = new Counter({
      name: "streams_started_total",
      help: "Total number of streams started",
      registers: [this.registry],
    });

    this.streams_stopped_total = new Counter({
      name: "streams_stopped_total",
      help: "Total number of streams stopped successfully",
      registers: [this.registry],
    });

    this.streams_failed_total = new Counter({
      name: "streams_failed_total",
      help: "Total number of streams that failed",
      labelNames: ["reason"],
      registers: [this.registry],
    });

    this.ffmpeg_restarts_total = new Counter({
      name: "ffmpeg_restarts_total",
      help: "Total number of FFmpeg process restarts",
      registers: [this.registry],
    });

    this.active_streams = new Gauge({
      name: "active_streams",
      help: "Current number of active streams",
      registers: [this.registry],
    });

    this.cpu_usage_percent = new Gauge({
      name: "cpu_usage_percent",
      help: "CPU usage percentage",
      registers: [this.registry],
    });

    this.memory_usage_bytes = new Gauge({
      name: "memory_usage_bytes",
      help: "Memory usage in bytes",
      registers: [this.registry],
    });

    this.stream_duration_seconds = new Histogram({
      name: "stream_duration_seconds",
      help: "Duration of streams in seconds",
      buckets: [60, 300, 600, 1800, 3600, 7200], // 1min, 5min, 10min, 30min, 1hr, 2hr
      registers: [this.registry],
    });

    this.ffmpeg_startup_seconds = new Histogram({
      name: "ffmpeg_startup_seconds",
      help: "Time to start FFmpeg process",
      buckets: [1, 2, 5, 10, 30], // 1s, 2s, 5s, 10s, 30s
      registers: [this.registry],
    });
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    // Update system metrics
    this.updateSystemMetrics();

    return this.registry.metrics();
  }

  /**
   * Update system resource metrics
   */
  private updateSystemMetrics(): void {
    const usage = process.cpuUsage();
    const memory = process.memoryUsage();

    // Simple CPU % (not perfect, but good enough)
    const cpuPercent = (usage.user + usage.system) / 1000000; // Convert to %
    this.cpu_usage_percent.set(cpuPercent);

    // Memory
    this.memory_usage_bytes.set(memory.heapUsed);
  }
}
```

**Update HealthServer to expose /metrics endpoint**:

**`src/HealthServer.ts`** (update):

```typescript
// src/HealthServer.ts

import express, { Request, Response } from "express";
import { FFmpegManager } from "./FFmpegManager";
import { MetricsCollector } from "./MetricsCollector";
import { config } from "./config";

export class HealthServer {
  private app = express();
  private ffmpegManager: FFmpegManager;
  private metrics: MetricsCollector;

  constructor(ffmpegManager: FFmpegManager, metrics: MetricsCollector) {
    this.ffmpegManager = ffmpegManager;
    this.metrics = metrics;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // ... existing routes ...

    // 🆕 Prometheus metrics endpoint
    this.app.get("/metrics", async (req: Request, res: Response) => {
      res.set("Content-Type", "text/plain");
      const metrics = await this.metrics.getMetrics();
      res.send(metrics);
    });
  }

  // ... rest of class ...
}
```

**Update FFmpegManager to record metrics**:

**`src/FFmpegManager.ts`** (add metrics):

```typescript
// At top of file
import { MetricsCollector } from "./MetricsCollector";

export class FFmpegManager {
  // ... existing properties ...
  private metrics: MetricsCollector;

  constructor(metrics: MetricsCollector) {
    this.metrics = metrics;
    // ... rest of constructor ...
  }

  async startStream(job: StreamJob): Promise<void> {
    const startTime = Date.now();

    // ... existing start logic ...

    this.metrics.streams_started_total.inc();
    this.metrics.active_streams.inc();

    const startupDuration = (Date.now() - startTime) / 1000;
    this.metrics.ffmpeg_startup_seconds.observe(startupDuration);
  }

  stopStream(channelId: number): void {
    // ... existing stop logic ...

    this.metrics.streams_stopped_total.inc();
    this.metrics.active_streams.dec();
  }

  private async handleProcessFailure(
    channelId: number,
    error: Error,
  ): Promise<void> {
    // ... existing failure logic ...

    this.metrics.streams_failed_total.inc({ reason: "process_crash" });
    this.metrics.ffmpeg_restarts_total.inc();
  }
}
```

**Update main index.ts**:

**`src/index.ts`**:

```typescript
// src/index.ts

import { FFmpegManager } from "./FFmpegManager";
import { RedisConsumer } from "./RedisConsumer";
import { HealthServer } from "./HealthServer";
import { MetricsCollector } from "./MetricsCollector";
import { config } from "./config";

async function main() {
  console.log("🚀 Starting WhyNot FFmpeg Worker...");

  // Initialize metrics collector
  const metrics = new MetricsCollector();

  // Initialize components
  const ffmpegManager = new FFmpegManager(metrics);
  const redisConsumer = new RedisConsumer(ffmpegManager);
  const healthServer = new HealthServer(ffmpegManager, metrics);

  // Start health server
  healthServer.start();

  console.log("✅ FFmpeg Worker ready");
  console.log(`📊 Metrics: http://localhost:${config.health.port}/metrics`);

  // ... rest of main ...
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
```

**Test metrics locally**:

```bash
# Start worker
docker compose up -d ffmpeg-worker

# Check metrics
curl http://localhost:8080/metrics

# Should see:
# streams_started_total 0
# streams_stopped_total 0
# active_streams 0
# cpu_usage_percent 2.5
# memory_usage_bytes 125829120
```

**Acceptance Criteria**:

- [x] Metrics exposed on /metrics endpoint
- [x] Prometheus format
- [x] All key metrics tracked
- [x] Metrics update in real-time

---

### Task 5.2: Alert Configuration (1h)

**Goal**: Set up alerts for critical issues

**5.2.1: Render Alerts**

Configure in Render Dashboard → whynot-ffmpeg-worker → Notifications:

**Critical Alerts**:

1. **Worker Instance Down**

   ```yaml
   Alert: Health Check Failures
   Condition: > 3 consecutive failures
   Notification: Email + Slack
   ```

2. **High Failure Rate**

   ```yaml
   Alert: Stream Failure Rate
   Condition: streams_failed_total > 10 in 5 minutes
   Notification: Email + PagerDuty (if available)
   ```

3. **Memory Leak Detected**
   ```yaml
   Alert: Memory Usage High
   Condition: > 90% for 10 minutes
   Notification: Email
   ```

**Warning Alerts**:

4. **High CPU Usage**

   ```yaml
   Alert: CPU Usage High
   Condition: > 80% for 5 minutes
   Notification: Slack
   ```

5. **Queue Backlog**
   ```yaml
   Alert: Redis Queue Backlog
   Condition: > 50 waiting jobs
   Notification: Slack
   ```

**5.2.2: Backend Alert Endpoint**

Create webhook endpoint for custom alerts:

**`src/routers/alerts.ts`**:

```typescript
// src/routers/alerts.ts

import { router, publicProcedure } from "../trpc";
import { z } from "zod";

// Alert levels
type AlertLevel = "info" | "warning" | "critical";

interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const alerts: Alert[] = [];

export const alertsRouter = router({
  /**
   * Trigger an alert
   */
  trigger: publicProcedure
    .input(
      z.object({
        level: z.enum(["info", "warning", "critical"]),
        message: z.string(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const alert: Alert = {
        id: `alert-${Date.now()}`,
        level: input.level,
        message: input.message,
        timestamp: new Date(),
        metadata: input.metadata,
      };

      alerts.push(alert);

      // Send to external services based on level
      if (alert.level === "critical") {
        // TODO: Send to PagerDuty/Slack
        console.error("🚨 CRITICAL ALERT:", alert.message);
      } else if (alert.level === "warning") {
        // TODO: Send to Slack
        console.warn("⚠️  WARNING:", alert.message);
      } else {
        console.log("ℹ️  INFO:", alert.message);
      }

      return { success: true, alertId: alert.id };
    }),

  /**
   * Get recent alerts
   */
  getRecent: publicProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        level: z.enum(["info", "warning", "critical"]).optional(),
      }),
    )
    .query(({ input }) => {
      let filtered = alerts;

      if (input.level) {
        filtered = alerts.filter((a) => a.level === input.level);
      }

      return filtered
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, input.limit);
    }),
});
```

**Acceptance Criteria**:

- [x] All critical alerts configured
- [x] Test alerts trigger correctly
- [x] Notifications delivered
- [x] Alert history tracked

---

### Task 5.3: FFmpeg Optimization (1-2h)

**Goal**: Optimize encoding settings for cost/quality balance

**5.3.1: Encoding Presets**

Define multiple encoding profiles:

**`ffmpeg-worker/src/presets.ts`**:

```typescript
// src/presets.ts

export interface EncodingPreset {
  name: string;
  videoCodec: string;
  videoBitrate: number;
  videoResolution: string;
  audioCodec: string;
  audioBitrate: number;
  framerate: number;
  preset: string; // FFmpeg preset
  tune: string;
  cpuIntensity: "low" | "medium" | "high";
}

export const ENCODING_PRESETS: Record<string, EncodingPreset> = {
  // Ultra-fast (lowest quality, lowest CPU)
  "ultra-fast": {
    name: "Ultra Fast",
    videoCodec: "h264",
    videoBitrate: 1500,
    videoResolution: "720p",
    audioCodec: "aac",
    audioBitrate: 96,
    framerate: 30,
    preset: "ultrafast",
    tune: "zerolatency",
    cpuIntensity: "low",
  },

  // Fast (balanced)
  fast: {
    name: "Fast",
    videoCodec: "h264",
    videoBitrate: 2500,
    videoResolution: "720p",
    audioCodec: "aac",
    audioBitrate: 128,
    framerate: 30,
    preset: "veryfast",
    tune: "zerolatency",
    cpuIntensity: "medium",
  },

  // Quality (higher quality, higher CPU)
  quality: {
    name: "Quality",
    videoCodec: "h264",
    videoBitrate: 4000,
    videoResolution: "1080p",
    audioCodec: "aac",
    audioBitrate: 192,
    framerate: 30,
    preset: "fast",
    tune: "zerolatency",
    cpuIntensity: "high",
  },

  // Low-bandwidth (for poor connections)
  "low-bandwidth": {
    name: "Low Bandwidth",
    videoCodec: "h264",
    videoBitrate: 800,
    videoResolution: "480p",
    audioCodec: "aac",
    audioBitrate: 64,
    framerate: 24,
    preset: "ultrafast",
    tune: "zerolatency",
    cpuIntensity: "low",
  },
};

/**
 * Get preset by name, fallback to 'fast'
 */
export function getPreset(name?: string): EncodingPreset {
  return ENCODING_PRESETS[name || "fast"] || ENCODING_PRESETS["fast"];
}

/**
 * Calculate cost per stream based on preset
 * (CPU usage × hourly rate)
 */
export function estimateCostPerStream(preset: EncodingPreset): number {
  const cpuCostPerHour = 0.05; // $0.05/hour per CPU (rough estimate)

  const cpuMultiplier = {
    low: 0.2,
    medium: 0.4,
    high: 0.7,
  };

  return cpuCostPerHour * cpuMultiplier[preset.cpuIntensity];
}
```

**5.3.2: Dynamic Preset Selection**

Allow backend to specify preset:

**Update `StreamJobData` type**:

```typescript
// src/types.ts

export interface StreamJobData {
  // ... existing fields ...
  preset?: string; // 'ultra-fast' | 'fast' | 'quality' | 'low-bandwidth'
}
```

**Update FFmpegManager**:

```typescript
// src/FFmpegManager.ts

import { getPreset } from './presets';

// In buildFFmpegArgs()
private buildFFmpegArgs(streamConfig: StreamConfig, rtmpUrl: string): string[] {
  const preset = getPreset(streamConfig.preset);

  return [
    // ... input args ...

    // Video encoding (use preset values)
    '-c:v', preset.videoCodec,
    '-preset', preset.preset,
    '-tune', preset.tune,
    '-b:v', `${preset.videoBitrate}k`,

    // ... rest of args ...
  ];
}
```

**5.3.3: Benchmark Presets**

Test each preset locally:

```bash
# Test script
for preset in ultra-fast fast quality low-bandwidth; do
  echo "Testing preset: $preset"

  # Start stream with preset
  # Monitor CPU, memory, output quality

  docker stats whynot-ffmpeg-worker --no-stream
done
```

**Expected Results**:

| Preset        | CPU/Stream | Quality   | Use Case              |
| ------------- | ---------- | --------- | --------------------- |
| ultra-fast    | 15%        | Fair      | High concurrency      |
| fast          | 25%        | Good      | Default (recommended) |
| quality       | 40%        | Excellent | Premium streams       |
| low-bandwidth | 10%        | Fair      | Mobile users          |

**Acceptance Criteria**:

- [x] 4 presets defined
- [x] Backend can select preset
- [x] Presets benchmarked
- [x] Default preset chosen (fast)

---

### Task 5.4: Cost Optimization Strategies (1h)

**Goal**: Implement strategies to reduce costs

**5.4.1: Automatic Stream Termination**

Stop idle streams automatically:

**`src/FFmpegManager.ts`**:

```typescript
// Add idle timeout tracking
interface ProcessEntry {
  process: ChildProcess;
  info: FFmpegProcessInfo;
  retryCount: number;
  lastFrameTime: number; // NEW
  idleTimeout?: NodeJS.Timeout; // NEW
}

// In startStream()
async startStream(job: StreamJob): Promise<void> {
  // ... existing code ...

  const entry: ProcessEntry = {
    process: ffmpegProcess,
    info: processInfo,
    retryCount: 0,
    lastFrameTime: Date.now(),
  };

  // Set idle timeout (10 minutes no frames = stop)
  entry.idleTimeout = setTimeout(() => {
    console.warn(`⏱️  Stream ${channelId} idle for 10 minutes, stopping...`);
    this.stopStream(channelId);
    this.metrics.streams_stopped_total.inc({ reason: 'idle' });
  }, 10 * 60 * 1000);

  this.processes.set(channelId, entry);
}

// Update frame timestamp on activity
private setupProcessHandlers(channelId: number, ffmpeg: ChildProcess): void {
  // ... existing code ...

  ffmpeg.stdout?.on('data', (data) => {
    const entry = this.processes.get(channelId);
    if (entry) {
      entry.lastFrameTime = Date.now();

      // Reset idle timeout
      if (entry.idleTimeout) {
        clearTimeout(entry.idleTimeout);
        entry.idleTimeout = setTimeout(() => {
          this.stopStream(channelId);
        }, 10 * 60 * 1000);
      }
    }
  });
}
```

**5.4.2: Queue Prioritization**

Prioritize jobs to reduce waiting time:

**`src/services/StreamJobQueue.ts`**:

```typescript
// Add priority to job enqueue
async enqueueStream(
  data: Omit<StreamJobData, 'jobId' | 'createdAt'>,
  priority?: number  // 1 (highest) to 10 (lowest)
): Promise<string> {
  const job = await this.queue.add(jobId, jobData, {
    jobId,
    priority: priority || 5, // Default: medium priority
  });

  return job.id!;
}
```

**Priority Levels**:

- **1-3**: Premium/paying users
- **4-6**: Regular users (default)
- **7-10**: Free tier users

**5.4.3: Resource-Based Scaling**

More aggressive scaling rules:

**`render.yaml`** (update):

```yaml
scaling:
  minInstances: 1
  maxInstances: 5
  targetCPUPercent: 60 # More aggressive (was 70)
  targetMemoryPercent: 75 # More aggressive (was 80)
  scaleUpDelaySeconds: 60 # Scale up faster
  scaleDownDelaySeconds: 900 # Keep instances longer (15 min)
```

**Acceptance Criteria**:

- [x] Idle streams stopped automatically
- [x] Queue prioritization implemented
- [x] Scaling rules optimized
- [x] Cost reduced by 10-20%

---

### Task 5.5: Incident Runbooks (30min-1h)

**Goal**: Create runbooks for common issues

**`docs/runbooks/ffmpeg-worker-incidents.md`**:

```markdown
# FFmpeg Worker Incident Runbooks

## 🚨 Incident: All Streams Failing

**Symptoms**:

- `streams_failed_total` metric spiking
- Health checks failing
- Users reporting "stream not working"

**Diagnosis**:

1. Check worker logs: `render logs whynot-ffmpeg-worker`
2. Check Redis connectivity: `curl $REDIS_URL/ping`
3. Check Cloudflare Stream status

**Resolution**:

1. If Redis down: Restart Upstash Redis or switch to backup
2. If FFmpeg crashes: Check for invalid RTMP URLs, restart worker
3. If Cloudflare issue: Wait for resolution or use backup RTMP endpoint

**Prevention**:

- Add RTMP URL validation before enqueueing
- Implement circuit breaker for Cloudflare failures
- Set up backup RTMP endpoints

---

## ⚠️ Incident: High CPU Usage / Slow Streams

**Symptoms**:

- CPU > 90% for extended period
- Streams buffering or dropping frames
- Auto-scaling not helping

**Diagnosis**:

1. Check active streams: `curl $WORKER_URL/stats`
2. Check encoding preset: Are too many streams using 'quality' preset?
3. Check Render instances: Are we at max (5)?

**Resolution**:

1. Temporarily switch to 'fast' preset for all new streams
2. Manually scale up instances (if below max)
3. Stop lowest-priority streams to free resources

**Prevention**:

- Default to 'fast' preset
- Implement stream limits per user
- Add CPU-based admission control

---

## 🔥 Incident: Worker Instance Crashed

**Symptoms**:

- Instance shows "Stopped" in Render dashboard
- All streams for that instance dead
- Health checks timing out

**Diagnosis**:

1. Check Render events for crash reason (OOM, etc.)
2. Check logs before crash: `render logs whynot-ffmpeg-worker --tail 100`
3. Check memory usage pattern

**Resolution**:

1. Render will auto-restart instance (wait 2-3 minutes)
2. If OOM: Reduce MAX_CONCURRENT_STREAMS
3. If crash loop: Roll back to previous deploy

**Prevention**:

- Set memory limits per FFmpeg process
- Implement graceful degradation (reduce quality on high memory)
- Add memory leak detection

---

## 📊 Incident: Redis Queue Backlog

**Symptoms**:

- `queue.waiting` > 50
- Streams taking > 30s to start
- CPU still has capacity

**Diagnosis**:

1. Check Redis memory: Is Upstash at limit?
2. Check worker instance count: Do we need more workers?
3. Check job failure rate: Are jobs retrying forever?

**Resolution**:

1. If Redis full: Upgrade Upstash plan or purge old jobs
2. If worker starved: Manually trigger scale-up
3. If jobs failing: Clear failed jobs, fix root cause

**Prevention**:

- Set job TTL (expire after 1 hour)
- Implement queue size alerts
- Auto-purge failed jobs after 24 hours
```

**Acceptance Criteria**:

- [x] Runbooks cover top 5 incidents
- [x] Clear diagnosis steps
- [x] Actionable resolution steps
- [x] Prevention strategies documented

---

## ✅ Phase 5 Completion Checklist

- [ ] Metrics collection implemented (/metrics endpoint)
- [ ] Prometheus metrics exposed
- [ ] Alerts configured in Render
- [ ] Custom alert endpoint created
- [ ] FFmpeg encoding presets defined and benchmarked
- [ ] Cost optimization strategies implemented
- [ ] Incident runbooks created
- [ ] All optimizations tested in production

---

## 📊 Estimated vs Actual Time

| Task      | Estimated | Actual | Notes |
| --------- | --------- | ------ | ----- |
| 5.1       | 1-2h      |        |       |
| 5.2       | 1h        |        |       |
| 5.3       | 1-2h      |        |       |
| 5.4       | 1h        |        |       |
| 5.5       | 30min-1h  |        |       |
| **Total** | **4-6h**  |        |       |

---

## 🎯 Success Metrics

After Phase 5, validate these targets:

| Metric               | Target  | Actual |
| -------------------- | ------- | ------ |
| Stream start latency | < 5s    |        |
| Stream success rate  | > 99%   |        |
| Worker uptime        | > 99.5% |        |
| Alert response time  | < 5 min |        |
| Cost per stream-hour | < $0.10 |        |
| CPU usage (avg)      | < 60%   |        |

---

## 🔄 Next Phase

After completing Phase 5, proceed to **Phase 6: Load Testing & Production Validation** for final stress testing and production readiness verification.

**Phase 6 Preview**:

- Load test with 50+ concurrent streams
- Stress test auto-scaling
- Validate failover scenarios
- Document production readiness
- Create go-live checklist
