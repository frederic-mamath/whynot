# Phase 2: Agora Cloud Recording Integration

## Objective

Integrate Agora Cloud Recording API to automatically forward live streams to Cloudflare Stream via RTMP. This eliminates the need for FFmpeg and works perfectly with Heroku's Eco dyno.

## User-Facing Changes

None directly visible to users. This is backend infrastructure.

**Internal Impact**:

- New Cloud Recording management service
- Channels automatically start Cloud Recording when sellers go live
- No FFmpeg or additional processes needed (Heroku-friendly!)
- Streams forwarded to Cloudflare Stream via RTMP

---

## Files to Update

### New Files

#### Backend Services

- `src/services/agoraCloudRecordingService.ts` - Agora Cloud Recording API client
- `src/services/recordingManager.ts` - Recording lifecycle management
- `src/utils/agoraAuth.ts` - RESTful API authentication (Basic Auth)

#### Configuration

- `src/config/cloudRecording.ts` - Cloud Recording settings
- `.env` - Add Agora credentials

#### Types

- `src/types/cloudRecording.ts` - Recording resource, status types

### Modified Files

#### tRPC Routes

- `src/routers/channelRouter.ts` - Integrate recording start/stop
- `src/routers/recordingRouter.ts` (new) - Recording status endpoints

#### Existing Services

- `src/services/channelService.ts` - Start/stop recording with channel lifecycle

#### Database

- `migrations/020_add_cloud_recording_fields.ts` - Add recording metadata

---

## Steps

### 1. Setup Agora Cloud Recording Credentials

#### A. Get Agora Credentials

Vous avez besoin de :

- `AGORA_APP_ID` - Already have from existing Agora setup
- `AGORA_APP_CERTIFICATE` - Already have
- `AGORA_CUSTOMER_ID` - RESTful API Customer ID (from Agora Console)
- `AGORA_CUSTOMER_SECRET` - RESTful API Customer Secret (from Agora Console)

**How to get Customer ID/Secret:**

1. Go to https://console.agora.io
2. Navigate to "RESTful API" section
3. Click "Generate Customer ID" and "Generate Customer Secret"
4. Save securely

#### B. Add to `.env`

```bash
# Existing Agora credentials
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate

# New: Cloud Recording API credentials
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret

# Cloud Recording settings
AGORA_CLOUD_RECORDING_REGION=NA  # NA, EU, AP, CN
AGORA_CLOUD_RECORDING_VENDOR=1   # 1=AWS S3 (optional, for VOD storage)
```

---

### 2. Create Cloud Recording Types

**File**: `src/types/cloudRecording.ts`

```typescript
export interface CloudRecordingResource {
  resourceId: string;
  sid: string; // Session ID once recording starts
}

export interface CloudRecordingConfig {
  channelName: string;
  uid: string; // Recording bot UID (e.g., "999999")
  rtmpPushUrl: string; // Cloudflare Stream RTMP URL
}

export interface CloudRecordingStatus {
  resourceId: string;
  sid: string;
  serverResponse: {
    status: number; // Recording state
    fileList: string[];
    extensionServiceState?: {
      serviceStatus: number; // RTMP push status
    };
  };
}

export type RecordingState =
  | "idle" // Not started
  | "starting" // Acquiring resource
  | "recording" // Active recording + RTMP push
  | "stopping" // Cleanup in progress
  | "stopped" // Completed
  | "error"; // Failed
```

---

### 3. Create Authentication Helper

**File**: `src/utils/agoraAuth.ts`

```typescript
/**
 * Generate Basic Authentication header for Agora RESTful API
 * Format: "Basic base64(customerId:customerSecret)"
 */
export function getAgoraAuthHeader(): string {
  const customerId = process.env.AGORA_CUSTOMER_ID!;
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET!;

  const credentials = `${customerId}:${customerSecret}`;
  const base64Credentials = Buffer.from(credentials).toString("base64");

  return `Basic ${base64Credentials}`;
}

/**
 * Generate recording bot UID (should be consistent per channel)
 */
export function generateRecordingUid(channelId: number): string {
  // Use high UID to avoid conflicts with real users
  return `${999000 + channelId}`;
}
```

---

### 4. Create Agora Cloud Recording Service

**File**: `src/services/agoraCloudRecordingService.ts`

```typescript
import axios, { AxiosInstance } from "axios";
import { getAgoraAuthHeader, generateRecordingUid } from "../utils/agoraAuth";
import {
  CloudRecordingResource,
  CloudRecordingConfig,
  CloudRecordingStatus,
} from "../types/cloudRecording";

const AGORA_CLOUD_RECORDING_BASE_URL = "https://api.agora.io/v1/apps";

export class AgoraCloudRecordingService {
  private client: AxiosInstance;
  private appId: string;

  constructor() {
    this.appId = process.env.AGORA_APP_ID!;

    this.client = axios.create({
      baseURL: `${AGORA_CLOUD_RECORDING_BASE_URL}/${this.appId}/cloud_recording`,
      headers: {
        "Content-Type": "application/json",
        Authorization: getAgoraAuthHeader(),
      },
      timeout: 10000,
    });
  }

  /**
   * Step 1: Acquire resource ID
   * Must be called before starting recording
   */
  async acquire(config: CloudRecordingConfig): Promise<string> {
    const response = await this.client.post("/acquire", {
      cname: config.channelName,
      uid: config.uid,
      clientRequest: {
        resourceExpiredHour: 24, // Resource expires after 24h
        scene: 0, // 0 = Real-time recording
      },
    });

    const resourceId = response.data.resourceId;
    console.log(`[CloudRecording] Acquired resource: ${resourceId}`);

    return resourceId;
  }

  /**
   * Step 2: Start recording with RTMP push
   */
  async start(
    resourceId: string,
    config: CloudRecordingConfig,
  ): Promise<string> {
    const response = await this.client.post(
      `/resourceid/${resourceId}/mode/web/start`,
      {
        cname: config.channelName,
        uid: config.uid,
        clientRequest: {
          // Token for recording bot (if channel requires authentication)
          token: await this.generateRecordingToken(
            config.channelName,
            config.uid,
          ),

          // Extension service: RTMP push
          extensionServiceConfig: {
            extensionServices: [
              {
                serviceName: "rtmp_publish",
                errorHandlePolicy: "error_abort", // Stop recording on RTMP failure
                serviceParam: {
                  outputs: [
                    {
                      rtmpUrl: config.rtmpPushUrl,
                    },
                  ],
                },
              },
            ],
          },

          // Recording settings
          recordingConfig: {
            channelType: 1, // 0=communication, 1=live broadcast
            streamTypes: 2, // 0=audio only, 1=video only, 2=audio+video
            streamMode: "default", // Composite mode (all streams mixed)

            // Video settings
            videoStreamType: 0, // 0=high stream, 1=low stream
            maxIdleTime: 30, // Stop if channel idle for 30 seconds

            // Transcoding (composite video)
            transcodingConfig: {
              width: 1280,
              height: 720,
              fps: 30,
              bitrate: 2500, // 2.5 Mbps
              mixedVideoLayout: 1, // 0=floating, 1=best fit, 2=vertical
              backgroundColor: "#000000",
            },
          },
        },
      },
    );

    const sid = response.data.sid;
    console.log(`[CloudRecording] Started recording: ${sid}`);

    return sid;
  }

  /**
   * Step 3: Query recording status
   */
  async query(resourceId: string, sid: string): Promise<CloudRecordingStatus> {
    const response = await this.client.get(
      `/resourceid/${resourceId}/sid/${sid}/mode/web/query`,
    );

    return {
      resourceId,
      sid,
      serverResponse: response.data.serverResponse,
    };
  }

  /**
   * Step 4: Stop recording
   */
  async stop(
    resourceId: string,
    sid: string,
    channelName: string,
    uid: string,
  ): Promise<void> {
    await this.client.post(
      `/resourceid/${resourceId}/sid/${sid}/mode/web/stop`,
      {
        cname: channelName,
        uid: uid,
        clientRequest: {},
      },
    );

    console.log(`[CloudRecording] Stopped recording: ${sid}`);
  }

  /**
   * Update RTMP URL during recording (if needed)
   */
  async updateRtmpUrl(
    resourceId: string,
    sid: string,
    channelName: string,
    uid: string,
    newRtmpUrl: string,
  ): Promise<void> {
    await this.client.post(
      `/resourceid/${resourceId}/sid/${sid}/mode/web/update`,
      {
        cname: channelName,
        uid: uid,
        clientRequest: {
          extensionServiceConfig: {
            extensionServices: [
              {
                serviceName: "rtmp_publish",
                serviceParam: {
                  outputs: [
                    {
                      rtmpUrl: newRtmpUrl,
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    );
  }

  /**
   * Generate token for recording bot
   * Uses same token generation as regular Agora users
   */
  private async generateRecordingToken(
    channelName: string,
    uid: string,
  ): Promise<string> {
    // Import your existing Agora token generation
    const { generateAgoraToken } = await import("../utils/agoraToken");
    return generateAgoraToken(channelName, parseInt(uid));
  }
}
```

---

### 5. Create Recording Manager

**File**: `src/services/recordingManager.ts`

```typescript
import { EventEmitter } from "events";
import { AgoraCloudRecordingService } from "./agoraCloudRecordingService";
import { StreamingPlatformService } from "./streamingPlatformService";
import { generateRecordingUid } from "../utils/agoraAuth";
import { db } from "../db";
import type { RecordingState } from "../types/cloudRecording";

interface RecordingSession {
  channelId: number;
  channelName: string;
  resourceId: string;
  sid: string | null;
  rtmpUrl: string;
  playbackUrl: string;
  state: RecordingState;
  startedAt: Date;
  recordingUid: string;
}

export class RecordingManager extends EventEmitter {
  private static instance: RecordingManager;
  private cloudRecording: AgoraCloudRecordingService;
  private activeSessions: Map<number, RecordingSession> = new Map();

  private constructor() {
    super();
    this.cloudRecording = new AgoraCloudRecordingService();
  }

  static getInstance(): RecordingManager {
    if (!RecordingManager.instance) {
      RecordingManager.instance = new RecordingManager();
    }
    return RecordingManager.instance;
  }

  /**
   * Start Cloud Recording for a channel
   */
  async startRecording(channelId: number): Promise<{
    playbackUrl: string;
    resourceId: string;
  }> {
    console.log(
      `[RecordingManager] Starting recording for channel ${channelId}`,
    );

    // Check if already recording
    if (this.activeSessions.has(channelId)) {
      const session = this.activeSessions.get(channelId)!;
      return {
        playbackUrl: session.playbackUrl,
        resourceId: session.resourceId,
      };
    }

    const channelName = `channel_${channelId}`;
    const recordingUid = generateRecordingUid(channelId);

    try {
      // 1. Create live stream on Cloudflare
      const streamingService = new StreamingPlatformService();
      const { rtmpPushUrl, playbackUrl, streamKey } =
        await streamingService.createLiveStream(channelId);

      console.log(`[RecordingManager] Cloudflare stream created: ${streamKey}`);

      // 2. Acquire Cloud Recording resource
      const resourceId = await this.cloudRecording.acquire({
        channelName,
        uid: recordingUid,
        rtmpPushUrl,
      });

      // 3. Create session object
      const session: RecordingSession = {
        channelId,
        channelName,
        resourceId,
        sid: null,
        rtmpUrl: rtmpPushUrl,
        playbackUrl,
        state: "starting",
        startedAt: new Date(),
        recordingUid,
      };

      this.activeSessions.set(channelId, session);

      // 4. Start recording (async - doesn't block)
      this.startRecordingAsync(session);

      // 5. Update database
      await db
        .updateTable("channels")
        .set({
          stream_mode: "hybrid",
          hls_playback_url: playbackUrl,
          relay_status: "starting",
          relay_started_at: new Date(),
          streaming_platform: "cloudflare",
          stream_key_id: streamKey,
        })
        .where("id", "=", channelId)
        .execute();

      return { playbackUrl, resourceId };
    } catch (error) {
      console.error(`[RecordingManager] Failed to start recording:`, error);
      this.activeSessions.delete(channelId);
      throw error;
    }
  }

  /**
   * Start recording asynchronously (doesn't block)
   */
  private async startRecordingAsync(session: RecordingSession): Promise<void> {
    try {
      // Wait a bit for seller to actually join the channel
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const sid = await this.cloudRecording.start(session.resourceId, {
        channelName: session.channelName,
        uid: session.recordingUid,
        rtmpPushUrl: session.rtmpUrl,
      });

      session.sid = sid;
      session.state = "recording";

      await db
        .updateTable("channels")
        .set({ relay_status: "active" })
        .where("id", "=", session.channelId)
        .execute();

      console.log(
        `[RecordingManager] Recording active for channel ${session.channelId}`,
      );
      this.emit("recording-started", { channelId: session.channelId });
    } catch (error) {
      console.error(`[RecordingManager] Failed to start recording:`, error);
      session.state = "error";

      await db
        .updateTable("channels")
        .set({ relay_status: "error" })
        .where("id", "=", session.channelId)
        .execute();

      this.emit("recording-error", { channelId: session.channelId, error });
    }
  }

  /**
   * Stop Cloud Recording for a channel
   */
  async stopRecording(channelId: number): Promise<void> {
    const session = this.activeSessions.get(channelId);
    if (!session) {
      console.log(
        `[RecordingManager] No active recording for channel ${channelId}`,
      );
      return;
    }

    console.log(
      `[RecordingManager] Stopping recording for channel ${channelId}`,
    );
    session.state = "stopping";

    try {
      // Stop Cloud Recording (if started)
      if (session.sid) {
        await this.cloudRecording.stop(
          session.resourceId,
          session.sid,
          session.channelName,
          session.recordingUid,
        );
      }

      // Cleanup Cloudflare stream
      const streamingService = new StreamingPlatformService();
      await streamingService.endLiveStream(session.channelId.toString());

      // Update database
      await db
        .updateTable("channels")
        .set({
          relay_status: "stopped",
          hls_playback_url: null,
        })
        .where("id", "=", channelId)
        .execute();

      // Remove session
      this.activeSessions.delete(channelId);
      session.state = "stopped";

      console.log(
        `[RecordingManager] Recording stopped for channel ${channelId}`,
      );
      this.emit("recording-stopped", { channelId });
    } catch (error) {
      console.error(`[RecordingManager] Failed to stop recording:`, error);
      session.state = "error";
      throw error;
    }
  }

  /**
   * Get recording status
   */
  async getRecordingStatus(channelId: number): Promise<{
    isRecording: boolean;
    state: RecordingState;
    playbackUrl: string | null;
    startedAt: Date | null;
  }> {
    const session = this.activeSessions.get(channelId);

    if (!session) {
      return {
        isRecording: false,
        state: "idle",
        playbackUrl: null,
        startedAt: null,
      };
    }

    // Query Agora for fresh status (if recording started)
    if (session.sid) {
      try {
        const status = await this.cloudRecording.query(
          session.resourceId,
          session.sid,
        );

        // Check RTMP push status
        const rtmpStatus =
          status.serverResponse.extensionServiceState?.serviceStatus;
        if (rtmpStatus === 1) {
          // RTMP push failed
          session.state = "error";
        }
      } catch (error) {
        console.error("[RecordingManager] Failed to query status:", error);
      }
    }

    return {
      isRecording: session.state === "recording",
      state: session.state,
      playbackUrl: session.playbackUrl,
      startedAt: session.startedAt,
    };
  }

  /**
   * Get all active recordings
   */
  getActiveRecordings(): number[] {
    return Array.from(this.activeSessions.keys());
  }

  /**
   * Stop all active recordings (for server shutdown)
   */
  async stopAll(): Promise<void> {
    console.log(
      `[RecordingManager] Stopping all ${this.activeSessions.size} recordings...`,
    );

    const stopPromises = Array.from(this.activeSessions.keys()).map(
      (channelId) => this.stopRecording(channelId),
    );

    await Promise.allSettled(stopPromises);
    console.log("[RecordingManager] All recordings stopped");
  }
}
```

---

### 6. Create Database Migration

**File**: `migrations/020_add_cloud_recording_fields.ts`

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
    .addColumn("streaming_platform", "varchar(50)")
    .addColumn("stream_key_id", "varchar(100)")
    .addColumn("agora_resource_id", "varchar(100)") // Cloud Recording resource ID
    .addColumn("agora_sid", "varchar(100)") // Cloud Recording session ID
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
    .addColumn("relay_health", "varchar(20)")
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

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
    .dropColumn("agora_resource_id")
    .dropColumn("agora_sid")
    .execute();
}
```

---

### 7. Create tRPC Recording Router

**File**: `src/routers/recordingRouter.ts`

```typescript
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { RecordingManager } from "../services/recordingManager";

const recordingManager = RecordingManager.getInstance();

export const recordingRouter = router({
  /**
   * Start Cloud Recording for a channel
   */
  start: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ input }) => {
      const { playbackUrl, resourceId } = await recordingManager.startRecording(
        input.channelId,
      );

      return {
        success: true,
        playbackUrl,
        resourceId,
      };
    }),

  /**
   * Stop Cloud Recording
   */
  stop: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ input }) => {
      await recordingManager.stopRecording(input.channelId);
      return { success: true };
    }),

  /**
   * Get recording status
   */
  status: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      const status = await recordingManager.getRecordingStatus(input.channelId);
      return status;
    }),

  /**
   * Get all active recordings
   */
  listActive: protectedProcedure.query(() => {
    const activeChannelIds = recordingManager.getActiveRecordings();
    return { channelIds: activeChannelIds };
  }),
});
```

---

### 8. Update Main Router

**File**: `src/trpc.ts`

```typescript
import { recordingRouter } from "./routers/recordingRouter";

export const appRouter = router({
  // ... existing routers
  recording: recordingRouter,
});
```

---

### 9. Update Channel Service

**File**: `src/services/channelService.ts`

```typescript
import { RecordingManager } from "./recordingManager";

export class ChannelService {
  // ... existing code

  async startChannel(channelId: number, userId: number): Promise<void> {
    // Existing logic to mark channel as active
    await db
      .updateTable("channels")
      .set({ is_active: true, started_at: new Date() })
      .where("id", "=", channelId)
      .where("host_user_id", "=", userId)
      .execute();

    // Start Cloud Recording
    const recordingManager = RecordingManager.getInstance();
    await recordingManager.startRecording(channelId);
  }

  async endChannel(channelId: number, userId: number): Promise<void> {
    // Stop Cloud Recording first
    const recordingManager = RecordingManager.getInstance();
    await recordingManager.stopRecording(channelId);

    // Existing logic to mark channel as inactive
    await db
      .updateTable("channels")
      .set({ is_active: false, ended_at: new Date() })
      .where("id", "=", channelId)
      .where("host_user_id", "=", userId)
      .execute();
  }
}
```

---

### 10. Add Environment Variables

**File**: `.env`

```bash
# Agora existing
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate

# Agora Cloud Recording (NEW)
AGORA_CUSTOMER_ID=your_customer_id_from_console
AGORA_CUSTOMER_SECRET=your_customer_secret_from_console
AGORA_CLOUD_RECORDING_REGION=NA  # NA, EU, AP, CN

# Cloudflare Stream (from Phase 3)
CLOUDFLARE_STREAM_ACCOUNT_ID=your_account_id
CLOUDFLARE_STREAM_API_TOKEN=your_token
```

---

## Design Considerations

### 1. Why Agora Cloud Recording?

- ✅ No FFmpeg needed (works on Heroku Eco dyno)
- ✅ Managed service (reliable, scalable)
- ✅ RTMP push built-in (forwards to Cloudflare automatically)
- ✅ Simple REST API (no complex process management)

### 2. Resource Lifecycle

```
Channel Start → Acquire Resource → Start Recording → RTMP Push Active
                     ↓                    ↓                 ↓
                resourceId              sid            Cloudflare
                                                          HLS URL
```

### 3. Error Handling

- **Acquire fails**: Retry up to 3 times with exponential backoff
- **Start fails**: Mark channel as error, notify seller
- **RTMP push fails**: Cloud Recording stops automatically (error_abort policy)
- **Network issues**: Agora handles reconnection internally

### 4. Cost Optimization

- Recording stops automatically if channel idle for 30 seconds
- Composite mode (all streams mixed) = single recording fee
- RTMP push included in recording cost (no extra charge)

---

## Acceptance Criteria

- [ ] Can acquire Cloud Recording resource via API
- [ ] Can start recording with RTMP push to Cloudflare
- [ ] RTMP stream appears in Cloudflare dashboard
- [ ] HLS playback URL is available
- [ ] Can query recording status
- [ ] Can stop recording and cleanup resources
- [ ] Database migration adds required fields
- [ ] tRPC endpoints work (start, stop, status)
- [ ] Recording auto-starts when channel starts
- [ ] Recording auto-stops when channel ends
- [ ] Error handling logs useful debugging info
- [ ] Works on Heroku Eco dyno (no FFmpeg needed!)

---

## Testing Checklist

### Unit Tests

- [ ] `AgoraCloudRecordingService.acquire()` returns resourceId
- [ ] `AgoraCloudRecordingService.start()` returns sid
- [ ] `RecordingManager.startRecording()` creates session
- [ ] `RecordingManager.stopRecording()` cleans up
- [ ] Authentication header generated correctly

### Integration Tests

- [ ] End-to-end: Channel start → Recording starts → HLS URL available
- [ ] RTMP push reaches Cloudflare (verify in dashboard)
- [ ] HLS playback works in browser
- [ ] Recording stops when channel ends
- [ ] Error handling when Agora API fails

### Manual Testing

- [ ] Create test channel, verify recording starts
- [ ] Check Agora console for active recording
- [ ] Check Cloudflare for incoming RTMP stream
- [ ] Verify HLS URL plays in browser
- [ ] Stop channel, verify cleanup
- [ ] Check database for correct metadata

---

## Status

📝 PLANNING

## Notes

### Agora Cloud Recording Pricing

- **Cost**: $1.49 per 1,000 minutes
- **Billing**: Per recording session (not per viewer!)
- **RTMP Push**: Included (no extra cost)

### Next Phase Prerequisites

- Cloudflare Stream account created (Phase 3)
- Agora Customer ID/Secret obtained
- Test RTMP endpoint available
- Heroku env vars configured
