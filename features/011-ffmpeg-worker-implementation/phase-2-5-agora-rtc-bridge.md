# Phase 2.5: Agora RTC Bridge in Worker (Puppeteer Approach)

**Status**: 🔄 In Progress  
**Started**: 2026-02-19  
**Estimated Duration**: 8-10 hours

---

## Problem Statement

After implementing Phase 1 (Worker) and Phase 2 (Backend Integration), the system successfully:

- ✅ Creates channels and enqueues jobs to Redis
- ✅ Worker receives jobs and spawns FFmpeg processes
- ✅ FFmpeg is configured with RTMP output to Cloudflare

**However, the stream never starts because:**

- ❌ FFmpeg stdin (`-i pipe:0`) receives no data
- ❌ No component subscribes to the Agora RTC channel
- ❌ Seller's audio/video frames never reach the worker

**Error observed**:

```
✅ FFmpeg process spawned for channel 21 (PID: 81228)
# FFmpeg waits indefinitely for stdin data
# Stream never reaches Cloudflare
# Buyers see nothing
```

---

## Objective

Implement an **Agora RTC Bridge** in the FFmpeg worker that:

1. Connects to Agora RTC as an audience member (like a buyer)
2. Subscribes to the seller's audio/video stream
3. Receives media frames in real-time via WebRTC
4. Converts frames to raw format (YUV420p video, PCM audio)
5. Pipes frames to FFmpeg stdin
6. FFmpeg encodes and pushes to Cloudflare RTMP

**🎯 Cost Constraint**: Use Agora RTC free tier (10,000 min/mois) - **NO paid Media Pull/Push**

---

## Technical Challenges

### Challenge 1: No Official Agora Node.js Server SDK

Agora provides:

- ✅ **Web SDK** (`agora-rtc-sdk-ng`) - Browser only, uses WebRTC
- ✅ **Native SDK** (C++/Java/Objective-C) - Mobile/Desktop apps
- ❌ **No Node.js Server SDK** for subscribing to WebRTC streams

### Challenge 2: Cost Requirements

**REJECTED Options** (too expensive):

- ❌ **Media Pull API**: ~$1.49/1000 min (same as current Media Push)
- ❌ **Cloud Recording**: ~$1.49/1000 min (defeats Feature 011 purpose)

**SELECTED Solution**:

- ✅ **Puppeteer + Agora Web SDK** - Uses free RTC tier (<10K min/mois)

---

## Solution: Puppeteer + Agora Web SDK

### Why Puppeteer?

The worker acts as a **virtual buyer** that subscribes to the seller's stream:

```
Seller (Browser) → Agora RTC → Worker (Headless Browser) → FFmpeg → Cloudflare
                    ↑
                   FREE (participant in RTC channel)
```

**Cost Analysis**:

- Seller = 1 RTC participant
- Worker = 1 RTC participant (subscribing)
- Total = 2 participants per channel
- 50 channels × 3h/day × 30 days = 4,500 min/mois
- **Well under 10K free tier** ✅

---

## Architecture (Puppeteer + Web SDK)

````
┌─────────────────┐
│  SELLER         │ (Browser, Agora Web SDK)
│  Publish stream │
└────────┬────────┘
         │ WebRTC (FREE - participant 1)
         ▼
┌─────────────────────────────────┐
│  AGORA RTC CLOUD                │
│  Channel: channelId             │
│  Free tier: <10K min/mois       │
└────────┬────────────────────────┘
         │ WebRTC (FREE - participant 2)
         │
         ▼
┌─────────────────────────────────────────────┐
│  FFMPEG WORKER                              │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ Puppeteer (Headless Chrome)          │  │
│  │  ↓                                    │  │
│  │ rtc-subscriber.html                  │  │
│  │  - Agora Web SDK                     │  │
│  │  - client.join(channelName, token)   │  │
│  │  - client.on('user-published')       │  │
│  │  - Subscribe to seller video/audio   │  │
│  │                                       │  │
│  │  ↓ MediaStreamTrack                  │  │
│  └──────────────┬───────────────────────┘  │
│                 ▼                           │
│  ┌──────────────────────────────────────┐  │
│  │ Frame Extractor                      │  │
│  │  - Canvas API for video frames       │  │
│  │  - Web Audio API for audio samples   │  │
│  │  - Convert to raw: YUV420p + PCM     │  │
│  └──────────────┬───────────────────────┘  │
│                 ▼                           │
│  ┌──────────────────────────────────────┐  │
│  │ FFmpeg Process                       │  │
│  │  stdin ← raw frames (pipe)           │  │
│  │  -c:v libx264 (encode H.264)         │  │
│  │  -c:a aac (encode AAC)               │  │
│  │  -f flvCreate RTC Subscriber HTML Page

**File**: `ffmpeg-worker/public/rtc-subscriber.html` (NEW)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.20.0.js"></script>
</head>
<body>
  <video id="remote-video" autoplay playsinline muted></video>
  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const appId = urlParams.get('appId');
    const channel = urlParams.get('channel');
    const token = urlParams.get('token');
    const uid = 999999; // Fixed UID for worker

    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      console.log('Subscribed to', user.uid, mediaType);

      if (mediaType === 'video') {
        user.videoTrack.play('remote-video');
        // Signal to Puppeteer that video is ready
        window.videoTrackReady = true;
        window.videoTrack = user.videoTrack;
      }

      if (mediaType === 'audio') {
        user.audioTrack.play();
        window.audioTrackReady = true;
        window.audioTrack = user.audioTrack;
      }
    });

    async function init() {
      await client.setClientRole('audience');
      await client.join(appId, channel, token, uid);
      console.log('Joined channel:', channel);
      window.agoraClient = client;
    }

    init().catch(console.error);
  </script>
</body>
</html>
````

### Step 2: Implement AgoraRTCBridge Service

**File**: `ffmpeg-worker/src/services/AgoraRTCBridge.ts` (NEW)

```typescript
import puppeteer, { Browser, Page } from 'puppeteer';
import { Writable } from 'stream';

export interface RTCBridgeConfig {
  appId: string;
  channelName: string;
  token: string;
  workerUid: number;
}

/**
 * AgoraRTCBridge - Subscribes to Agora RTC using Puppeteer + Web SDK
 * Acts as a virtual buyer that receives seller's stream
 */
export class AgoraRTCBridge {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private frameStream: Writable | null = null;

  async connect(config: RTCBridgeConfig): Promise<void> {
    console.log(`🌐 Launching headless browser for channel ${config.channelName}`);

    // Launch Puppeteer with hardware acceleration disabled (lighter)
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    this.page = await this.browser.newPage();

    // Enable coInstall Puppeteer Dependencies ⏱️ 30min

- [ ] Install Puppeteer in worker: `npm install puppeteer`
- [ ] Install types: `npm install -D @types/puppeteer`
- [ ] Update Dockerfile to include Chrome dependencies
- [ ] Test Puppeteer launches successfully

### Task 2.5.2: Create RTC Subscriber Page ⏱️ 1h

- [ ] Create `ffmpeg-worker/public/` directory
- [ ] Create `rtc-subscriber.html` with Agora Web SDK
- [ ] Implement client.join() and subscribe logic
- [ ] Add event handlers for user-published
- [ ] Expose video/audio tracks to window object
- [ ] Serve HTML via Express static middleware

### Task 2.5.3: Implement AgoraRTCBridge Service ⏱️ 3h

- [ ] Create `ffmpeg-worker/src/services/AgoraRTCBridge.ts`
- [ ] Implement `connect()` method (launch Puppeteer, navigate to page)
- [ ] Implement `waitForSubscription()` (wait for tracks ready)
- [ ] Implement `startFrameCapture()` (Canvas API frame extraction)
- [ ] Implement frame conversion: RGBA → YUV420p (video)
- [ ] Implement audio extraction: Web Audio API → PCM (audio)
- [ ] Pipe frames to writable stream (FFmpeg stdin)
- [ ] Implement `disconnect()` cleanup

### Task 2.5.4: Create Frame Converter Utility ⏱️ 2h

- [ ] Create `ffmpeg-worker/src/utils/frameConverter.ts`
- [ ] Implement `convertRGBAtoYUV420()` function
- [ ] Implement `extractAudioSamples()` function
- [ ] Optimize conversion performance (use WebWorkers if needed)
- [ ] Add frame rate limiting (30 FPS target)

### Task 2.5.5: Integrate Bridge with FFmpegManager ⏱️ 2h

- [ ] Update `FFmpegManager.startStream()` to initialize RTC bridge
- [ ] Connect bridge before spawning FFmpeg
- [ ] Pipe bridge output to FFmpeg stdin
- [ ] Update `stopStream()` to disconnect bridge gracefully
- [ ] Add error handling for bridge failures

### Task 2.5.6: Update Backend to Provide Token ⏱️ 1h

- [ ] Update `StreamJob` interface to include `agoraToken`
- [ ] Update `ffmpegRelayService.startRelay()` to generate token
- [ ] Token config: UID 999999, role 'audience', 24h expiry
- [ ] EnPuppeteer Integration**
  - Worker can launch headless Chrome successfully
  - HTML page loads with Agora Web SDK
  - No crashes or memory leaks

- [ ] **RTC Subscription**
  - Worker joins Agora channel as participant (UID 999999)
  - Successfully subscribes to seller's video track
  - Successfully subscribes to seller's audio track
  - Agora console shows 2 participants (seller + worker)

- [ ] **Frame Extraction**
  - Canvas API captures video frames at 30 FPS
  - Frames are converted to YUV420p format
  - Audio samples are extracted and converted to PCM

- [ ] **FFmpeg Integration**
  - Frames are piped to FFmpeg stdin successfully
  - FFmpeg no longer waits indefinitely
  - FFmpeg encodes and pushes to Cloudflare RTMP

- [ ] **End-to-End Stream**
  - Seller publishes to Agora RTC
  - Worker subscribes via Puppeteer + Web SDK
  - FFmpeg receives frames and encodes
  - Cloudflare receives RTMP and serves HLS
  - Buyer watches HLS stream with <10s latency
  High CPU/RAM usage (Puppeteer + Chrome) | High | Medium | Use `--disable-gpu` flag, limit to 4GB RAM workers, monitor usage |
| Frame conversion performance bottleneck | Medium | High | Optimize YUV conversion, use native modules if needed, target 30 FPS |
| Puppeteer crashes or hangs | Medium | High | Add watchdog timer, auto-restart on crash, health checks |
| Latency (RTC → Canvas → YUV → FFmpeg → RTMP → HLS) | Medium | Medium | Optimize frame buffer size, reduce conversion overhead, target <5s |
| Exceeding 10K free tier minutes | Low | Medium | Monitor usage dashboard, add alerts at 8K min/mois |
| Memory leaks from browser instances | Medium | High | Ensure browser.close() in all error paths, add memory monitoring |

---

## Resource Requirements (Updated)

### Infrastructure Sizing

With Puppeteer, workers need more resources:

| Component         | Before (stdin) | After (Puppeteer) | Notes                          |
|-------------------|----------------|-------------------|--------------------------------|
| vCPU              | 1              | 2                 | Chrome rendering + FFmpeg      |
| RAM               | 2GB            | 4GB               | Headless browser memory        |
| Render.com plan   | Standard       | Pro               | $85/month instead of $25       |

**Revised Cost (50 channels × 3h/day × 30d = 4,500 min/mois)**:
| Item                | Cost/mois |
|---------------------|-----------|
| Agora RTC (free)    | $0        |
| FFmpeg Worker (Pro) | $85       |
| Redis               | $10       |
| **Total**           | **$95**   |

**Still 82% cheaper than current Media Push** ($540/mois) ✅

---

## Alternative Approaches (If Puppeteer Too Heavy)

### Option 1: LiveKit Self-Hosted
- Open-source WebRTC SFU
- Native recording to disk
- Cost: ~$200/mois infrastructure + $8K dev
- **Consideration**: If Puppeteer proves too resource-intensive

### Option 2: Agora Cloud Recording (Keep Current)
- Keep existing solution
- Feature 011 becomes "infrastructure hardening" instead of "cost reduction"
- **Consideration**: If PoC budget allows $540/mois
      }, 1000 / 30);

      window.frameInterval = interval;
    });

    console.log('🎬 Frame capture started');
  }

  /**
   * Stop capturing and disconnect
   */
  async disconnect(): Promise<void> {
    console.log('🛑 Disconnecting RTC Bridge');

    if (this.page) {
      await this.page.evaluate(() => {
        if (window.frameInterval) clearInterval(window.frameInterval);
        if (window.agoraClient) window.agoraClient.leave();
      });
    }

    if (this.browser) {
      await this.browser.close();
    }

    this.browser = null;
    this.page = null;
    this.frameStream = null;

    console.log('✅ RTC Bridge disconnected');
  }
}
```

### Step 3: Update FFmpegManager to Use Bridge

**File**: `ffmpeg-worker/src/services/FFmpegManager.ts` (UPDATE)

```typescript
import { AgoraRTCBridge } from "./AgoraRTCBridge";

export class FFmpegManager {
  private rtcBridge: AgoraRTCBridge | null = null;

  async startStream(job: StreamJob): Promise<void> {
    // ... existing code ...

    // 1. Connect RTC Bridge
    this.rtcBridge = new AgoraRTCBridge();
    await this.rtcBridge.connect({
      appId: process.env.AGORA_APP_ID!,
      channelName: job.channelId.toString(),
      token: job.agoraToken, // From job payload
      workerUid: 999999,
    });

    // 2. Spawn FFmpeg with stdin
    const ffmpegProcess = spawn("ffmpeg", this.buildFFmpegArgs(job));

    // 3. Pipe frames from RTC bridge to FFmpeg stdin
    await this.rtcBridge.startFrameCapture(ffmpegProcess.stdin);

    // ... rest of existing code ...
  }

  async stopStream(channelId: number): Promise<void> {
    // Disconnect RTC bridge
    if (this.rtcBridge) {
      await this.rtcBridge.disconnect();
      this.rtcBridge = null;
    }

    // ... existing cleanup code ...
  }
}
```

### Step 4: Update Job Types

**File**: `ffmpeg-worker/src/types/index.ts` (UPDATE)

```typescript
export interface StreamJob {
  jobId: string;
  channelId: number;
  rtmpUrl: string; // Output (Cloudflare)
  agoraToken: string; // NEW - Agora RTC token for worker
  streamConfig: StreamConfig;
  createdAt: Date;
}
```

### Step 5: Update Backend to Include Token

**File**: `src/services/ffmpegRelayService.ts` (UPDATE)

```typescript
async startRelay(params: StartRelayParams): Promise<void> {
  // ... existing Cloudflare stream creation ...

  // Generate Agora token for worker (UID 999999, audience role)
  const agoraToken = this.generateAgoraToken(channelName, 999999, 'audience');

  // Enqueue job with token
  await this.ffmpegQueue.enqueueStreamJob({
    channelId,
    rtmpUrl: cloudflareRtmpsUrl,
    agoraToken,  // NEW - Include token for worker
    streamConfig: { ... },
  }) // Stdin (no data source ❌)

// After:
['-i', job.rtspInputUrl]  // RTSP pull from Agora ✅
```

### Step 4: Update Job Types

**File**: `ffmpeg-worker/src/types/index.ts` (UPDATE)

```typescript
export interface StreamJob {
  jobId: string;
  channelId: number;
  rtmpUrl: string; // Output (Cloudflare)
  rtspInputUrl: string; // NEW - Input (Agora Media Pull)
  streamConfig: StreamConfig;
  createdAt: Date;
}
```

---

## Tasks Breakdown

### Task 2.5.1: Research Agora Media Pull API ⏱️ 1h

- [x] Read Agora Media Pull documentation
- [ ] Test API with Postman/curl
- [ ] Verify RTSP output format compatibility with FFmpeg
- [ ] Check latency and quality

### Task 2.5.2: Implement AgoraMediaPullService ⏱️ 2h

- [ ] Create `src/services/agoraMediaPullService.ts`
- [ ] Implement `startMediaPull()` method
- [ ] Implement `stopMediaPull()` method
- [ ] Implement `getStatus()` method
- [ ] Add error handling and retries

### Task 2.5.3: Update FFmpegRelayService ⏱️ 1h

- [ ] Call `agoraMediaPullService.startMediaPull()` in `startRelay()`
- [ ] Update job payload with RTSP URL
- [ ] Call `stopMediaPull()` in `stopRelay()`
- [ ] Update error handling

### Task 2.5.4: Update Worker FFmpegManager ⏱️ 1h

- [ ] Update `buildFFmpegArgs()` to use RTSP input
- [ ] Remove stdin logic (`-i pipe:0`)
- [ ] Add RTSP-specific FFmpeg options (buffering, timeout)
- [ ] Test RTSP → RTMP transcoding locally

### Task 2.5.5: Update Types and Interfaces ⏱️ 30min

- [ ] Update `StreamJob` interface in both backend and worker
- [ ] Update database schema if needed
- [Technical Implementation Notes

### RGBA to YUV420p Conversion

FFmpeg expects YUV420p for video input. Canvas API provides RGBA.

**Conversion Algorithm** (simplified):

```javascript
function convertRGBAtoYUV420(rgba, width, height) {
  const ySize = width * height;
  const uvSize = (width / 2) * (height / 2);
  const yuv = new Uint8Array(ySize + uvSize * 2);

  // Y plane
  for (let i = 0; i < ySize; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    yuv[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // U and V planes (downsampled 2x2)
  // ... implementation details ...

  return yuv;
}
```

### Audio Extraction

Use Web Audio API to get raw PCM samples:

```javascript
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(
  audioTrack.getMediaStream(),
);
const processor = audioContext.createScriptProcessor(4096, 1, 1);

processor.onaudioprocess = (e) => {
  const samples = e.inputBuffer.getChannelData(0); // Float32Array
  const pcm16 = convertFloat32ToPCM16(samples);
  // Send to FFmpeg stdin
};
```

---

## Next Steps (After Completion)

Once Phase 2.5 is complete, proceed to:

- **Phase 3**: Local Docker testing with Puppeteer in container
- **Phase 4**: Deploy to Render (Pro plan for 4GB RAM)
- **Phase 5**: Add monitoring (CPU, RAM, Agora usage dashboard)
- **Phase 6**: Load testing and cost validation

---

## References

- [Agora Web SDK Documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk)
- [Puppeteer API](https://pptr.dev/)
- [Canvas API - drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [FFmpeg YUV420p Format](https://trac.ffmpeg.org/wiki/Encode/H.264#Chooseapresetandtune
- [ ] **Media Pull API Integration**
  - Backend can start/stop Agora Media Pull tasks
  - RTSP URL is returned and stored in job payload
- [ ] **FFmpeg RTSP Input**
  - Worker receives RTSP URL in job
  - FFmpeg successfully pulls RTSP stream
  - No more stdin errors
- [ ] **End-to-End Stream**
  - Seller publishes to Agora RTC
  - Agora converts to RTSP via Media Pull
  - FFmpeg worker pulls RTSP and pushes RTMP
  - Cloudflare receives RTMP and serves HLS
  - Buyer watches HLS stream with <10s latency
- [ ] **Error Handling**
  - Graceful handling if Media Pull fails
  - Cleanup on stream end (stop Media Pull task)
  - Retry logic for transient failures

---

## Risks & Mitigations

| Risk                                        | Probability | Impact | Mitigation                                                    |
| ------------------------------------------- | ----------- | ------ | ------------------------------------------------------------- |
| Agora Media Pull not available in free tier | Medium      | High   | Check pricing, consider fallback to Cloud Recording           |
| High latency (RTC → RTSP → RTMP → HLS)      | High        | Medium | Optimize FFmpeg settings, consider direct RTC → HLS if needed |
| RTSP compatibility issues with FFmpeg       | Low         | Medium | Test early, have fallback protocol (HLS input)                |
| Media Pull task limits                      | Medium      | Medium | Monitor quotas, implement task pooling                        |

---

## Alternative: Skip Media Pull, Use Cloud Recording

If Media Pull adds too much latency or complexity:

1. Keep Agora Cloud Recording (current system)
2. Use FFmpeg worker only for:
   - Quality optimization
   - Custom watermarking
   - VOD processing

**Trade-off**: Keeps Agora Recording costs, but simpler architecture.

---

## Next Steps (After Completion)

Once Phase 2.5 is complete, proceed to:

- **Phase 3**: Local Docker testing with full pipeline
- **Phase 4**: Deploy to Render with auto-scaling
- **Phase 5**: Add monitoring and alerts
- **Phase 6**: Load testing and production validation

---

## References

- [Agora Media Pull API Documentation](https://docs.agora.io/en/interactive-live-streaming/develop/media-pull)
- [FFmpeg RTSP Input](https://ffmpeg.org/ffmpeg-protocols.html#rtsp)
- [Agora Cloud Recording vs Media Pull Comparison](https://docs.agora.io/en/interactive-live-streaming/overview/product-overview)
