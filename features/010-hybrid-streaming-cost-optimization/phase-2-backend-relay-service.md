# Phase 2: Backend Relay Service (Agora → RTMP)

## Objective

Build the core relay service that connects to Agora as a viewer, captures the seller's audio/video stream, encodes it using FFmpeg, and pushes it to the RTMP endpoint.

## User-Facing Changes

None directly visible to users. This is backend infrastructure.

**Internal Impact**:

- New relay service process running alongside main backend
- Channels can now generate HLS streams automatically when sellers go live

---

## Files to Update

### New Files

#### Backend Services

- `src/services/relayService.ts` - Core relay management
- `src/services/ffmpegManager.ts` - FFmpeg process lifecycle
- `src/services/agoraRelayClient.ts` - Agora viewer connection
- `src/utils/rtmpHelpers.ts` - RTMP URL generation, validation

#### Configuration

- `src/config/relay.ts` - Relay service configuration
- `.env` - Add relay-related environment variables

#### Types

- `src/types/relay.ts` - Relay status, metrics, configuration types

### Modified Files

#### tRPC Routes

- `src/routers/channelRouter.ts` - Add relay start/stop calls
- `src/routers/relayRouter.ts` (new) - Dedicated relay endpoints

#### Existing Services

- `src/services/channelService.ts` - Integrate relay lifecycle with channels

#### Database

- `migrations/020_add_relay_fields.ts` - Add relay metadata to channels table

---

## Steps

### 1. Setup FFmpeg Integration

#### A. Install FFmpeg Binary

```bash
# macOS
brew install ffmpeg

# Linux (production server)
apt-get install ffmpeg

# Verify installation
ffmpeg -version
```

#### B. Create FFmpeg Manager Service

**File**: `src/services/ffmpegManager.ts`

```typescript
import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";

interface FFmpegConfig {
  inputUrl?: string; // Optional: RTMP input
  outputUrl: string; // RTMP output endpoint
  resolution: "1080p" | "720p" | "480p";
  bitrate: string; // e.g., '3000k'
  framerate: number; // e.g., 30
  audioSampleRate: number; // e.g., 48000
}

export class FFmpegManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private config: FFmpegConfig;

  constructor(config: FFmpegConfig) {
    super();
    this.config = config;
  }

  /**
   * Start FFmpeg process with piped input (stdin)
   * For receiving raw A/V data from Agora
   */
  async startWithPipedInput(): Promise<void> {
    const args = this.buildFFmpegArgs();

    this.process = spawn("ffmpeg", args, {
      stdio: ["pipe", "pipe", "pipe"], // stdin, stdout, stderr
    });

    this.setupEventHandlers();

    this.emit("started");
  }

  /**
   * Start FFmpeg with RTMP input URL
   * Alternative method if we use RTMP intermediary
   */
  async startWithRTMPInput(): Promise<void> {
    if (!this.config.inputUrl) {
      throw new Error("Input URL required for RTMP input mode");
    }

    const args = ["-i", this.config.inputUrl, ...this.buildOutputArgs()];

    this.process = spawn("ffmpeg", args);
    this.setupEventHandlers();
    this.emit("started");
  }

  private buildFFmpegArgs(): string[] {
    const resolution = this.getResolution();

    return [
      // Input from stdin
      "-f",
      "rawvideo",
      "-pixel_format",
      "yuv420p",
      "-video_size",
      resolution,
      "-framerate",
      this.config.framerate.toString(),
      "-i",
      "pipe:0", // Video from stdin

      // Audio input
      "-f",
      "s16le",
      "-ar",
      this.config.audioSampleRate.toString(),
      "-ac",
      "2", // Stereo
      "-i",
      "pipe:3", // Audio from file descriptor 3

      ...this.buildOutputArgs(),
    ];
  }

  private buildOutputArgs(): string[] {
    return [
      // Video encoding
      "-c:v",
      "libx264",
      "-preset",
      "veryfast", // Balance speed/quality
      "-tune",
      "zerolatency", // Low latency
      "-b:v",
      this.config.bitrate,
      "-maxrate",
      this.config.bitrate,
      "-bufsize",
      "6000k",
      "-pix_fmt",
      "yuv420p",
      "-g",
      "60", // GOP size (2 seconds @ 30fps)
      "-keyint_min",
      "60",

      // Audio encoding
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ar",
      "48000",

      // Output
      "-f",
      "flv",
      this.config.outputUrl,
    ];
  }

  private getResolution(): string {
    const resolutions = {
      "1080p": "1920x1080",
      "720p": "1280x720",
      "480p": "854x480",
    };
    return resolutions[this.config.resolution];
  }

  private setupEventHandlers(): void {
    if (!this.process) return;

    this.process.stdout?.on("data", (data) => {
      this.emit("stdout", data.toString());
    });

    this.process.stderr?.on("data", (data) => {
      const log = data.toString();
      this.emit("stderr", log);

      // Parse FFmpeg stats (bitrate, fps, etc.)
      this.parseStats(log);
    });

    this.process.on("error", (error) => {
      this.emit("error", error);
    });

    this.process.on("exit", (code, signal) => {
      this.emit("exit", { code, signal });
      this.process = null;
    });
  }

  private parseStats(log: string): void {
    // Extract useful stats from FFmpeg output
    // Example: "frame= 1234 fps= 30 q=28.0 size= 1024kB time=00:00:41.13 bitrate=2048kbits/s speed=1.0x"
    const bitrateMatch = log.match(/bitrate=\s*(\d+\.?\d*)kbits\/s/);
    const fpsMatch = log.match(/fps=\s*(\d+\.?\d*)/);

    if (bitrateMatch || fpsMatch) {
      this.emit("stats", {
        bitrate: bitrateMatch ? parseInt(bitrateMatch[1]) : null,
        fps: fpsMatch ? parseFloat(fpsMatch[1]) : null,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Write video frame data to FFmpeg stdin
   */
  writeVideoFrame(data: Buffer): boolean {
    if (!this.process?.stdin) return false;
    return this.process.stdin.write(data);
  }

  /**
   * Write audio data to FFmpeg
   */
  writeAudioData(data: Buffer): boolean {
    // TODO: Handle audio stream (file descriptor 3)
    return true;
  }

  /**
   * Stop FFmpeg process gracefully
   */
  async stop(): Promise<void> {
    if (!this.process) return;

    return new Promise((resolve) => {
      this.process!.once("exit", () => {
        resolve();
      });

      // Send 'q' to FFmpeg for graceful shutdown
      this.process!.stdin?.write("q");

      // Force kill after 5 seconds if not stopped
      setTimeout(() => {
        if (this.process) {
          this.process.kill("SIGKILL");
        }
      }, 5000);
    });
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}
```

---

### 2. Create Agora Relay Client

#### File: `src/services/agoraRelayClient.ts`

```typescript
import AgoraRTC, {
  IAgoraRTCClient,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import { EventEmitter } from "events";
import { generateAgoraToken } from "../utils/agoraToken";

interface RelayClientConfig {
  appId: string;
  channelName: string;
  uid: number; // Unique ID for relay bot (e.g., 999999)
  sellerUid: number; // UID of seller to subscribe to
}

export class AgoraRelayClient extends EventEmitter {
  private client: IAgoraRTCClient | null = null;
  private config: RelayClientConfig;
  private videoTrack: IRemoteVideoTrack | null = null;
  private audioTrack: IRemoteAudioTrack | null = null;

  constructor(config: RelayClientConfig) {
    super();
    this.config = config;
  }

  /**
   * Join Agora channel as viewer
   */
  async connect(): Promise<void> {
    // Create Agora client (live mode, VP8 codec)
    this.client = AgoraRTC.createClient({
      mode: "live",
      codec: "vp8",
      role: "audience", // Join as viewer
    });

    this.setupEventHandlers();

    // Generate token for relay bot
    const token = await generateAgoraToken(
      this.config.channelName,
      this.config.uid,
    );

    // Join channel
    await this.client.join(
      this.config.appId,
      this.config.channelName,
      token,
      this.config.uid,
    );

    console.log(
      `[RelayClient] Joined channel ${this.config.channelName} as UID ${this.config.uid}`,
    );
    this.emit("connected");
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    // Seller publishes video/audio
    this.client.on("user-published", async (user, mediaType) => {
      console.log(`[RelayClient] User ${user.uid} published ${mediaType}`);

      // Only subscribe to the seller
      if (user.uid !== this.config.sellerUid) {
        return;
      }

      // Subscribe to seller's stream
      await this.client!.subscribe(user, mediaType);
      console.log(
        `[RelayClient] Subscribed to ${mediaType} from seller ${user.uid}`,
      );

      if (mediaType === "video") {
        this.videoTrack = user.videoTrack!;
        this.emit("video-track-ready", this.videoTrack);
      }

      if (mediaType === "audio") {
        this.audioTrack = user.audioTrack!;
        this.emit("audio-track-ready", this.audioTrack);
      }
    });

    // Seller unpublishes
    this.client.on("user-unpublished", (user, mediaType) => {
      console.log(`[RelayClient] User ${user.uid} unpublished ${mediaType}`);

      if (user.uid === this.config.sellerUid) {
        if (mediaType === "video") {
          this.videoTrack = null;
        }
        if (mediaType === "audio") {
          this.audioTrack = null;
        }
        this.emit("stream-ended");
      }
    });

    // Seller leaves
    this.client.on("user-left", (user) => {
      console.log(`[RelayClient] User ${user.uid} left`);
      if (user.uid === this.config.sellerUid) {
        this.emit("seller-left");
      }
    });

    // Connection state changes
    this.client.on("connection-state-change", (curState, prevState) => {
      console.log(
        `[RelayClient] Connection state: ${prevState} -> ${curState}`,
      );
      this.emit("connection-state", { current: curState, previous: prevState });
    });

    // Network quality
    this.client.on("network-quality", (stats) => {
      this.emit("network-quality", stats);
    });
  }

  /**
   * Get raw video frames from Agora track
   * This is a placeholder - actual implementation needs MediaStreamTrack API
   */
  getVideoFrames(): MediaStream | null {
    if (!this.videoTrack) return null;

    // Get MediaStreamTrack from Agora video track
    const mediaStreamTrack = this.videoTrack.getMediaStreamTrack();
    const mediaStream = new MediaStream([mediaStreamTrack]);

    return mediaStream;
  }

  /**
   * Get raw audio from Agora track
   */
  getAudioStream(): MediaStream | null {
    if (!this.audioTrack) return null;

    const mediaStreamTrack = this.audioTrack.getMediaStreamTrack();
    const mediaStream = new MediaStream([mediaStreamTrack]);

    return mediaStream;
  }

  /**
   * Disconnect from Agora
   */
  async disconnect(): Promise<void> {
    if (!this.client) return;

    await this.client.leave();
    this.client = null;
    this.videoTrack = null;
    this.audioTrack = null;

    console.log("[RelayClient] Disconnected from Agora");
    this.emit("disconnected");
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}
```

---

### 3. Build Main Relay Service

#### File: `src/services/relayService.ts`

```typescript
import { EventEmitter } from "events";
import { AgoraRelayClient } from "./agoraRelayClient";
import { FFmpegManager } from "./ffmpegManager";
import { StreamingPlatformService } from "./streamingPlatformService";
import { db } from "../db";

interface RelayInstance {
  channelId: number;
  agoraClient: AgoraRelayClient;
  ffmpegManager: FFmpegManager;
  streamKey: string;
  playbackUrl: string;
  status: "starting" | "active" | "stopping" | "error";
  startedAt: Date;
  metrics: {
    bitrate: number;
    fps: number;
    viewerCount: number;
  };
}

export class RelayService extends EventEmitter {
  private static instance: RelayService;
  private activeRelays: Map<number, RelayInstance> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): RelayService {
    if (!RelayService.instance) {
      RelayService.instance = new RelayService();
    }
    return RelayService.instance;
  }

  /**
   * Start relay for a channel
   */
  async startRelay(
    channelId: number,
    sellerUid: number,
  ): Promise<{ playbackUrl: string; streamKey: string }> {
    // Check if relay already running
    if (this.activeRelays.has(channelId)) {
      const relay = this.activeRelays.get(channelId)!;
      return {
        playbackUrl: relay.playbackUrl,
        streamKey: relay.streamKey,
      };
    }

    console.log(`[RelayService] Starting relay for channel ${channelId}`);

    // 1. Create live stream on streaming platform
    const streamingService = new StreamingPlatformService();
    const streamData = await streamingService.createLiveStream(channelId);

    // 2. Initialize Agora client
    const agoraClient = new AgoraRelayClient({
      appId: process.env.AGORA_APP_ID!,
      channelName: `channel_${channelId}`,
      uid: 999999, // Fixed UID for relay bot
      sellerUid,
    });

    // 3. Initialize FFmpeg
    const ffmpegManager = new FFmpegManager({
      outputUrl: streamData.rtmpPushUrl,
      resolution: "720p",
      bitrate: "3000k",
      framerate: 30,
      audioSampleRate: 48000,
    });

    // 4. Connect Agora client
    await agoraClient.connect();

    // 5. Wait for seller's stream
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for seller stream"));
      }, 30000); // 30 second timeout

      agoraClient.once("video-track-ready", () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    // 6. Start FFmpeg (this part is tricky - needs MediaStream → FFmpeg piping)
    // For now, placeholder - Phase 3 will implement full A/V capture
    await ffmpegManager.startWithPipedInput();

    // 7. Wire up audio/video streaming
    this.setupMediaPipeline(agoraClient, ffmpegManager);

    // 8. Create relay instance
    const relay: RelayInstance = {
      channelId,
      agoraClient,
      ffmpegManager,
      streamKey: streamData.streamKey,
      playbackUrl: streamData.playbackUrl,
      status: "active",
      startedAt: new Date(),
      metrics: {
        bitrate: 0,
        fps: 0,
        viewerCount: 0,
      },
    };

    this.activeRelays.set(channelId, relay);

    // 9. Setup event handlers
    this.setupRelayEventHandlers(relay);

    // 10. Update database
    await db
      .updateTable("channels")
      .set({
        relay_status: "active",
        hls_playback_url: streamData.playbackUrl,
        stream_mode: "hybrid",
        relay_started_at: new Date(),
      })
      .where("id", "=", channelId)
      .execute();

    console.log(`[RelayService] Relay started for channel ${channelId}`);
    this.emit("relay-started", { channelId });

    return {
      playbackUrl: streamData.playbackUrl,
      streamKey: streamData.streamKey,
    };
  }

  /**
   * Setup media pipeline (Agora → FFmpeg)
   * NOTE: This is a simplified placeholder
   * Actual implementation requires canvas + MediaRecorder or WebRTC capture
   */
  private setupMediaPipeline(
    agoraClient: AgoraRelayClient,
    ffmpegManager: FFmpegManager,
  ): void {
    // TODO: Implement actual video/audio frame capture
    // This requires:
    // 1. Render Agora video track to Canvas
    // 2. Capture canvas frames @ 30fps
    // 3. Pipe raw frames to FFmpeg stdin
    // 4. Capture audio samples and pipe to FFmpeg

    console.log("[RelayService] Media pipeline setup (placeholder)");
  }

  /**
   * Setup event handlers for a relay instance
   */
  private setupRelayEventHandlers(relay: RelayInstance): void {
    // FFmpeg stats
    relay.ffmpegManager.on("stats", (stats) => {
      relay.metrics.bitrate = stats.bitrate || 0;
      relay.metrics.fps = stats.fps || 0;
    });

    // FFmpeg errors
    relay.ffmpegManager.on("error", (error) => {
      console.error(
        `[RelayService] FFmpeg error for channel ${relay.channelId}:`,
        error,
      );
      relay.status = "error";
      this.emit("relay-error", { channelId: relay.channelId, error });
    });

    // FFmpeg exit
    relay.ffmpegManager.on("exit", ({ code, signal }) => {
      console.log(
        `[RelayService] FFmpeg exited for channel ${relay.channelId}: code=${code}, signal=${signal}`,
      );
      this.handleRelayExit(relay.channelId);
    });

    // Agora seller left
    relay.agoraClient.on("seller-left", () => {
      console.log(`[RelayService] Seller left channel ${relay.channelId}`);
      this.stopRelay(relay.channelId);
    });

    // Agora connection issues
    relay.agoraClient.on("connection-state", ({ current }) => {
      if (current === "DISCONNECTED" || current === "FAILED") {
        console.error(
          `[RelayService] Agora connection ${current} for channel ${relay.channelId}`,
        );
        // Attempt reconnection
        this.handleConnectionFailure(relay.channelId);
      }
    });
  }

  /**
   * Stop relay for a channel
   */
  async stopRelay(channelId: number): Promise<void> {
    const relay = this.activeRelays.get(channelId);
    if (!relay) {
      console.log(`[RelayService] No active relay for channel ${channelId}`);
      return;
    }

    console.log(`[RelayService] Stopping relay for channel ${channelId}`);
    relay.status = "stopping";

    // 1. Stop FFmpeg
    await relay.ffmpegManager.stop();

    // 2. Disconnect from Agora
    await relay.agoraClient.disconnect();

    // 3. Cleanup streaming platform
    const streamingService = new StreamingPlatformService();
    await streamingService.endLiveStream(relay.streamKey);

    // 4. Update database
    await db
      .updateTable("channels")
      .set({
        relay_status: "stopped",
        hls_playback_url: null,
      })
      .where("id", "=", channelId)
      .execute();

    // 5. Remove from active relays
    this.activeRelays.delete(channelId);

    console.log(`[RelayService] Relay stopped for channel ${channelId}`);
    this.emit("relay-stopped", { channelId });
  }

  /**
   * Get relay status for a channel
   */
  getRelayStatus(channelId: number): RelayInstance | null {
    return this.activeRelays.get(channelId) || null;
  }

  /**
   * Handle relay exit (restart if needed)
   */
  private async handleRelayExit(channelId: number): Promise<void> {
    const relay = this.activeRelays.get(channelId);
    if (!relay || relay.status === "stopping") {
      return; // Intentional stop, don't restart
    }

    console.warn(
      `[RelayService] Relay exited unexpectedly for channel ${channelId}, attempting restart...`,
    );

    // TODO: Implement auto-restart logic with exponential backoff
    // For now, just mark as error
    relay.status = "error";
    this.emit("relay-crashed", { channelId });
  }

  /**
   * Handle Agora connection failure
   */
  private async handleConnectionFailure(channelId: number): Promise<void> {
    console.warn(`[RelayService] Connection failure for channel ${channelId}`);
    // TODO: Implement reconnection logic
  }

  /**
   * Stop all active relays (for server shutdown)
   */
  async stopAll(): Promise<void> {
    console.log(
      `[RelayService] Stopping all ${this.activeRelays.size} active relays...`,
    );

    const stopPromises = Array.from(this.activeRelays.keys()).map((channelId) =>
      this.stopRelay(channelId),
    );

    await Promise.all(stopPromises);
    console.log("[RelayService] All relays stopped");
  }
}
```

---

### 4. Create Database Migration

#### File: `migrations/020_add_relay_fields.ts`

```typescript
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("channels")
    .addColumn("stream_mode", "varchar(20)", (col) =>
      col.defaultTo("agora-only"),
    )
    .addColumn("hls_playback_url", "varchar(500)")
    .addColumn("relay_status", "varchar(20)")
    .addColumn("relay_started_at", "timestamp")
    .addColumn("streaming_platform", "varchar(50)") // 'cloudflare', 'aws-ivs', etc.
    .addColumn("stream_key_id", "varchar(100)")
    .execute();

  // Create stream_metrics table
  await db.schema
    .createTable("stream_metrics")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("channel_id", "integer", (col) =>
      col.references("channels.id").onDelete("cascade").notNull(),
    )
    .addColumn("timestamp", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn("agora_viewers", "integer", (col) => col.defaultTo(0))
    .addColumn("hls_viewers", "integer", (col) => col.defaultTo(0))
    .addColumn("bitrate_kbps", "integer")
    .addColumn("relay_health", "varchar(20)") // 'good', 'fair', 'poor'
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Create index for faster queries
  await db.schema
    .createIndex("stream_metrics_channel_id_timestamp_idx")
    .on("stream_metrics")
    .columns(["channel_id", "timestamp"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("stream_metrics").execute();

  await db.schema
    .alterTable("channels")
    .dropColumn("stream_mode")
    .dropColumn("hls_playback_url")
    .dropColumn("relay_status")
    .dropColumn("relay_started_at")
    .dropColumn("streaming_platform")
    .dropColumn("stream_key_id")
    .execute();
}
```

---

### 5. Create tRPC Relay Router

#### File: `src/routers/relayRouter.ts`

```typescript
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { RelayService } from "../services/relayService";

const relayService = RelayService.getInstance();

export const relayRouter = router({
  /**
   * Start relay for a channel
   */
  start: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        sellerUid: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { playbackUrl, streamKey } = await relayService.startRelay(
        input.channelId,
        input.sellerUid,
      );

      return {
        success: true,
        playbackUrl,
        streamKey,
      };
    }),

  /**
   * Stop relay for a channel
   */
  stop: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      await relayService.stopRelay(input.channelId);

      return {
        success: true,
      };
    }),

  /**
   * Get relay status
   */
  status: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
      }),
    )
    .query(({ input }) => {
      const relay = relayService.getRelayStatus(input.channelId);

      if (!relay) {
        return {
          isActive: false,
          viewerCount: 0,
          bitrate: 0,
          health: "unknown" as const,
        };
      }

      return {
        isActive: relay.status === "active",
        viewerCount: relay.metrics.viewerCount,
        bitrate: relay.metrics.bitrate,
        fps: relay.metrics.fps,
        health: relay.status === "active" ? "good" : ("poor" as const),
        startedAt: relay.startedAt,
      };
    }),
});
```

---

### 6. Update Main Router

#### File: `src/trpc.ts`

```typescript
// Add relay router to main router
import { relayRouter } from "./routers/relayRouter";

export const appRouter = router({
  // ... existing routers
  relay: relayRouter,
});
```

---

### 7. Add Environment Variables

#### File: `.env`

```bash
# Relay Service Configuration
RELAY_ENABLED=true
RELAY_DEFAULT_RESOLUTION=720p
RELAY_DEFAULT_BITRATE=3000k
RELAY_MAX_CONCURRENT_STREAMS=10

# FFmpeg Path (optional, defaults to system FFmpeg)
FFMPEG_PATH=/usr/local/bin/ffmpeg

# Streaming Platform (choose one)
STREAMING_PLATFORM=cloudflare  # or 'aws-ivs'

# Cloudflare Stream (if using)
CLOUDFLARE_STREAM_ACCOUNT_ID=your_account_id
CLOUDFLARE_STREAM_API_TOKEN=your_api_token

# AWS IVS (if using)
AWS_IVS_REGION=us-west-2
AWS_IVS_ACCESS_KEY_ID=your_access_key
AWS_IVS_SECRET_ACCESS_KEY=your_secret_key
```

---

## Design Considerations

### 1. Media Capture Challenge

The hardest part is capturing raw A/V from Agora's WebRTC stream and piping it to FFmpeg.

**Approaches**:

**Option A: Canvas + MediaRecorder (Browser-based)**

- Render Agora video to Canvas element
- Capture canvas frames @ 30fps
- Use MediaRecorder API to encode
- **Problem**: Requires browser environment, not Node.js

**Option B: node-webrtc + wrtc**

- Use `node-webrtc` library to handle WebRTC in Node.js
- Receive Agora stream as RTCPeerConnection
- Extract MediaStreamTracks
- Pipe to FFmpeg
- **Problem**: Complex setup, requires native bindings

**Option C: Agora Cloud Recording → RTMP**

- Use Agora's Cloud Recording service
- Configure it to output RTMP directly
- **Pro**: Offloads processing to Agora
- **Con**: Additional Agora cost, latency

**Recommended for MVP**: Option C (Agora Cloud Recording) for simplicity
**Future optimization**: Option B for cost savings

### 2. Error Handling & Resilience

- **FFmpeg crashes**: Auto-restart with exponential backoff
- **Agora disconnects**: Attempt reconnection 3 times before giving up
- **RTMP push fails**: Retry with different RTMP endpoint (if multi-platform)
- **Graceful degradation**: If relay fails, fall back to Agora-only mode for buyers

### 3. Resource Management

- **CPU usage**: FFmpeg encoding is CPU-intensive (~30-50% per stream)
- **Memory**: Monitor for memory leaks in long-running streams
- **Concurrency**: Limit concurrent streams based on server capacity
- **Auto-scaling**: Consider horizontal scaling for >10 concurrent streams

---

## Acceptance Criteria

- [ ] FFmpegManager can start/stop FFmpeg process
- [ ] FFmpegManager parses stats (bitrate, fps) from FFmpeg output
- [ ] AgoraRelayClient can join channel as viewer
- [ ] AgoraRelayClient can subscribe to seller's video/audio
- [ ] RelayService can start relay (end-to-end)
- [ ] RelayService can stop relay and cleanup resources
- [ ] Database migration adds relay fields to channels table
- [ ] tRPC relay router exposes start/stop/status endpoints
- [ ] Environment variables configured
- [ ] Error handling implemented (FFmpeg crash, Agora disconnect)
- [ ] Logs provide useful debugging information

---

## Testing Checklist

### Unit Tests

- [ ] FFmpegManager.startWithPipedInput() spawns FFmpeg process
- [ ] FFmpegManager.buildFFmpegArgs() returns correct arguments
- [ ] FFmpegManager.stop() kills process gracefully
- [ ] AgoraRelayClient.connect() joins channel successfully
- [ ] AgoraRelayClient handles 'user-published' event
- [ ] RelayService.startRelay() creates relay instance
- [ ] RelayService.stopRelay() cleans up resources

### Integration Tests

- [ ] Start relay → FFmpeg process running → RTMP connection established
- [ ] Stop relay → FFmpeg stopped → Agora disconnected → Database updated
- [ ] Relay auto-restarts on FFmpeg crash
- [ ] Multiple concurrent relays work without interference

### Manual Testing

- [ ] Create test channel with seller streaming
- [ ] Call `relay.start` API
- [ ] Verify FFmpeg process in `ps aux | grep ffmpeg`
- [ ] Verify RTMP stream received by streaming platform
- [ ] Check database: `relay_status = 'active'`
- [ ] Call `relay.stop` API
- [ ] Verify cleanup (no zombie processes)

---

## Status

📝 PLANNING

## Notes

### Known Limitations (MVP)

1. **Media pipeline not fully implemented**: Agora → FFmpeg piping is placeholder
2. **Single relay server**: No horizontal scaling yet
3. **No auto-restart**: Crashes require manual intervention
4. **Basic error handling**: No sophisticated retry logic

### Phase 3 Prerequisites

- Streaming platform service (Cloudflare or AWS IVS) must be implemented
- Decide on media capture approach (Cloud Recording vs node-webrtc)
- Test FFmpeg encoding settings for optimal quality/performance

### Open Questions

1. Use Agora Cloud Recording or implement custom WebRTC capture?
2. How to handle relay server scaling (vertical vs horizontal)?
3. Should we support multiple streaming platforms simultaneously?
4. What's the max concurrent streams per relay server?
