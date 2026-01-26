# Phase 3: Cloudflare Stream Integration

## Objective

Integrate Cloudflare Stream to receive RTMP from Agora Cloud Recording and distribute HLS to buyers. This phase provides the streaming platform that converts RTMP to HLS and handles global CDN distribution.

## User-Facing Changes

None yet - backend integration only. This sets up the infrastructure for Phase 4 (HLS player for buyers).

## Files to Update

### New Files

- `src/services/cloudflareStreamService.ts` - Cloudflare Stream API integration
- `src/types/streaming.ts` - Streaming platform types
- `migrations/021_add_cloudflare_stream_fields.ts` - Add stream metadata to channels

### Modified Files

- `src/services/recordingManager.ts` - Use Cloudflare Stream RTMP URL
- `src/services/channelService.ts` - Store HLS playback URL

---

## Architecture Context

This phase connects to Phase 2 (Agora Cloud Recording):

```
Phase 2: Agora Cloud Recording
       │ (RTMP Push configured)
       ▼
Phase 3: Cloudflare Stream ← YOU ARE HERE
       │ (Creates Live Input, returns RTMP URL)
       │ (Transcodes to HLS, distributes via CDN)
       ▼
Phase 4: HLS Player (buyers watch via CDN)
```

---

## Steps

### 1. Define Streaming Types

**File**: `src/types/streaming.ts`

```typescript
// Cloudflare Stream API Types
export interface CloudflareStreamCredentials {
  streamKeyId: string; // Cloudflare Live Input UID
  rtmpUrl: string; // URL for RTMP push (Agora → Cloudflare)
  rtmpsUrl: string; // Secure RTMP URL (recommended)
  hlsPlaybackUrl: string; // HLS URL for buyers
  dashPlaybackUrl?: string; // Optional DASH URL
}

export interface CloudflareStreamStatus {
  isLive: boolean;
  viewerCount?: number; // Not available in real-time from Cloudflare
  durationSeconds: number;
  recordingAvailable: boolean;
}

export interface CreateStreamOptions {
  channelId: number;
  enableRecording?: boolean; // Save VOD after stream ends
  maxDurationSeconds?: number; // Auto-stop after duration
  deleteRecordingAfterDays?: number; // Auto-cleanup old VODs
}
```

---

### 2. Implement Cloudflare Stream Service

**File**: `src/services/cloudflareStreamService.ts`

```typescript
import axios, { AxiosInstance } from "axios";
import {
  CloudflareStreamCredentials,
  CloudflareStreamStatus,
  CreateStreamOptions,
} from "../types/streaming";

export class CloudflareStreamService {
  private client: AxiosInstance;
  private accountId: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID!;
    const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

    if (!this.accountId || !apiToken) {
      throw new Error(
        "Missing Cloudflare Stream credentials (CLOUDFLARE_STREAM_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN)",
      );
    }

    this.client = axios.create({
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Create a new Live Input for receiving RTMP stream from Agora Cloud Recording
   */
  async createLiveInput(
    options: CreateStreamOptions,
  ): Promise<CloudflareStreamCredentials> {
    const response = await this.client.post("/live_inputs", {
      meta: {
        name: `Channel ${options.channelId}`,
        channelId: options.channelId.toString(),
      },
      recording: {
        mode: options.enableRecording ? "automatic" : "off",
        timeoutSeconds: options.maxDurationSeconds || 7200, // 2 hours default
        requireSignedURLs: false, // Public playback
        deleteRecordingAfterDays: options.deleteRecordingAfterDays || 30,
      },
    });

    const data = response.data.result;

    return {
      streamKeyId: data.uid,
      rtmpUrl: data.rtmps.url.replace("rtmps://", "rtmp://"), // For testing
      rtmpsUrl: data.rtmps.url, // Secure URL (recommended for production)
      hlsPlaybackUrl: data.playback.hls,
      dashPlaybackUrl: data.playback.dash,
    };
  }

  /**
   * Get HLS playback URL for a live input
   */
  async getPlaybackUrl(streamKeyId: string): Promise<string> {
    const response = await this.client.get(`/live_inputs/${streamKeyId}`);
    return response.data.result.playback.hls;
  }

  /**
   * Get stream status (live/offline, duration, etc.)
   */
  async getStreamStatus(streamKeyId: string): Promise<CloudflareStreamStatus> {
    const response = await this.client.get(`/live_inputs/${streamKeyId}`);
    const data = response.data.result;

    const isLive = data.status?.current === "live";
    const durationSeconds = data.status?.duration || 0;

    // Check if recording exists (after stream ends)
    let recordingAvailable = false;
    if (data.recording?.uid) {
      try {
        await this.client.get(`/${data.recording.uid}`);
        recordingAvailable = true;
      } catch {
        recordingAvailable = false;
      }
    }

    return {
      isLive,
      durationSeconds,
      recordingAvailable,
      viewerCount: undefined, // Not available from Cloudflare API
    };
  }

  /**
   * Delete a live input (cleanup after channel ends)
   */
  async deleteLiveInput(streamKeyId: string): Promise<void> {
    await this.client.delete(`/live_inputs/${streamKeyId}`);
  }

  /**
   * Health check - verify API credentials and connectivity
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.get("/live_inputs?limit=1");
      return true;
    } catch (error) {
      console.error("Cloudflare Stream health check failed:", error);
      return false;
    }
  }

  /**
   * Get recording URL (VOD) after stream ends
   */
  async getRecordingUrl(streamKeyId: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/live_inputs/${streamKeyId}`);
      const recordingUid = response.data.result.recording?.uid;

      if (!recordingUid) {
        return null;
      }

      // Get recording details
      const recordingResponse = await this.client.get(`/${recordingUid}`);
      return recordingResponse.data.result.playback.hls;
    } catch {
      return null;
    }
  }
}
```

---

### 3. Add Database Fields for Cloudflare Stream

**File**: `migrations/021_add_cloudflare_stream_fields.ts`

```typescript
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("channels")
    .addColumn("stream_key_id", "varchar(100)") // Cloudflare Live Input UID
    .addColumn("hls_playback_url", "varchar(500)") // HLS URL for buyers
    .addColumn("stream_recording_url", "varchar(500)") // VOD URL (after stream)
    .execute();

  // Index for faster lookups
  await db.schema
    .createIndex("idx_channels_stream_key_id")
    .on("channels")
    .column("stream_key_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex("idx_channels_stream_key_id")
    .on("channels")
    .execute();

  await db.schema
    .alterTable("channels")
    .dropColumn("stream_key_id")
    .dropColumn("hls_playback_url")
    .dropColumn("stream_recording_url")
    .execute();
}
```

---

### 4. Update Recording Manager to Use Cloudflare Stream

**File**: `src/services/recordingManager.ts` (modify from Phase 2)

Add Cloudflare Stream integration:

```typescript
import { CloudflareStreamService } from "./cloudflareStreamService";

export class RecordingManager {
  private cloudRecording: AgoraCloudRecordingService;
  private cloudflareStream: CloudflareStreamService;
  private db: Database;

  constructor(db: Database) {
    this.cloudRecording = new AgoraCloudRecordingService();
    this.cloudflareStream = new CloudflareStreamService();
    this.db = db;
  }

  async startRecording(
    channelId: number,
    channelName: string,
    sellerUid: number,
  ): Promise<{ hlsPlaybackUrl: string }> {
    // 1. Create Cloudflare Stream Live Input
    const streamCredentials = await this.cloudflareStream.createLiveInput({
      channelId,
      enableRecording: true, // Save VOD
      maxDurationSeconds: 7200, // 2 hours max
      deleteRecordingAfterDays: 30,
    });

    // 2. Start Agora Cloud Recording with Cloudflare RTMP URL
    const recordingUid = await this.generateRecordingUid();

    const resourceId = await this.cloudRecording.acquire({
      channelName,
      uid: recordingUid,
      rtmpPushUrl: streamCredentials.rtmpsUrl, // Push to Cloudflare
    });

    const storageConfig = {
      vendor: 1, // Not used (RTMP mode)
      region: 0,
    };

    const recordingConfig = {
      channelType: 0, // Live broadcast
      streamTypes: 2, // Audio + Video
      maxIdleTime: 30, // Stop if seller leaves for 30s
    };

    const sid = await this.cloudRecording.start(
      resourceId,
      channelName,
      recordingUid,
      streamCredentials.rtmpsUrl, // RTMP URL
      storageConfig,
      recordingConfig,
    );

    // 3. Update database with both Agora and Cloudflare info
    await this.db
      .updateTable("channels")
      .set({
        agora_resource_id: resourceId,
        agora_sid: sid,
        agora_recording_uid: recordingUid,
        stream_key_id: streamCredentials.streamKeyId,
        hls_playback_url: streamCredentials.hlsPlaybackUrl,
        relay_status: "starting",
        relay_started_at: new Date(),
      })
      .where("id", "=", channelId)
      .execute();

    console.log(
      `Recording started for channel ${channelId}: Agora SID ${sid}, Cloudflare Stream ${streamCredentials.streamKeyId}`,
    );

    return {
      hlsPlaybackUrl: streamCredentials.hlsPlaybackUrl,
    };
  }

  async stopRecording(channelId: number): Promise<void> {
    // 1. Get recording info from database
    const channel = await this.db
      .selectFrom("channels")
      .selectAll()
      .where("id", "=", channelId)
      .executeTakeFirst();

    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    if (!channel.agora_resource_id || !channel.agora_sid) {
      console.warn(`No active recording for channel ${channelId}`);
      return;
    }

    // 2. Stop Agora Cloud Recording
    await this.cloudRecording.stop(
      channel.agora_resource_id,
      channel.agora_sid,
      channel.channel_name,
      channel.agora_recording_uid!,
    );

    // 3. Wait a few seconds for Cloudflare to process final segments
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 4. Get recording URL (VOD) from Cloudflare
    let recordingUrl: string | null = null;
    if (channel.stream_key_id) {
      recordingUrl = await this.cloudflareStream.getRecordingUrl(
        channel.stream_key_id,
      );
    }

    // 5. Update database
    await this.db
      .updateTable("channels")
      .set({
        relay_status: "stopped",
        stream_recording_url: recordingUrl,
      })
      .where("id", "=", channelId)
      .execute();

    console.log(`Recording stopped for channel ${channelId}`);
  }

  async getRecordingStatus(channelId: number): Promise<{
    isActive: boolean;
    isLive: boolean;
    hlsPlaybackUrl: string | null;
    recordingUrl: string | null;
  }> {
    const channel = await this.db
      .selectFrom("channels")
      .selectAll()
      .where("id", "=", channelId)
      .executeTakeFirst();

    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    let isLive = false;
    if (channel.stream_key_id) {
      const status = await this.cloudflareStream.getStreamStatus(
        channel.stream_key_id,
      );
      isLive = status.isLive;
    }

    return {
      isActive: channel.relay_status === "active",
      isLive,
      hlsPlaybackUrl: channel.hls_playback_url,
      recordingUrl: channel.stream_recording_url,
    };
  }
}
```

---

### 5. Add Environment Variables

**File**: `.env` (example)

```bash
# Cloudflare Stream Configuration
CLOUDFLARE_STREAM_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_STREAM_API_TOKEN=your_api_token_here
```

**How to get credentials**:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Stream** section
3. Get **Account ID** from URL or Account settings
4. Create **API Token**:
   - Go to My Profile → API Tokens
   - Create Token → Edit Cloudflare Stream
   - Permissions: Stream:Edit
   - Copy token (shown only once!)

---

### 6. Add tRPC Endpoints (Optional - for testing)

**File**: `src/routers/streamingRouter.ts`

```typescript
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { CloudflareStreamService } from "../services/cloudflareStreamService";
import { db } from "../db";

const streamingService = new CloudflareStreamService();

export const streamingRouter = router({
  // Get HLS playback URL for a channel
  getPlaybackUrl: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      const channel = await db
        .selectFrom("channels")
        .select("hls_playback_url")
        .where("id", "=", input.channelId)
        .executeTakeFirst();

      if (!channel?.hls_playback_url) {
        throw new Error("No HLS stream available for this channel");
      }

      return {
        hlsUrl: channel.hls_playback_url,
      };
    }),

  // Get stream status (live/offline)
  getStreamStatus: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      const channel = await db
        .selectFrom("channels")
        .select(["stream_key_id", "hls_playback_url"])
        .where("id", "=", input.channelId)
        .executeTakeFirst();

      if (!channel?.stream_key_id) {
        return { isLive: false, hlsUrl: null };
      }

      const status = await streamingService.getStreamStatus(
        channel.stream_key_id,
      );

      return {
        isLive: status.isLive,
        hlsUrl: channel.hls_playback_url,
        durationSeconds: status.durationSeconds,
        recordingAvailable: status.recordingAvailable,
      };
    }),

  // Health check
  healthCheck: publicProcedure.query(async () => {
    const isHealthy = await streamingService.isHealthy();
    return { healthy: isHealthy };
  }),
});
```

Add to main router:

```typescript
// src/routers/index.ts
import { streamingRouter } from "./streamingRouter";

export const appRouter = router({
  // ... other routers
  streaming: streamingRouter,
});
```

---

## Design Considerations

### Why Cloudflare Stream?

| Aspect              | Cloudflare Stream               | AWS IVS                    |
| ------------------- | ------------------------------- | -------------------------- |
| **Cost**            | $5/1,000 mins (~$0.30/hour)     | $2.40/hour + $0.015/GB     |
| **Latency**         | 15-30s (HLS), 8-12s (LL-HLS)    | 3-5s (low-latency mode)    |
| **Setup**           | Simple REST API                 | Complex AWS SDK            |
| **CDN**             | Global, included, excellent     | CloudFront (separate cost) |
| **VOD**             | Auto-record, no extra cost      | Requires S3 setup          |
| **Transcoding**     | Automatic, adaptive bitrate     | Manual configuration       |
| **Analytics**       | Basic (via API, limited)        | Rich (CloudWatch)          |
| **Free Tier**       | 1,000 mins/month                | None                       |
| **Heroku Friendly** | ✅ REST API only, no buildpacks | ✅ SDK works fine          |

**Decision**: Cloudflare Stream for MVP due to simplicity and cost. AWS IVS can be added later if lower latency is critical.

---

### Error Handling Strategy

**API Failures**:

```typescript
try {
  const credentials = await cloudflareStream.createLiveInput({ channelId });
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      throw new Error("Invalid Cloudflare API credentials");
    }
    if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded, try again later");
    }
  }
  throw new Error("Failed to create stream");
}
```

**Stream Not Live**:

- Don't error if stream not live yet (takes 10-30s to start)
- Poll status every 5s until live
- Timeout after 2 minutes

**Cleanup on Failure**:

```typescript
try {
  // Start recording
} catch (error) {
  // Cleanup Cloudflare resources
  if (streamKeyId) {
    await cloudflareStream.deleteLiveInput(streamKeyId);
  }
  throw error;
}
```

---

### Cost Tracking

**Track in database**:

```sql
CREATE TABLE stream_costs (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id),
  stream_key_id VARCHAR(100),
  duration_seconds INTEGER,
  cost_cents INTEGER, -- Calculated: (duration/60) * 5
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Calculate on stream end**:

```typescript
const durationMinutes = Math.ceil(durationSeconds / 60);
const costCents = Math.ceil((durationMinutes / 1000) * 500); // $5 per 1000 mins

await db.insertInto("stream_costs").values({
  channel_id: channelId,
  stream_key_id: streamKeyId,
  duration_seconds: durationSeconds,
  cost_cents: costCents,
});
```

---

## Testing Plan

### Unit Tests

```typescript
describe("CloudflareStreamService", () => {
  it("creates live input successfully", async () => {
    const service = new CloudflareStreamService();
    const credentials = await service.createLiveInput({ channelId: 1 });

    expect(credentials.streamKeyId).toBeDefined();
    expect(credentials.rtmpsUrl).toContain("rtmps://");
    expect(credentials.hlsPlaybackUrl).toContain(".m3u8");
  });

  it("throws error with invalid credentials", async () => {
    process.env.CLOUDFLARE_STREAM_API_TOKEN = "invalid";
    const service = new CloudflareStreamService();

    await expect(service.createLiveInput({ channelId: 1 })).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
describe("Recording Manager + Cloudflare Integration", () => {
  it("starts recording and returns HLS URL", async () => {
    const manager = new RecordingManager(db);
    const result = await manager.startRecording(1, "test-channel", 12345);

    expect(result.hlsPlaybackUrl).toContain(".m3u8");

    // Cleanup
    await manager.stopRecording(1);
  });
});
```

### Manual Testing Checklist

#### Test Stream Creation

```bash
# 1. Create live input via API
curl -X POST https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "meta": {"name": "Test Stream"},
    "recording": {"mode": "automatic"}
  }'

# 2. Note the RTMP URL and HLS URL from response
```

#### Test RTMP Push (with FFmpeg)

```bash
# Push test stream to Cloudflare
ffmpeg -re -i test-video.mp4 \
  -c:v libx264 -preset veryfast -b:v 3000k \
  -c:a aac -b:a 128k \
  -f flv "rtmps://live.cloudflare.com:443/live/{stream_key}"
```

#### Test HLS Playback

```bash
# Open HLS URL in browser or VLC
open "https://customer-{id}.cloudflarestream.com/{video_id}/manifest/video.m3u8"
```

#### Verify in Dashboard

1. Go to Cloudflare Stream dashboard
2. Check "Live Inputs" section
3. Verify stream is "Live" when pushing RTMP
4. Check viewer count (if available)
5. Verify recording appears after stream ends

---

## Acceptance Criteria

- [ ] CloudflareStreamService can create live inputs
- [ ] Live input returns valid RTMP URL for Agora Cloud Recording
- [ ] Live input returns valid HLS URL for buyers
- [ ] RecordingManager integrates Cloudflare Stream with Agora Cloud Recording
- [ ] Database stores stream_key_id and hls_playback_url
- [ ] Migration 021 runs successfully
- [ ] Health check validates API credentials
- [ ] Error handling covers API failures, auth errors, rate limits
- [ ] Environment variables documented
- [ ] tRPC endpoints return playback URLs
- [ ] Stream status correctly reports live/offline state
- [ ] VOD recording URL retrieved after stream ends

---

## Dependencies

### External Services

- **Cloudflare Stream Account**: [Sign up](https://dash.cloudflare.com/sign-up/stream)
- **API Token**: Stream:Edit permission

### NPM Packages

```json
{
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

Already installed - no new dependencies needed!

---

## Next Phase Prerequisites

Before starting Phase 4 (HLS Player for Buyers):

- [ ] Cloudflare Stream account created
- [ ] API token generated and configured in `.env`
- [ ] Test stream created and verified
- [ ] HLS playback URL accessible in browser
- [ ] Integration between Phase 2 (Agora) and Phase 3 (Cloudflare) tested

---

## Estimated Time

**3-4 hours**

- CloudflareStreamService implementation: 1.5 hours
- RecordingManager integration: 1 hour
- Database migration + testing: 1 hour
- Manual testing + debugging: 0.5 hours

---

## Status

📝 PLANNING

## Notes

### Cloudflare Stream Features to Explore Later

- **Low-Latency HLS (LL-HLS)**: 8-12s latency (vs 15-30s standard)
- **Signed URLs**: Restrict playback to authenticated users
- **Thumbnails**: Auto-generated preview images
- **Clipping**: Create highlight clips from recordings
- **Webhooks**: Real-time notifications (stream.live.ended, etc.)

### Alternative Platforms (Future)

If Cloudflare doesn't meet needs:

- **AWS IVS**: Lower latency (3-5s), richer analytics
- **Mux**: Developer-friendly, good analytics, higher cost
- **Wowza**: Self-hosted option, full control

**Recommendation**: Start with Cloudflare, evaluate others after MVP.
