# Phase 3: Streaming Platform Integration

## Objective

Integrate with chosen streaming platform (Cloudflare Stream or AWS IVS) to create RTMP ingest endpoints and HLS playback URLs.

## User-Facing Changes

None yet - backend integration only.

## Files to Update

### New Files

- `src/services/streamingPlatformService.ts` - Abstract streaming platform interface
- `src/services/cloudflareStreamService.ts` - Cloudflare Stream implementation
- `src/services/awsIVSService.ts` - AWS IVS implementation (alternative)
- `src/types/streaming.ts` - Streaming platform types

### Modified Files

- `src/services/relayService.ts` - Use streaming platform service
- `src/config/streaming.ts` - Platform configuration

---

## Steps

### 1. Create Abstract Streaming Platform Interface

**File**: `src/types/streaming.ts`

```typescript
export interface StreamCredentials {
  streamKey: string;
  rtmpPushUrl: string;
  playbackUrl: string; // HLS URL
  streamId: string;
}

export interface StreamAnalytics {
  viewerCount: number;
  currentBitrate: number;
  peakViewers: number;
  totalWatchTime: number;
}

export interface IStreamingPlatform {
  // Create new live stream
  createLiveStream(channelId: number): Promise<StreamCredentials>;

  // End live stream
  endLiveStream(streamKey: string): Promise<void>;

  // Get HLS playback URL
  getPlaybackUrl(streamKey: string): Promise<string>;

  // Get analytics (viewer count, etc.)
  getAnalytics(streamKey: string): Promise<StreamAnalytics>;

  // Health check
  isHealthy(): Promise<boolean>;
}
```

---

### 2. Implement Cloudflare Stream Service

**File**: `src/services/cloudflareStreamService.ts`

```typescript
import axios from "axios";
import {
  IStreamingPlatform,
  StreamCredentials,
  StreamAnalytics,
} from "../types/streaming";

export class CloudflareStreamService implements IStreamingPlatform {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID!;
    this.apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN!;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/live_inputs`;
  }

  async createLiveStream(channelId: number): Promise<StreamCredentials> {
    const response = await axios.post(
      this.baseUrl,
      {
        meta: {
          name: `Channel ${channelId}`,
          channelId: channelId.toString(),
        },
        recording: {
          mode: "automatic", // Auto-record for VOD
          timeoutSeconds: 3600,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data.result;

    return {
      streamKey: data.uid,
      rtmpPushUrl: data.rtmps.url,
      playbackUrl: data.playback.hls,
      streamId: data.uid,
    };
  }

  async endLiveStream(streamKey: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${streamKey}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    });
  }

  async getPlaybackUrl(streamKey: string): Promise<string> {
    const response = await axios.get(`${this.baseUrl}/${streamKey}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    });

    return response.data.result.playback.hls;
  }

  async getAnalytics(streamKey: string): Promise<StreamAnalytics> {
    // Cloudflare Stream doesn't provide real-time analytics
    // We'll need to track this ourselves or use a different service

    return {
      viewerCount: 0, // Not available from Cloudflare
      currentBitrate: 0,
      peakViewers: 0,
      totalWatchTime: 0,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}`,
        {
          headers: { Authorization: `Bearer ${this.apiToken}` },
        },
      );
      return true;
    } catch {
      return false;
    }
  }
}
```

---

### 3. Implement AWS IVS Service (Alternative)

**File**: `src/services/awsIVSService.ts`

```typescript
import {
  IVSClient,
  CreateChannelCommand,
  DeleteChannelCommand,
  GetChannelCommand,
  GetStreamCommand,
  ListStreamsCommand,
} from "@aws-sdk/client-ivs";
import {
  IStreamingPlatform,
  StreamCredentials,
  StreamAnalytics,
} from "../types/streaming";

export class AWSIVSService implements IStreamingPlatform {
  private client: IVSClient;

  constructor() {
    this.client = new IVSClient({
      region: process.env.AWS_IVS_REGION || "us-west-2",
      credentials: {
        accessKeyId: process.env.AWS_IVS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_IVS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async createLiveStream(channelId: number): Promise<StreamCredentials> {
    // Create IVS channel
    const command = new CreateChannelCommand({
      name: `Channel ${channelId}`,
      latencyMode: "LOW", // or 'NORMAL' for standard HLS
      type: "STANDARD",
      tags: {
        channelId: channelId.toString(),
      },
    });

    const response = await this.client.send(command);
    const channel = response.channel!;
    const streamKey = response.streamKey!;

    return {
      streamKey: streamKey.value!,
      rtmpPushUrl: channel.ingestEndpoint!,
      playbackUrl: channel.playbackUrl!,
      streamId: channel.arn!,
    };
  }

  async endLiveStream(streamKey: string): Promise<void> {
    // Find channel by stream key (requires listing channels)
    // Then delete the channel

    // Note: AWS IVS requires channel ARN, not stream key
    // This is simplified - production needs channel ARN tracking

    const command = new DeleteChannelCommand({
      arn: streamKey, // This should be channel ARN
    });

    await this.client.send(command);
  }

  async getPlaybackUrl(streamKey: string): Promise<string> {
    const command = new GetChannelCommand({
      arn: streamKey, // Channel ARN
    });

    const response = await this.client.send(command);
    return response.channel!.playbackUrl!;
  }

  async getAnalytics(streamKey: string): Promise<StreamAnalytics> {
    try {
      const command = new GetStreamCommand({
        channelArn: streamKey,
      });

      const response = await this.client.send(command);
      const stream = response.stream;

      return {
        viewerCount: stream?.viewerCount || 0,
        currentBitrate: 0, // Not directly available
        peakViewers: 0, // Would need CloudWatch
        totalWatchTime: 0,
      };
    } catch {
      return {
        viewerCount: 0,
        currentBitrate: 0,
        peakViewers: 0,
        totalWatchTime: 0,
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.send(new ListStreamsCommand({}));
      return true;
    } catch {
      return false;
    }
  }
}
```

---

### 4. Create Platform Factory

**File**: `src/services/streamingPlatformService.ts`

```typescript
import { IStreamingPlatform } from "../types/streaming";
import { CloudflareStreamService } from "./cloudflareStreamService";
import { AWSIVSService } from "./awsIVSService";

export class StreamingPlatformService {
  private platform: IStreamingPlatform;

  constructor() {
    const platformType = process.env.STREAMING_PLATFORM || "cloudflare";

    switch (platformType) {
      case "cloudflare":
        this.platform = new CloudflareStreamService();
        break;
      case "aws-ivs":
        this.platform = new AWSIVSService();
        break;
      default:
        throw new Error(`Unknown streaming platform: ${platformType}`);
    }
  }

  // Delegate all methods to the selected platform
  createLiveStream = this.platform.createLiveStream.bind(this.platform);
  endLiveStream = this.platform.endLiveStream.bind(this.platform);
  getPlaybackUrl = this.platform.getPlaybackUrl.bind(this.platform);
  getAnalytics = this.platform.getAnalytics.bind(this.platform);
  isHealthy = this.platform.isHealthy.bind(this.platform);
}
```

---

### 5. Update Configuration

**File**: `src/config/streaming.ts`

```typescript
export const streamingConfig = {
  platform: process.env.STREAMING_PLATFORM || "cloudflare",

  cloudflare: {
    accountId: process.env.CLOUDFLARE_STREAM_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_STREAM_API_TOKEN,
  },

  awsIVS: {
    region: process.env.AWS_IVS_REGION || "us-west-2",
    accessKeyId: process.env.AWS_IVS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_IVS_SECRET_ACCESS_KEY,
  },

  // Encoding presets
  encoding: {
    resolutions: {
      "1080p": { width: 1920, height: 1080, bitrate: "5000k" },
      "720p": { width: 1280, height: 720, bitrate: "3000k" },
      "480p": { width: 854, height: 480, bitrate: "1500k" },
    },
    defaultResolution: "720p",
    framerate: 30,
    audioSampleRate: 48000,
    audioBitrate: "128k",
  },
};

// Validate configuration
export function validateStreamingConfig(): void {
  const { platform, cloudflare, awsIVS } = streamingConfig;

  if (platform === "cloudflare") {
    if (!cloudflare.accountId || !cloudflare.apiToken) {
      throw new Error("Cloudflare Stream credentials not configured");
    }
  }

  if (platform === "aws-ivs") {
    if (!awsIVS.accessKeyId || !awsIVS.secretAccessKey) {
      throw new Error("AWS IVS credentials not configured");
    }
  }
}
```

---

### 6. Add Dependencies

**File**: `package.json`

```json
{
  "dependencies": {
    "@aws-sdk/client-ivs": "^3.x.x",
    "axios": "^1.x.x"
  }
}
```

---

## Design Considerations

### Platform Selection Criteria

| Criteria           | Cloudflare Stream             | AWS IVS                |
| ------------------ | ----------------------------- | ---------------------- |
| **Cost**           | $5/1000 mins                  | $0.40/hour + bandwidth |
| **Latency**        | 15-30s (standard), 8-12s (LL) | 3-5s (low-latency)     |
| **Setup**          | Simpler API                   | More complex           |
| **Analytics**      | Limited                       | Rich (CloudWatch)      |
| **CDN**            | Included (excellent)          | Included (excellent)   |
| **Vendor lock-in** | Medium                        | Higher (AWS ecosystem) |

**Recommendation**: Start with Cloudflare for simplicity, add AWS IVS if lower latency needed.

### Error Handling

- **API failures**: Retry with exponential backoff (3 attempts)
- **Rate limiting**: Respect platform limits, queue requests
- **Invalid credentials**: Fail fast with clear error message
- **Stream not found**: Handle gracefully (may have been deleted)

### Cost Monitoring

- Track stream creation/deletion events
- Log bandwidth usage (estimate from duration × bitrate)
- Alert when approaching budget thresholds
- Monthly cost reports

---

## Acceptance Criteria

- [ ] Cloudflare Stream service can create/delete streams
- [ ] AWS IVS service can create/delete streams (if implementing)
- [ ] Platform factory selects correct service based on env var
- [ ] RTMP push URL returned correctly
- [ ] HLS playback URL returned correctly
- [ ] Error handling implemented (API failures, auth errors)
- [ ] Configuration validated on startup
- [ ] Platform health check works

---

## Testing Checklist

### Unit Tests

- [ ] CloudflareStreamService.createLiveStream() returns valid credentials
- [ ] AWSIVSService.createLiveStream() returns valid credentials
- [ ] StreamingPlatformService selects correct platform
- [ ] Configuration validation detects missing credentials

### Integration Tests

- [ ] Create stream on Cloudflare → Get valid RTMP URL
- [ ] Create stream on AWS IVS → Get valid RTMP URL
- [ ] Delete stream cleans up resources
- [ ] Health check detects platform availability

### Manual Testing

- [ ] Test RTMP push to Cloudflare with OBS/FFmpeg
- [ ] Verify HLS playback URL works in browser
- [ ] Test stream deletion (no orphaned resources)
- [ ] Verify costs in platform dashboard

---

## Status

📝 PLANNING

## Notes

### Cloudflare Stream Limits

- Free tier: 1,000 minutes/month
- Max concurrent streams: 100 (contact for higher)
- Max stream duration: No limit (charges per minute)

### AWS IVS Limits

- No free tier
- Max concurrent streams: 10 (default quota, can increase)
- Latency modes: LOW (3-5s), NORMAL (10-20s)

### Next Phase Prerequisites

- Streaming platform account created
- API credentials obtained and configured
- Test streams created successfully
- RTMP push tested with FFmpeg
