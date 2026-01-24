# Phase 1: Research & Architecture Design

## Objective

Research streaming platform options, design detailed system architecture, and validate technical feasibility of Agora → RTMP → HLS relay approach.

## User-Facing Changes

No user-facing changes in this phase. This is pure research and planning.

## Files to Update

### Documentation

- `features/010-hybrid-streaming-cost-optimization/summary.md` - Complete architecture documentation
- `features/010-hybrid-streaming-cost-optimization/phase-1-research-and-architecture.md` - This file
- `features/010-hybrid-streaming-cost-optimization/research-notes.md` - Detailed research findings
- `ARCHITECTURE.md` - Add hybrid streaming system overview

### Configuration (prep for future phases)

- `.env.example` - Add placeholders for streaming platform credentials

---

## Steps

### 1. Research Streaming Platform Options

#### A. Cloudflare Stream

- [x] Read official documentation: https://developers.cloudflare.com/stream/
- [ ] Test RTMP ingestion with sample stream
- [ ] Verify HLS output quality and latency
- [ ] Check pricing model: https://www.cloudflare.com/products/cloudflare-stream/pricing/
- [ ] Test free tier limits (1,000 minutes)
- [ ] Evaluate API capabilities (create stream, get playback URL, analytics)
- [ ] Check geographic availability and CDN edge locations

**Key Questions**:

- What's the actual latency for standard HLS vs LL-HLS?
- Does it support adaptive bitrate streaming?
- What's the max concurrent viewers per stream?
- What analytics are available (viewer count, bandwidth, etc.)?

#### B. AWS IVS (Interactive Video Service)

- [ ] Read official documentation: https://docs.aws.amazon.com/ivs/
- [ ] Test RTMP ingestion with sample stream
- [ ] Verify HLS output quality and latency
- [ ] Check pricing model: https://aws.amazon.com/ivs/pricing/
- [ ] Test Low-Latency HLS capabilities (target: 3-5s latency)
- [ ] Evaluate API capabilities (AWS SDK for IVS)
- [ ] Check CloudWatch integration for monitoring

**Key Questions**:

- What's the latency for standard vs low-latency HLS?
- How does auto-scaling work?
- What's the actual bandwidth cost (egress)?
- Can we get real-time viewer count?

#### C. Mux Video (Alternative)

- [ ] Read documentation: https://docs.mux.com/guides/video/start-live-streaming
- [ ] Check pricing: https://www.mux.com/pricing
- [ ] Evaluate if it offers advantages over Cloudflare/AWS

#### D. Decision Matrix

| Feature                | Cloudflare Stream  | AWS IVS         | Mux           |
| ---------------------- | ------------------ | --------------- | ------------- |
| **Cost (streaming)**   | $5/1000 mins       | $0.40/hour      | $10/1000 mins |
| **Cost (bandwidth)**   | Included           | $0.015/GB       | Included      |
| **Latency (standard)** | 15-30s             | 10-20s          | 15-30s        |
| **Latency (LL-HLS)**   | 8-12s              | 3-5s            | 6-10s         |
| **Setup complexity**   | Low                | Medium          | Low           |
| **Analytics**          | Basic              | Advanced        | Advanced      |
| **Free tier**          | 1000 mins          | None            | Trial         |
| **Geographic reach**   | Excellent (CF CDN) | Excellent (AWS) | Good          |
| **API quality**        | Good               | Excellent       | Excellent     |
| **Vendor lock-in**     | Medium             | Medium          | Medium        |

**Preliminary Recommendation**: ********\_******** (TBD after testing)

---

### 2. Design Relay Service Architecture

#### A. Technology Stack Research

**Option 1: FFmpeg-based Relay**

```typescript
// Pseudo-code
const ffmpeg = spawn("ffmpeg", [
  "-i",
  agoraStreamUrl,
  "-c:v",
  "libx264",
  "-c:a",
  "aac",
  "-f",
  "flv",
  rtmpPushUrl,
]);
```

**Pros**:

- ✅ Mature and battle-tested
- ✅ Highly configurable encoding
- ✅ Well-documented

**Cons**:

- ❌ CPU intensive
- ❌ Requires FFmpeg binary
- ❌ Process management complexity

**Option 2: Node.js WebRTC → RTMP Libraries**

- Research: `node-webrtc`, `wrtc`, `rtsp-ffmpeg`
- Evaluate: Can we capture Agora stream directly in Node.js?

**Option 3: Agora Cloud Recording → RTMP Forwarding**

- Research: Agora Cloud Recording API
- Check: Can we forward to custom RTMP endpoint?
- Latency: What's the added delay?

**Preliminary Choice**: ********\_******** (TBD after prototyping)

#### B. Relay Service Architecture

```
┌─────────────────────────────────────────┐
│     Relay Service (Node.js Process)     │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Agora Client Manager             │ │
│  │  - Join channel as viewer         │ │
│  │  - Subscribe to seller's stream   │ │
│  │  - Handle reconnections           │ │
│  └──────────────┬────────────────────┘ │
│                 │                       │
│                 ▼                       │
│  ┌───────────────────────────────────┐ │
│  │  Stream Buffer                    │ │
│  │  - Collect audio/video packets    │ │
│  │  - Synchronize A/V                │ │
│  └──────────────┬────────────────────┘ │
│                 │                       │
│                 ▼                       │
│  ┌───────────────────────────────────┐ │
│  │  FFmpeg Encoder                   │ │
│  │  - Encode to H.264 + AAC          │ │
│  │  - Target bitrate: 2-5 Mbps       │ │
│  │  - Resolution: 1080p or 720p      │ │
│  └──────────────┬────────────────────┘ │
│                 │                       │
│                 ▼                       │
│  ┌───────────────────────────────────┐ │
│  │  RTMP Pusher                      │ │
│  │  - Push to streaming platform     │ │
│  │  - Handle disconnections          │ │
│  │  - Retry logic                    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Health Monitor                   │ │
│  │  - Check CPU/memory usage         │ │
│  │  - Monitor bitrate                │ │
│  │  - Track viewer count             │ │
│  │  - Log errors                     │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### C. Deployment Architecture

**Option 1: Monolith (Same Server as Backend)**

- Pros: Simple deployment, no new infrastructure
- Cons: CPU heavy, may impact main app performance

**Option 2: Separate Relay Service**

- Pros: Isolated resource usage, scalable
- Cons: More infrastructure to manage

**Option 3: Serverless (AWS Lambda/Fargate)**

- Pros: Auto-scaling, pay-per-use
- Cons: Cold starts, FFmpeg binary size limits

**Preliminary Choice**: ********\_******** (TBD)

---

### 3. Cost Modeling & Projections

#### A. Calculate Current Costs (Agora Only)

**Scenario 1: Small Channel (10 buyers, 1 hour)**

- Seller: 1 user × $0.99/1000 mins = $0.06
- Buyers: 10 users × $0.99/1000 mins = $0.60
- **Total**: $0.66

**Scenario 2: Medium Channel (100 buyers, 1 hour)**

- Seller: $0.06
- Buyers: 100 × $0.06 = $6.00
- **Total**: $6.06

**Scenario 3: Large Channel (1,000 buyers, 1 hour)**

- Seller: $0.06
- Buyers: 1,000 × $0.06 = $60.00
- **Total**: $60.06

**Scenario 4: Monthly (10 channels, 3 hours each, avg 200 buyers)**

- Per channel: $0.18 (seller) + $36.00 (buyers) = $36.18
- 10 channels: $361.80
- **Monthly Total**: ~$360

#### B. Calculate Projected Costs (Hybrid)

**Fixed Costs per Month**:

- Relay server (if separate): $10-50/month (small VM)
- Streaming platform (Cloudflare example):
  - 30 hours streaming: 30 × $0.30 = $9
- **Base Fixed**: ~$20-60/month

**Variable Costs**:

- CDN bandwidth:
  - 1 hour @ 1080p ≈ 5 GB
  - 1,000 viewers × 5 GB = 5 TB (but CDN caching helps)
  - Actual: ~500 GB (cached) × $0.02/GB = $10
- Agora (relay viewer): 30 hours × $0.06 = $1.80

**Scenario 3 (Hybrid): Large Channel (1,000 buyers, 1 hour)**

- Seller (Agora): $0.06
- Relay (Agora): $0.06
- Streaming platform: $0.30
- CDN: ~$10 (500 GB)
- **Total**: ~$10.50 vs $60.06 (Agora only)
- **Savings**: 82%

**Scenario 4 (Hybrid): Monthly (10 channels, 3 hours, avg 200 buyers)**

- Seller (Agora): $0.18 × 10 = $1.80
- Relay (Agora): $0.18 × 10 = $1.80
- Streaming platform: $0.30 × 30 hours = $9.00
- CDN: ~$30-50 (varies by caching)
- Relay server: $20-50
- **Monthly Total**: ~$60-110 vs $360
- **Savings**: 70-83%

#### C. Break-Even Analysis

- **Fixed cost overhead**: ~$20-30/month (relay + streaming)
- **Variable cost per buyer-hour**:
  - Agora: $0.06
  - HLS: ~$0.001-0.005 (mostly CDN)
- **Break-even**: ~5-10 concurrent buyers per stream

**Conclusion**: Hybrid is cost-effective for any channel with >10 viewers

---

### 4. Prototype & Feasibility Testing

#### A. Local FFmpeg RTMP Test

```bash
# Test RTMP push to local server
docker run -p 1935:1935 -p 8080:8080 tiangolo/nginx-rtmp

# Push test video
ffmpeg -re -i test-video.mp4 \
  -c:v libx264 -preset veryfast -b:v 3000k \
  -c:a aac -b:a 128k \
  -f flv rtmp://localhost:1935/live/test
```

**Validation**:

- [ ] RTMP stream accepts connection
- [ ] Video plays back smoothly
- [ ] Latency measured (~5-10s for RTMP, 15-30s for HLS)

#### B. Agora SDK Audio/Video Capture Test

```typescript
// Test capturing Agora stream in Node.js
import AgoraRTC from "agora-rtc-sdk-ng";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
await client.join(appId, channelName, token, uid);

// Subscribe to remote stream
client.on("user-published", async (user, mediaType) => {
  await client.subscribe(user, mediaType);

  // Can we extract raw video/audio data?
  const videoTrack = user.videoTrack;
  const audioTrack = user.audioTrack;

  // TODO: Pipe to FFmpeg stdin
});
```

**Validation**:

- [ ] Can connect to Agora as viewer
- [ ] Can subscribe to seller's video/audio
- [ ] Can extract raw media data
- [ ] Can pipe to FFmpeg process

#### C. End-to-End Proof of Concept

```
Test Setup:
1. Local Agora test channel (seller publishes from mobile/web)
2. Node.js relay script joins as viewer
3. FFmpeg encodes and pushes to test RTMP server
4. HLS player loads the stream

Success Criteria:
- [ ] End-to-end latency <30 seconds
- [ ] Video quality acceptable (720p+)
- [ ] Audio/video sync maintained
- [ ] Stable for >5 minutes continuous streaming
```

---

### 5. Document Architecture Decisions

#### A. Create Architecture Diagram

- [ ] Create visual diagram (Excalidraw, Draw.io, or Mermaid)
- [ ] Show data flow from seller → Agora → relay → RTMP → HLS → buyers
- [ ] Include error paths and fallbacks
- [ ] Document in `summary.md`

#### B. Write Technical Spec

- [ ] Relay service API specification
- [ ] Error handling strategy
- [ ] Monitoring and alerting plan
- [ ] Scaling strategy (horizontal or vertical)
- [ ] Database schema changes (channel metadata)

#### C. Risk Assessment

- [ ] Identify single points of failure
- [ ] Document mitigation strategies
- [ ] Plan for graceful degradation
- [ ] Define rollback procedure

---

## Design Considerations

### 1. Latency Trade-offs

- **Agora WebRTC**: 1-3 seconds (seller experience - keep this)
- **RTMP**: 5-10 seconds (relay transmission)
- **HLS Standard**: 15-30 seconds (buyer experience - acceptable for shopping)
- **LL-HLS**: 3-8 seconds (premium option for future)

**Decision**: Accept 15-30s latency for buyers in exchange for 90% cost savings

### 2. Quality Settings

- **Resolution**: 1080p or 720p (configurable by seller)
- **Bitrate**: 2-5 Mbps (balance quality and bandwidth)
- **FPS**: 30 fps (standard for live shopping)
- **Audio**: 128 kbps AAC (clear voice quality)

### 3. Scalability Strategy

- **Single relay per channel**: Handles unlimited HLS viewers via CDN
- **Relay clustering**: If one relay server handles multiple channels
- **Auto-scaling**: Based on active channel count

### 4. Failure Modes & Recovery

#### Scenario 1: Relay Crashes

- **Detection**: Health check fails after 30s
- **Action**: Auto-restart relay process
- **Fallback**: Show "Reconnecting..." to buyers
- **Escalation**: Alert ops team if 3 restarts fail

#### Scenario 2: Seller Disconnects

- **Detection**: Agora "user-left" event
- **Action**: Stop relay, terminate RTMP push
- **Cleanup**: Mark channel as ended, archive metrics

#### Scenario 3: Streaming Platform Outage

- **Detection**: RTMP push fails with 5xx error
- **Action**: Log error, retry with exponential backoff
- **Fallback**: Display "Stream temporarily unavailable" to buyers
- **Escalation**: Switch to backup streaming platform (if configured)

#### Scenario 4: Network Congestion (Relay → RTMP)

- **Detection**: Bitrate drops below threshold
- **Action**: Reduce quality temporarily (720p → 480p)
- **Recovery**: Restore quality when network stabilizes

---

## Acceptance Criteria

- [x] Streaming platform selected (Cloudflare Stream vs AWS IVS)
- [ ] Cost model validated with real pricing data
- [ ] Prototype demonstrates feasibility:
  - [ ] Agora → FFmpeg → RTMP works
  - [ ] RTMP → HLS playback works
  - [ ] Latency acceptable (<30s)
  - [ ] Quality acceptable (720p+)
- [ ] Architecture diagram created and documented
- [ ] Technical spec written and reviewed
- [ ] Risks identified and mitigation planned
- [ ] Phase 2 ready to start (clear implementation plan)

---

## Testing Checklist

### Prototype Testing

- [ ] Local FFmpeg RTMP push successful
- [ ] Agora SDK can join channel as viewer
- [ ] Can capture Agora audio/video stream
- [ ] FFmpeg accepts piped input from Node.js
- [ ] HLS playback works in browser (Safari, Chrome, Firefox)
- [ ] Mobile playback tested (iOS Safari, Android Chrome)

### Cost Validation

- [ ] Cloudflare Stream pricing confirmed (test account)
- [ ] AWS IVS pricing confirmed (AWS calculator)
- [ ] CDN bandwidth costs validated
- [ ] Break-even analysis reviewed by stakeholders

### Architecture Review

- [ ] Technical lead approves architecture
- [ ] Security considerations reviewed (RTMP credentials, HLS signed URLs)
- [ ] Scalability plan validated
- [ ] Monitoring strategy approved

---

## Status

⏳ IN PROGRESS

## Notes

### Research Findings (TBD)

- Streaming platform choice: ******\_\_\_******
- Rationale: ******\_\_\_******
- Expected latency: ******\_\_\_******
- Expected cost savings: ******\_\_\_******

### Open Questions

1. Should we support multiple streaming platforms (multi-cloud)?
2. Do we need geo-distributed relay servers?
3. Should we offer buyer quality selection (auto, 1080p, 720p, 480p)?
4. Do we need DVR/rewind functionality?
5. Should VIP buyers get Agora access (premium tier)?

### Next Phase Prerequisites

- [ ] Streaming platform account created
- [ ] API credentials obtained
- [ ] Test RTMP endpoint available
- [ ] FFmpeg installed on development machine
- [ ] Agora test channel available
