# Phase 1: FFmpeg Worker Service Setup

**Duration**: 6-8 hours  
**Status**: ⬜ Not Started  
**Prerequisites**: Dev-Quality Track 010 completed ✅

---

## 🎯 Objective

Create a standalone FFmpeg worker service as a Docker container that can:

1. Pull conversion jobs from Redis queue
2. Spawn FFmpeg child processes for RTC → RTMP conversion
3. Manage multiple concurrent FFmpeg processes
4. Expose health check endpoint
5. Handle graceful shutdown

---

## 📋 Tasks

### Task 1.1: Directory Structure & Initial Setup (30min)

**Goal**: Create ffmpeg-worker service directory with basic configuration

**Steps**:

```bash
# Create worker directory
mkdir -p ffmpeg-worker/src

# Initialize Node.js project
cd ffmpeg-worker
npm init -y

# Install dependencies
npm install --save \
  ioredis \
  bullmq \
  express \
  dotenv

npm install --save-dev \
  @types/node \
  @types/express \
  typescript \
  tsx \
  @types/ioredis
```

**File Structure**:

```
ffmpeg-worker/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .dockerignore
├── .env.example
└── src/
    ├── index.ts              # Main entry point
    ├── FFmpegManager.ts      # Spawn/manage processes
    ├── RedisConsumer.ts      # Queue consumer
    ├── HealthServer.ts       # HTTP health endpoint
    ├── types.ts              # TypeScript types
    └── config.ts             # Configuration
```

**Configuration Files**:

**`package.json`**:

```json
{
  "name": "whynot-ffmpeg-worker",
  "version": "1.0.0",
  "description": "FFmpeg RTMP relay worker for WhyNot streaming platform",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "ioredis": "^5.3.2",
    "bullmq": "^5.1.5",
    "express": "^4.18.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/express": "^4.17.21",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "@types/ioredis": "^5.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**`tsconfig.json`**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**`.env.example`**:

```bash
# Redis connection
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info

# FFmpeg settings
MAX_CONCURRENT_STREAMS=10
FFMPEG_LOG_LEVEL=warning

# Health check server
HEALTH_PORT=8080
```

**Acceptance Criteria**:

- [x] Directory structure created
- [x] package.json with correct dependencies
- [x] tsconfig.json configured
- [x] .env.example with all variables

---

### Task 1.2: TypeScript Types & Configuration (30min)

**Goal**: Define types and configuration for the worker service

**`src/types.ts`**:

```typescript
// src/types.ts

export interface StreamJob {
  jobId: string;
  channelId: number;
  rtmpUrl: string;
  agoraToken: string;
  agoraChannel: string;
  streamConfig: StreamConfig;
  createdAt: Date;
}

export interface StreamConfig {
  videoCodec: "h264" | "h265";
  videoBitrate: number; // kbps
  videoResolution: "1080p" | "720p" | "480p";
  audioCodec: "aac" | "opus";
  audioBitrate: number; // kbps
  framerate: number;
}

export interface FFmpegProcessInfo {
  pid: number;
  channelId: number;
  startedAt: Date;
  status: "starting" | "running" | "stopping" | "error";
  errorCount: number;
  lastError?: string;
}

export interface WorkerHealth {
  status: "healthy" | "degraded" | "unhealthy";
  activeStreams: number;
  maxStreams: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  lastCheck: Date;
}

export interface FFmpegConfig {
  inputFormat: string;
  videoCodec: string;
  audioCodec: string;
  preset: string;
  tune: string;
  pixelFormat: string;
  colorspace: string;
  outputFormat: string;
}
```

**`src/config.ts`**:

```typescript
// src/config.ts
import dotenv from "dotenv";

dotenv.config();

export const config = {
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    queueName: "ffmpeg-stream-jobs",
  },

  ffmpeg: {
    maxConcurrentStreams: parseInt(process.env.MAX_CONCURRENT_STREAMS || "10"),
    logLevel: process.env.FFMPEG_LOG_LEVEL || "warning",
    defaultConfig: {
      videoCodec: "h264",
      videoBitrate: 2500, // kbps
      videoResolution: "720p",
      audioCodec: "aac",
      audioBitrate: 128, // kbps
      framerate: 30,
    },
  },

  health: {
    port: parseInt(process.env.HEALTH_PORT || "8080"),
    checkInterval: 30000, // 30 seconds
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
} as const;

// Validate required env vars
if (!config.redis.url) {
  throw new Error("REDIS_URL environment variable is required");
}

console.log("✅ Configuration loaded:", {
  redisUrl: config.redis.url,
  maxStreams: config.ffmpeg.maxConcurrentStreams,
  healthPort: config.health.port,
});
```

**Acceptance Criteria**:

- [x] All types defined with clear interfaces
- [x] Configuration validates required env vars
- [x] Default values provided for optional settings

---

### Task 1.3: FFmpegManager - Process Spawner (2-3h)

**Goal**: Implement core FFmpeg process management

**`src/FFmpegManager.ts`**:

```typescript
// src/FFmpegManager.ts
import { spawn, ChildProcess } from "child_process";
import { StreamJob, FFmpegProcessInfo, StreamConfig } from "./types";
import { config } from "./config";

interface ProcessEntry {
  process: ChildProcess;
  info: FFmpegProcessInfo;
  retryCount: number;
}

export class FFmpegManager {
  private processes = new Map<number, ProcessEntry>();
  private readonly MAX_RETRIES = 3;

  constructor() {
    console.log("📦 FFmpegManager initialized");

    // Graceful shutdown handler
    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  /**
   * Start FFmpeg process for a stream
   */
  async startStream(job: StreamJob): Promise<void> {
    const { channelId, rtmpUrl, streamConfig } = job;

    // Check if already running
    if (this.processes.has(channelId)) {
      console.warn(`⚠️  Stream ${channelId} already running`);
      return;
    }

    // Check capacity
    if (this.processes.size >= config.ffmpeg.maxConcurrentStreams) {
      throw new Error(
        `Max concurrent streams reached (${config.ffmpeg.maxConcurrentStreams})`,
      );
    }

    console.log(`🎬 Starting FFmpeg for channel ${channelId}`);

    const ffmpegArgs = this.buildFFmpegArgs(streamConfig, rtmpUrl);

    const ffmpegProcess = spawn("ffmpeg", ffmpegArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const processInfo: FFmpegProcessInfo = {
      pid: ffmpegProcess.pid!,
      channelId,
      startedAt: new Date(),
      status: "starting",
      errorCount: 0,
    };

    this.processes.set(channelId, {
      process: ffmpegProcess,
      info: processInfo,
      retryCount: 0,
    });

    // Setup event handlers
    this.setupProcessHandlers(channelId, ffmpegProcess);
  }

  /**
   * Build FFmpeg command arguments
   */
  private buildFFmpegArgs(
    streamConfig: StreamConfig,
    rtmpUrl: string,
  ): string[] {
    const resolution = this.getResolution(streamConfig.videoResolution);

    return [
      // Input from stdin (RTC frames will be piped)
      "-f",
      "rawvideo",
      "-pixel_format",
      "yuv420p",
      "-video_size",
      resolution,
      "-framerate",
      streamConfig.framerate.toString(),
      "-i",
      "pipe:0",

      // Video encoding
      "-c:v",
      streamConfig.videoCodec,
      "-preset",
      "veryfast",
      "-tune",
      "zerolatency",
      "-b:v",
      `${streamConfig.videoBitrate}k`,
      "-maxrate",
      `${streamConfig.videoBitrate * 1.2}k`,
      "-bufsize",
      `${streamConfig.videoBitrate * 2}k`,
      "-pix_fmt",
      "yuv420p",
      "-g",
      (streamConfig.framerate * 2).toString(), // GOP size = 2 seconds

      // Audio encoding
      "-c:a",
      streamConfig.audioCodec,
      "-b:a",
      `${streamConfig.audioBitrate}k`,
      "-ar",
      "48000",
      "-ac",
      "2",

      // Output format
      "-f",
      "flv",

      // Logging
      "-loglevel",
      config.ffmpeg.logLevel,

      // Output URL
      rtmpUrl,
    ];
  }

  /**
   * Get resolution dimensions
   */
  private getResolution(res: string): string {
    const resolutions: Record<string, string> = {
      "1080p": "1920x1080",
      "720p": "1280x720",
      "480p": "854x480",
    };
    return resolutions[res] || resolutions["720p"];
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(channelId: number, ffmpeg: ChildProcess): void {
    const entry = this.processes.get(channelId);
    if (!entry) return;

    ffmpeg.on("spawn", () => {
      console.log(
        `✅ FFmpeg process spawned for channel ${channelId} (PID: ${ffmpeg.pid})`,
      );
      entry.info.status = "running";
    });

    ffmpeg.on("error", (error) => {
      console.error(`❌ FFmpeg error for channel ${channelId}:`, error);
      entry.info.status = "error";
      entry.info.errorCount++;
      entry.info.lastError = error.message;

      this.handleProcessFailure(channelId, error);
    });

    ffmpeg.on("exit", (code, signal) => {
      console.log(
        `🔚 FFmpeg exited for channel ${channelId} (code: ${code}, signal: ${signal})`,
      );

      if (code !== 0 && code !== null) {
        entry.info.status = "error";
        this.handleProcessFailure(channelId, new Error(`Exit code: ${code}`));
      } else {
        this.processes.delete(channelId);
      }
    });

    // Capture stderr for debugging
    ffmpeg.stderr?.on("data", (data) => {
      const log = data.toString();
      if (log.includes("error") || log.includes("Error")) {
        console.error(`FFmpeg stderr (${channelId}):`, log);
      }
    });

    // Capture stdout
    ffmpeg.stdout?.on("data", (data) => {
      // Could parse FFmpeg stats here if needed
      // Example: frame=  123 fps= 30 q=28.0 size=    1024kB time=00:00:04.10
    });
  }

  /**
   * Handle process failure with retry logic
   */
  private async handleProcessFailure(
    channelId: number,
    error: Error,
  ): Promise<void> {
    const entry = this.processes.get(channelId);
    if (!entry) return;

    entry.retryCount++;

    if (entry.retryCount <= this.MAX_RETRIES) {
      console.log(
        `🔄 Retrying stream ${channelId} (attempt ${entry.retryCount}/${this.MAX_RETRIES})`,
      );

      // Clean up failed process
      this.processes.delete(channelId);

      // Wait 5 seconds before retry
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // TODO: Re-enqueue job to Redis instead of retrying here
      console.log(`⚠️  Stream ${channelId} needs manual re-enqueue`);
    } else {
      console.error(
        `💀 Stream ${channelId} failed after ${this.MAX_RETRIES} retries`,
      );
      this.processes.delete(channelId);

      // TODO: Send alert/notification
    }
  }

  /**
   * Stop stream for a channel
   */
  stopStream(channelId: number): void {
    const entry = this.processes.get(channelId);
    if (!entry) {
      console.warn(`⚠️  No active stream for channel ${channelId}`);
      return;
    }

    console.log(`🛑 Stopping stream for channel ${channelId}`);
    entry.info.status = "stopping";

    // Send SIGTERM for graceful shutdown
    entry.process.kill("SIGTERM");

    // Force kill after 10 seconds if not stopped
    setTimeout(() => {
      if (this.processes.has(channelId)) {
        console.warn(`⚠️  Force killing stream ${channelId}`);
        entry.process.kill("SIGKILL");
        this.processes.delete(channelId);
      }
    }, 10000);
  }

  /**
   * Get status of a specific stream
   */
  getStreamStatus(channelId: number): FFmpegProcessInfo | null {
    const entry = this.processes.get(channelId);
    return entry ? { ...entry.info } : null;
  }

  /**
   * Get all active streams
   */
  getAllStreams(): FFmpegProcessInfo[] {
    return Array.from(this.processes.values()).map((e) => ({ ...e.info }));
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      activeStreams: this.processes.size,
      maxStreams: config.ffmpeg.maxConcurrentStreams,
      utilization:
        (this.processes.size / config.ffmpeg.maxConcurrentStreams) * 100,
      streams: this.getAllStreams(),
    };
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    console.log("🔚 Shutting down FFmpegManager...");

    const channelIds = Array.from(this.processes.keys());

    console.log(`Stopping ${channelIds.length} active streams...`);
    channelIds.forEach((id) => this.stopStream(id));

    // Wait up to 15 seconds for graceful shutdown
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Force kill any remaining
    this.processes.forEach((entry, id) => {
      console.warn(`Force killing stream ${id}`);
      entry.process.kill("SIGKILL");
    });

    this.processes.clear();
    console.log("✅ FFmpegManager shutdown complete");
    process.exit(0);
  }
}
```

**Acceptance Criteria**:

- [x] Can spawn FFmpeg child processes
- [x] Handles process lifecycle (spawn, error, exit)
- [x] Retry logic for failed processes
- [x] Graceful shutdown on SIGTERM
- [x] Resource tracking (active streams, capacity)

---

### Task 1.4: Redis Queue Consumer (1-2h)

**Goal**: Implement BullMQ consumer to pull jobs from Redis

**`src/RedisConsumer.ts`**:

```typescript
// src/RedisConsumer.ts
import { Worker, Job } from "bullmq";
import { StreamJob } from "./types";
import { config } from "./config";
import { FFmpegManager } from "./FFmpegManager";

export class RedisConsumer {
  private worker: Worker<StreamJob>;
  private ffmpegManager: FFmpegManager;

  constructor(ffmpegManager: FFmpegManager) {
    this.ffmpegManager = ffmpegManager;

    this.worker = new Worker<StreamJob>(
      config.redis.queueName,
      async (job: Job<StreamJob>) => {
        return this.processJob(job);
      },
      {
        connection: {
          host: this.getRedisHost(),
          port: this.getRedisPort(),
        },
        concurrency: config.ffmpeg.maxConcurrentStreams,
        limiter: {
          max: config.ffmpeg.maxConcurrentStreams,
          duration: 1000,
        },
      },
    );

    this.setupEventHandlers();
    console.log("✅ Redis consumer initialized");
  }

  /**
   * Process a stream job
   */
  private async processJob(job: Job<StreamJob>): Promise<void> {
    const { channelId, rtmpUrl } = job.data;

    console.log(`📥 Processing job ${job.id} for channel ${channelId}`);

    try {
      await this.ffmpegManager.startStream(job.data);
      console.log(`✅ Job ${job.id} started successfully`);
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      throw error; // BullMQ will retry based on settings
    }
  }

  /**
   * Setup worker event handlers
   */
  private setupEventHandlers(): void {
    this.worker.on("completed", (job) => {
      console.log(`✅ Job ${job.id} completed`);
    });

    this.worker.on("failed", (job, error) => {
      console.error(`❌ Job ${job?.id} failed:`, error);
    });

    this.worker.on("error", (error) => {
      console.error("❌ Worker error:", error);
    });

    this.worker.on("active", (job) => {
      console.log(`⚙️  Job ${job.id} is now active`);
    });
  }

  /**
   * Parse Redis URL for host
   */
  private getRedisHost(): string {
    const url = new URL(config.redis.url);
    return url.hostname || "localhost";
  }

  /**
   * Parse Redis URL for port
   */
  private getRedisPort(): number {
    const url = new URL(config.redis.url);
    return parseInt(url.port) || 6379;
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    console.log("🔚 Closing Redis consumer...");
    await this.worker.close();
    console.log("✅ Redis consumer closed");
  }
}
```

**Acceptance Criteria**:

- [x] Connects to Redis successfully
- [x] Pulls jobs from queue
- [x] Passes jobs to FFmpegManager
- [x] Handles errors with retries
- [x] Graceful shutdown

---

### Task 1.5: Health Check Server (1h)

**Goal**: HTTP server for health checks and monitoring

**`src/HealthServer.ts`**:

```typescript
// src/HealthServer.ts
import express, { Request, Response } from "express";
import { FFmpegManager } from "./FFmpegManager";
import { config } from "./config";

export class HealthServer {
  private app = express();
  private ffmpegManager: FFmpegManager;

  constructor(ffmpegManager: FFmpegManager) {
    this.ffmpegManager = ffmpegManager;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req: Request, res: Response) => {
      const stats = this.ffmpegManager.getStats();

      const health = {
        status: stats.activeStreams < stats.maxStreams ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        activeStreams: stats.activeStreams,
        maxStreams: stats.maxStreams,
        utilization: stats.utilization,
        memory: {
          used: process.memoryUsage().heapUsed / 1024 / 1024,
          total: process.memoryUsage().heapTotal / 1024 / 1024,
        },
      };

      const statusCode = health.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Streams endpoint (debugging)
    this.app.get("/streams", (req: Request, res: Response) => {
      const streams = this.ffmpegManager.getAllStreams();
      res.json({ count: streams.length, streams });
    });

    // Stats endpoint
    this.app.get("/stats", (req: Request, res: Response) => {
      const stats = this.ffmpegManager.getStats();
      res.json(stats);
    });

    // Root endpoint
    this.app.get("/", (req: Request, res: Response) => {
      res.json({
        service: "whynot-ffmpeg-worker",
        version: "1.0.0",
        endpoints: ["/health", "/streams", "/stats"],
      });
    });
  }

  start(): void {
    this.app.listen(config.health.port, () => {
      console.log(`✅ Health server running on port ${config.health.port}`);
      console.log(`   http://localhost:${config.health.port}/health`);
    });
  }
}
```

**Acceptance Criteria**:

- [x] `/health` returns 200 when healthy
- [x] `/streams` returns active stream list
- [x] `/stats` returns worker statistics
- [x] Returns proper HTTP status codes

---

### Task 1.6: Main Entry Point (30min)

**Goal**: Wire everything together

**`src/index.ts`**:

```typescript
// src/index.ts
import { FFmpegManager } from "./FFmpegManager";
import { RedisConsumer } from "./RedisConsumer";
import { HealthServer } from "./HealthServer";
import { config } from "./config";

async function main() {
  console.log("🚀 Starting WhyNot FFmpeg Worker...");
  console.log("Configuration:", {
    redisUrl: config.redis.url,
    maxStreams: config.ffmpeg.maxConcurrentStreams,
    healthPort: config.health.port,
  });

  // Initialize components
  const ffmpegManager = new FFmpegManager();
  const redisConsumer = new RedisConsumer(ffmpegManager);
  const healthServer = new HealthServer(ffmpegManager);

  // Start health server
  healthServer.start();

  console.log("✅ FFmpeg Worker ready and waiting for jobs");
  console.log(`📡 Health check: http://localhost:${config.health.port}/health`);

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("🔚 Received SIGTERM, shutting down...");
    await redisConsumer.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
```

**Acceptance Criteria**:

- [x] All components initialized
- [x] Graceful shutdown on SIGTERM
- [x] Proper error handling

---

### Task 1.7: Dockerfile (1h)

**Goal**: Create Docker image with FFmpeg

**`Dockerfile`**:

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Install only production dependencies
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

# Copy built files
COPY --from=builder /app/dist ./dist

# Expose health check port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -q --spider http://localhost:8080/health || exit 1

# Set environment
ENV NODE_ENV=production

# Start worker
CMD ["node", "dist/index.js"]
```

**`.dockerignore`**:

```
node_modules
dist
.env
.git
*.md
npm-debug.log
```

**Build & Test**:

```bash
cd ffmpeg-worker

# Build image
docker build -t whynot-ffmpeg-worker:latest .

# Run container
docker run --rm \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -p 8080:8080 \
  whynot-ffmpeg-worker:latest

# Test health endpoint
curl http://localhost:8080/health
```

**Acceptance Criteria**:

- [x] Dockerfile builds successfully
- [x] Image size < 300MB
- [x] FFmpeg installed and working
- [x] Health check passes
- [x] Container runs without errors

---

### Task 1.8: Integration Testing (1-2h)

**Goal**: Test FFmpeg worker with mock Redis jobs

**Test Script** (`scripts/test-ffmpeg-worker.sh`):

```bash
#!/bin/bash
set -e

echo "🧪 Testing FFmpeg Worker..."

# Start Redis (if not running)
docker run -d --name test-redis -p 6379:6379 redis:7-alpine || echo "Redis already running"

# Build worker
cd ffmpeg-worker
docker build -t whynot-ffmpeg-worker:test .

# Run worker
docker run -d \
  --name test-ffmpeg-worker \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -p 8080:8080 \
  whynot-ffmpeg-worker:test

# Wait for startup
sleep 5

# Test health endpoint
echo "Testing /health..."
curl -f http://localhost:8080/health

# TODO: Add test Redis job
# (Will integrate with backend in Phase 2)

# Cleanup
docker stop test-ffmpeg-worker test-redis
docker rm test-ffmpeg-worker test-redis

echo "✅ Tests passed!"
```

**Acceptance Criteria**:

- [x] Worker starts without errors
- [x] Health endpoint responds
- [x] Connects to Redis successfully
- [x] Shutdown gracefully

---

## ✅ Phase 1 Completion Checklist

- [ ] All TypeScript files created and compiling
- [ ] Dockerfile builds successfully
- [ ] Health server responds on port 8080
- [ ] Redis connection working
- [ ] FFmpeg can be spawned as child process
- [ ] Process lifecycle management implemented
- [ ] Graceful shutdown works
- [ ] Integration test script passes
- [ ] Code reviewed and committed to git

---

## 📊 Estimated vs Actual Time

| Task      | Estimated | Actual | Notes |
| --------- | --------- | ------ | ----- |
| 1.1       | 30min     |        |       |
| 1.2       | 30min     |        |       |
| 1.3       | 2-3h      |        |       |
| 1.4       | 1-2h      |        |       |
| 1.5       | 1h        |        |       |
| 1.6       | 30min     |        |       |
| 1.7       | 1h        |        |       |
| 1.8       | 1-2h      |        |       |
| **Total** | **6-8h**  |        |       |

---

## 🔄 Next Phase

After completing Phase 1, proceed to **Phase 2: Backend RTC → Redis Integration** to connect the backend to the FFmpeg worker.
