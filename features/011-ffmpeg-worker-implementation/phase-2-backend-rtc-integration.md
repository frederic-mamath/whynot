# Phase 2: Backend RTC → Redis Integration

**Duration**: 4-6 hours  
**Status**: ⬜ Not Started  
**Prerequisites**: Phase 1 completed ✅

---

## 🎯 Objective

Integrate the backend with the FFmpeg worker by:

1. Installing Agora RTC Server SDK
2. Creating RTCToRTMPBridge service to subscribe to RTC streams
3. Implementing Redis job queue producer
4. Updating relay endpoints to use Redis queue
5. Receiving RTC frames and piping them to FFmpeg workers

---

## 📋 Tasks

### Task 2.1: Install Agora RTC Server SDK (30min)

**Goal**: Add Agora RTC SDK for server-side RTC subscription

**Steps**:

```bash
cd /Users/fredericmamath/freelance/whynot

# Install Agora RTC SDK
npm install --save agora-access-token agora-rte-sdk

# Install BullMQ for queue management
npm install --save bullmq

# Install types
npm install --save-dev @types/node
```

**Verify Installation**:

```bash
npm list agora-rte-sdk bullmq
```

**Package Versions**:

- `agora-access-token`: ^2.0.6
- `agora-rte-sdk`: ^1.5.0 (Server SDK)
- `bullmq`: ^5.1.5

**Acceptance Criteria**:

- [x] Dependencies installed successfully
- [x] No version conflicts
- [x] Types available for TypeScript

---

### Task 2.2: Create RTCToRTMPBridge Service (2-3h)

**Goal**: Service that subscribes to Agora RTC channels and pipes frames to FFmpeg

**`src/services/RTCToRTMPBridge.ts`**:

```typescript
// src/services/RTCToRTMPBridge.ts

import {
  RtcConnection,
  RtcOptions,
  RemoteAudioTrack,
  RemoteVideoTrack,
} from "agora-rte-sdk";
import { EventEmitter } from "events";
import { StreamConfig } from "../types/streaming";

interface BridgeConfig {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
  streamConfig: StreamConfig;
}

export class RTCToRTMPBridge extends EventEmitter {
  private connection: RtcConnection | null = null;
  private videoTrack: RemoteVideoTrack | null = null;
  private audioTrack: RemoteAudioTrack | null = null;
  private isConnected = false;
  private frameCallback: ((frame: Buffer) => void) | null = null;

  constructor(private config: BridgeConfig) {
    super();
    console.log(
      `🌉 RTCToRTMPBridge created for channel: ${config.channelName}`,
    );
  }

  /**
   * Connect to Agora RTC channel and subscribe to streams
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn("Already connected to RTC channel");
      return;
    }

    console.log(`🔌 Connecting to Agora channel: ${this.config.channelName}`);

    const options: RtcOptions = {
      appId: this.config.appId,
      channelId: this.config.channelName,
      userId: this.config.uid.toString(),
      token: this.config.token,
      audioSubscribeOptions: {
        bytesPerSample: 2,
        numberOfChannels: 2,
        sampleRateHz: 48000,
      },
      videoSubscribeOptions: {
        type: "decoded",
        decodedVideoFrameOnly: true,
      },
    };

    this.connection = new RtcConnection(options);

    // Setup event handlers
    this.setupConnectionHandlers();

    // Connect to channel
    await this.connection.connect();

    this.isConnected = true;
    console.log(`✅ Connected to RTC channel: ${this.config.channelName}`);
  }

  /**
   * Setup RTC connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.connection) return;

    // User joined
    this.connection.on("user-joined", (userId) => {
      console.log(`👤 User joined: ${userId}`);
      this.emit("user-joined", userId);
    });

    // User left
    this.connection.on("user-left", (userId) => {
      console.log(`👋 User left: ${userId}`);
      this.emit("user-left", userId);
    });

    // User published video
    this.connection.on("user-published", async (userId, mediaType) => {
      console.log(`📹 User ${userId} published ${mediaType}`);

      if (mediaType === "video") {
        await this.subscribeToVideo(userId);
      } else if (mediaType === "audio") {
        await this.subscribeToAudio(userId);
      }
    });

    // User unpublished
    this.connection.on("user-unpublished", (userId, mediaType) => {
      console.log(`🔇 User ${userId} unpublished ${mediaType}`);

      if (mediaType === "video") {
        this.videoTrack = null;
      } else if (mediaType === "audio") {
        this.audioTrack = null;
      }
    });

    // Connection state changed
    this.connection.on("connection-state-changed", (state, reason) => {
      console.log(`🔄 Connection state: ${state}, reason: ${reason}`);
      this.emit("connection-state-changed", { state, reason });
    });

    // Error
    this.connection.on("error", (error) => {
      console.error("❌ RTC connection error:", error);
      this.emit("error", error);
    });
  }

  /**
   * Subscribe to video track
   */
  private async subscribeToVideo(userId: string): Promise<void> {
    if (!this.connection) return;

    try {
      this.videoTrack = (await this.connection.subscribe(
        userId,
        "video",
      )) as RemoteVideoTrack;
      console.log(`✅ Subscribed to video from user ${userId}`);

      // Setup video frame handler
      this.videoTrack.on("video-frame-received", (frame) => {
        this.handleVideoFrame(frame);
      });

      this.emit("video-subscribed", userId);
    } catch (error) {
      console.error(`Failed to subscribe to video from ${userId}:`, error);
      this.emit("subscription-error", { userId, mediaType: "video", error });
    }
  }

  /**
   * Subscribe to audio track
   */
  private async subscribeToAudio(userId: string): Promise<void> {
    if (!this.connection) return;

    try {
      this.audioTrack = (await this.connection.subscribe(
        userId,
        "audio",
      )) as RemoteAudioTrack;
      console.log(`✅ Subscribed to audio from user ${userId}`);

      // Setup audio frame handler
      this.audioTrack.on("audio-frame-received", (frame) => {
        this.handleAudioFrame(frame);
      });

      this.emit("audio-subscribed", userId);
    } catch (error) {
      console.error(`Failed to subscribe to audio from ${userId}:`, error);
      this.emit("subscription-error", { userId, mediaType: "audio", error });
    }
  }

  /**
   * Handle received video frame
   */
  private handleVideoFrame(frame: any): void {
    // Convert video frame to raw YUV420 buffer
    // This will be piped to FFmpeg stdin

    // Example frame structure:
    // {
    //   buffer: Buffer,
    //   width: number,
    //   height: number,
    //   yStride: number,
    //   uStride: number,
    //   vStride: number,
    //   timestamp: number
    // }

    if (this.frameCallback && frame.buffer) {
      this.frameCallback(frame.buffer);
    }

    this.emit("video-frame", frame);
  }

  /**
   * Handle received audio frame
   */
  private handleAudioFrame(frame: any): void {
    // Audio frames will also need to be sent to FFmpeg
    // For now, we emit the event for later processing

    this.emit("audio-frame", frame);
  }

  /**
   * Set callback for video frames (will pipe to FFmpeg)
   */
  setFrameCallback(callback: (frame: Buffer) => void): void {
    this.frameCallback = callback;
  }

  /**
   * Get stream statistics
   */
  getStats(): any {
    return {
      isConnected: this.isConnected,
      hasVideo: this.videoTrack !== null,
      hasAudio: this.audioTrack !== null,
      channelName: this.config.channelName,
      uid: this.config.uid,
    };
  }

  /**
   * Disconnect from RTC channel
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.connection) {
      console.warn("Not connected to RTC channel");
      return;
    }

    console.log(
      `🔌 Disconnecting from RTC channel: ${this.config.channelName}`,
    );

    try {
      // Unsubscribe from tracks
      if (this.videoTrack) {
        this.videoTrack.removeAllListeners();
        this.videoTrack = null;
      }

      if (this.audioTrack) {
        this.audioTrack.removeAllListeners();
        this.audioTrack = null;
      }

      // Disconnect connection
      await this.connection.disconnect();
      this.connection.removeAllListeners();
      this.connection = null;

      this.isConnected = false;
      console.log(
        `✅ Disconnected from RTC channel: ${this.config.channelName}`,
      );
    } catch (error) {
      console.error("Error disconnecting from RTC:", error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.disconnect();
    this.removeAllListeners();
    this.frameCallback = null;
    console.log("🗑️  RTCToRTMPBridge destroyed");
  }
}
```

**Acceptance Criteria**:

- [x] Connects to Agora RTC channel
- [x] Subscribes to video/audio tracks
- [x] Receives video frames as buffers
- [x] Event emitter for lifecycle events
- [x] Graceful disconnect and cleanup

---

### Task 2.3: Redis Queue Producer (1h)

**Goal**: Create service to enqueue FFmpeg jobs to Redis

**`src/services/StreamJobQueue.ts`**:

```typescript
// src/services/StreamJobQueue.ts

import { Queue, QueueOptions } from "bullmq";
import { StreamConfig } from "../types/streaming";

export interface StreamJobData {
  jobId: string;
  channelId: number;
  rtmpUrl: string;
  agoraToken: string;
  agoraChannel: string;
  streamConfig: StreamConfig;
  createdAt: Date;
}

export class StreamJobQueue {
  private queue: Queue<StreamJobData>;
  private queueName = "ffmpeg-stream-jobs";

  constructor(redisUrl: string) {
    const url = new URL(redisUrl);

    const connection: QueueOptions["connection"] = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
    };

    // Add password if present
    if (url.password) {
      connection.password = url.password;
    }

    this.queue = new Queue<StreamJobData>(this.queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000, // 5s, 25s, 125s
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 100,
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    });

    console.log(`✅ StreamJobQueue initialized (queue: ${this.queueName})`);
  }

  /**
   * Enqueue a new stream job
   */
  async enqueueStream(
    data: Omit<StreamJobData, "jobId" | "createdAt">,
  ): Promise<string> {
    const jobId = `stream-${data.channelId}-${Date.now()}`;

    const jobData: StreamJobData = {
      ...data,
      jobId,
      createdAt: new Date(),
    };

    try {
      const job = await this.queue.add(jobId, jobData, {
        jobId, // Use same ID to prevent duplicates
      });

      console.log(
        `📤 Enqueued stream job: ${jobId} for channel ${data.channelId}`,
      );
      return job.id!;
    } catch (error) {
      console.error(
        `Failed to enqueue stream job for channel ${data.channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(jobId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.remove();
        console.log(`🗑️  Removed job: ${jobId}`);
      }
    } catch (error) {
      console.error(`Failed to remove job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<string | null> {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return state;
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<any> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return {
      queueName: this.queueName,
      waiting,
      active,
      completed,
      failed,
      total: waiting + active,
    };
  }

  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    await this.queue.close();
    console.log("✅ StreamJobQueue closed");
  }
}
```

**Acceptance Criteria**:

- [x] Can enqueue jobs to Redis
- [x] Prevents duplicate jobs (same jobId)
- [x] Retry logic configured (3 attempts)
- [x] Job cleanup (completed/failed)
- [x] Queue statistics available

---

### Task 2.4: Update Streaming Service (1-2h)

**Goal**: Integrate RTCToRTMPBridge and Redis queue into existing streaming logic

**`src/services/StreamingService.ts`** (updates):

```typescript
// src/services/StreamingService.ts

import { RTCToRTMPBridge } from "./RTCToRTMPBridge";
import { StreamJobQueue, StreamJobData } from "./StreamJobQueue";
import { generateRtcToken } from "../utils/agora";
import { Channel } from "../types/models";
import { getEnv } from "../utils/env";

export class StreamingService {
  private jobQueue: StreamJobQueue;
  private activeBridges = new Map<number, RTCToRTMPBridge>();

  constructor() {
    const redisUrl = getEnv("REDIS_URL");
    this.jobQueue = new StreamJobQueue(redisUrl);
  }

  /**
   * Start RTMP relay for a channel
   * This creates a server-side RTC subscriber that converts to RTMP
   */
  async startRTMPRelay(channel: Channel): Promise<void> {
    const { id: channelId, name, rtmp_url } = channel;

    console.log(`🎬 Starting RTMP relay for channel ${channelId}`);

    // Check if already relaying
    if (this.activeBridges.has(channelId)) {
      console.warn(`Channel ${channelId} already has active RTMP relay`);
      return;
    }

    // Generate RTC token for server-side subscriber
    const rtcUid = 999000 + channelId; // Reserved UID range for relays
    const agoraToken = generateRtcToken(name, rtcUid);

    // Prepare stream configuration
    const streamConfig = {
      videoCodec: "h264" as const,
      videoBitrate: 2500, // 2.5 Mbps
      videoResolution: "720p" as const,
      audioCodec: "aac" as const,
      audioBitrate: 128, // 128 kbps
      framerate: 30,
    };

    // Enqueue job to Redis (FFmpeg worker will pick it up)
    await this.jobQueue.enqueueStream({
      channelId,
      rtmpUrl: rtmp_url!,
      agoraToken,
      agoraChannel: name,
      streamConfig,
    });

    // Create RTC bridge (optional: for monitoring/debugging)
    // In production, the FFmpeg worker will handle RTC subscription
    // This is just for tracking active relays in the backend
    const bridge = new RTCToRTMPBridge({
      appId: getEnv("AGORA_APP_ID"),
      channelName: name,
      token: agoraToken,
      uid: rtcUid,
      streamConfig,
    });

    this.activeBridges.set(channelId, bridge);

    console.log(`✅ RTMP relay started for channel ${channelId}`);
  }

  /**
   * Stop RTMP relay for a channel
   */
  async stopRTMPRelay(channelId: number): Promise<void> {
    console.log(`🛑 Stopping RTMP relay for channel ${channelId}`);

    const bridge = this.activeBridges.get(channelId);
    if (bridge) {
      await bridge.destroy();
      this.activeBridges.delete(channelId);
    }

    // TODO: Signal FFmpeg worker to stop (implement in Phase 3)
    // For now, FFmpeg worker will auto-stop when stream ends

    console.log(`✅ RTMP relay stopped for channel ${channelId}`);
  }

  /**
   * Get relay statistics
   */
  async getRelayStats(): Promise<any> {
    const queueStats = await this.jobQueue.getStats();
    const activeBridges = Array.from(this.activeBridges.entries()).map(
      ([channelId, bridge]) => ({
        channelId,
        stats: bridge.getStats(),
      }),
    );

    return {
      queue: queueStats,
      activeBridges,
      totalActive: activeBridges.length,
    };
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    console.log("🔚 Destroying StreamingService...");

    // Stop all active bridges
    for (const [channelId, bridge] of this.activeBridges) {
      await bridge.destroy();
    }
    this.activeBridges.clear();

    // Close queue
    await this.jobQueue.close();

    console.log("✅ StreamingService destroyed");
  }
}
```

**Acceptance Criteria**:

- [x] Can start RTMP relay via Redis queue
- [x] Manages RTC bridges for monitoring
- [x] Provides relay statistics
- [x] Graceful cleanup

---

### Task 2.5: Update tRPC Router (30min)

**Goal**: Add endpoints for relay management

**`src/routers/streaming.ts`** (updates):

```typescript
// src/routers/streaming.ts

import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { StreamingService } from "../services/StreamingService";
import { getChannelById } from "../repositories/channelRepository";

const streamingService = new StreamingService();

export const streamingRouter = router({
  // ... existing endpoints ...

  /**
   * Start RTMP relay for a channel
   */
  startRelay: publicProcedure
    .input(
      z.object({
        channelId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { channelId } = input;

      const channel = await getChannelById(channelId);
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      if (!channel.rtmp_url) {
        throw new Error(
          `Channel ${channelId} does not have RTMP URL configured`,
        );
      }

      await streamingService.startRTMPRelay(channel);

      return {
        success: true,
        message: `RTMP relay started for channel ${channelId}`,
      };
    }),

  /**
   * Stop RTMP relay for a channel
   */
  stopRelay: publicProcedure
    .input(
      z.object({
        channelId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { channelId } = input;

      await streamingService.stopRTMPRelay(channelId);

      return {
        success: true,
        message: `RTMP relay stopped for channel ${channelId}`,
      };
    }),

  /**
   * Get relay statistics
   */
  getRelayStats: publicProcedure.query(async () => {
    const stats = await streamingService.getRelayStats();
    return stats;
  }),
});
```

**Acceptance Criteria**:

- [x] `/streaming.startRelay` endpoint works
- [x] `/streaming.stopRelay` endpoint works
- [x] `/streaming.getRelayStats` returns queue stats
- [x] Proper error handling

---

### Task 2.6: Environment Variables (15min)

**Goal**: Add required environment variables for Agora RTC

**`.env.example`** (add):

```bash
# Agora RTC Configuration
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# Redis URL (for FFmpeg job queue)
REDIS_URL=redis://localhost:6379
```

**Render Environment Variables** (add to render.yaml or dashboard):

```yaml
envVars:
  - key: AGORA_APP_ID
    sync: false
  - key: AGORA_APP_CERTIFICATE
    sync: false
  - key: REDIS_URL
    value: ${UPSTASH_REDIS_URL} # From Upstash integration
```

**Acceptance Criteria**:

- [x] Environment variables documented
- [x] Validated on startup
- [x] Render deployment updated

---

### Task 2.7: Testing the Integration (1h)

**Goal**: Test backend → Redis → FFmpeg worker flow

**Test Script** (`scripts/test-rtc-relay.ts`):

```typescript
// scripts/test-rtc-relay.ts

import { StreamingService } from "../src/services/StreamingService";

async function testRTCRelay() {
  console.log("🧪 Testing RTC → Redis → FFmpeg relay...\n");

  const streamingService = new StreamingService();

  // Mock channel
  const mockChannel = {
    id: 1,
    name: "test-channel-123",
    rtmp_url: "rtmp://live.cloudflare.com/live/YOUR_STREAM_KEY",
    user_id: 1,
    status: "live" as const,
    created_at: new Date(),
  };

  try {
    // Start relay
    console.log("1️⃣  Starting RTMP relay...");
    await streamingService.startRTMPRelay(mockChannel);
    console.log("✅ Relay started\n");

    // Wait 5 seconds
    console.log("2️⃣  Waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Get stats
    console.log("3️⃣  Getting relay stats...");
    const stats = await streamingService.getRelayStats();
    console.log("Stats:", JSON.stringify(stats, null, 2));
    console.log("✅ Stats retrieved\n");

    // Stop relay
    console.log("4️⃣  Stopping RTMP relay...");
    await streamingService.stopRTMPRelay(mockChannel.id);
    console.log("✅ Relay stopped\n");

    // Cleanup
    await streamingService.destroy();

    console.log("✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testRTCRelay();
```

**Run test**:

```bash
# Make sure Redis is running
docker compose up -d redis

# Run test
npx tsx scripts/test-rtc-relay.ts
```

**Acceptance Criteria**:

- [x] Job enqueued to Redis successfully
- [x] Stats show 1 waiting job
- [x] No errors during start/stop
- [x] Graceful cleanup

---

## ✅ Phase 2 Completion Checklist

- [ ] Agora RTC SDK installed
- [ ] RTCToRTMPBridge service created and tested
- [ ] StreamJobQueue service created and tested
- [ ] StreamingService updated with queue integration
- [ ] tRPC router updated with relay endpoints
- [ ] Environment variables configured
- [ ] Integration test passes
- [ ] Code reviewed and committed

---

## 📊 Estimated vs Actual Time

| Task      | Estimated | Actual | Notes |
| --------- | --------- | ------ | ----- |
| 2.1       | 30min     |        |       |
| 2.2       | 2-3h      |        |       |
| 2.3       | 1h        |        |       |
| 2.4       | 1-2h      |        |       |
| 2.5       | 30min     |        |       |
| 2.6       | 15min     |        |       |
| 2.7       | 1h        |        |       |
| **Total** | **4-6h**  |        |       |

---

## 🔍 Key Integration Points

### Backend → Redis Flow

```
1. User starts stream (frontend → backend)
2. Backend calls streamingService.startRTMPRelay()
3. StreamingService generates RTC token
4. StreamJobQueue enqueues job to Redis
5. Job data includes: channelId, rtmpUrl, agoraToken, streamConfig
```

### Redis → FFmpeg Worker Flow (Phase 1)

```
1. FFmpeg worker polls Redis queue
2. RedisConsumer receives job
3. FFmpegManager spawns FFmpeg process
4. FFmpeg process waits for RTC frames on stdin
```

### RTC → FFmpeg Flow (Phase 3)

```
1. RTCToRTMPBridge connects to Agora RTC
2. Subscribes to video/audio streams
3. Receives raw frames
4. Pipes frames to FFmpeg stdin
5. FFmpeg encodes and pushes to RTMP
```

---

## 🔄 Next Phase

After completing Phase 2, proceed to **Phase 3: Local Docker Testing** to validate the entire pipeline end-to-end with Docker Compose.

**Phase 3 Preview**:

- Update docker-compose.yml with ffmpeg-worker service
- Test single stream: RTC → Redis → FFmpeg → RTMP
- Test 5 concurrent streams
- Verify resource usage and stability
