# Feature 011: FFmpeg Worker Implementation - Summary

**Status**: ✅ Phase 2.5 Complete - End-to-End Streaming Working  
**Related ADR**: [ADR-001: Custom FFmpeg RTMP Relay](../../docs/adr/001-custom-ffmpeg-rtmp-relay.md)  
**Prerequisites**: [Dev-Quality Track 010: Docker Compose Architecture](../../dev-quality/010-docker-compose-architecture/summary.md) ✅  
**Created**: 2026-02-19  
**Phase 1 Completed**: 2026-02-19  
**Phase 2 Completed**: 2026-02-19 (including channelRouter integration)  
**Phase 2.5 Completed**: 2026-02-22 (video + audio streaming with MediaRecorder)  
**Estimated Duration**: 2-3 weeks

---

## Overview

Implement a custom FFmpeg-based RTMP relay service to replace Agora Cloud Recording, reducing costs by 76% and eliminating vendor lock-in. This leverages the Docker + Render infrastructure from dev-quality track 010.

**Current Solution** (Feature 010): Agora Cloud Recording → Cloudflare Stream

- Cost: ~$1.49/1000 minutes
- Limitation: Vendor-dependent, limited control

**New Solution** (Feature 011): Custom FFmpeg Worker → Cloudflare Stream

- Cost: Infrastructure only (~$85-127/month fixed)
- Benefit: Full control, scalable, Docker-native

---

## User Story

**As a platform operator**, I want to reduce streaming relay costs by running a custom FFmpeg worker instead of using Agora Cloud Recording, so that we can scale to hundreds of concurrent streams at predictable fixed costs.

**As a seller**, I continue using high-quality Agora RTC streaming with no changes to my experience.

**As a buyer**, I continue watching via HLS/CDN with the same quality and latency.

---

## Business Goal

- 💰 **Cost Reduction**: Eliminate Agora Cloud Recording costs ($540/month → infrastructure only)
- 📈 **Scalability**: Support 50-250+ concurrent streams on auto-scaling infrastructure
- 🎯 **Control**: Full ownership of conversion pipeline and quality settings
- 🚀 **Future-Proof**: Docker-based architecture ready for multi-region deployment
- 🔧 **Render-Native**: Leverages existing Docker Compose setup from dev-quality track 010

---

## Technical Architecture

```
┌─────────────┐
│   SELLER    │ (Agora WebRTC)
└──────┬──────┘
       │ Agora RTC SDK
       ▼
┌─────────────────────────┐
│  Agora Cloud Platform   │
└──────┬──────────────────┘
       │ RTC Frames
       ▼
┌──────────────────────────────────────────┐
│  Backend (whynot-backend container)      │
│  - Subscribes to seller RTC stream       │
│  - Receives audio/video frames           │
│  - Enqueues conversion job to Redis      │
└──────┬───────────────────────────────────┘
       │ Job: {channelId, rtmpUrl, token}
       ▼
┌──────────────────────────────────────────┐
│  Redis Queue (whynot-redis container)    │
│  - Job queue for FFmpeg tasks            │
│  - Handles retries and failures          │
└──────┬───────────────────────────────────┘
       │ Dequeue job
       ▼
┌──────────────────────────────────────────┐
│  FFmpeg Worker (NEW SERVICE)             │
│  - Node.js orchestrator                  │
│  - Spawns FFmpeg child processes         │
│  - One process per active stream         │
│  - Converts RTC → RTMP                   │
│  - Health checks & monitoring            │
└──────┬───────────────────────────────────┘
       │ RTMP Push
       ▼
┌──────────────────────────────────────────┐
│  Cloudflare Stream                       │
│  rtmps://live.cloudflare.com/...         │
└──────┬───────────────────────────────────┘
       │ HLS Distribution
       ▼
┌─────────────┐  ┌─────────────┐
│   BUYER 1   │  │   BUYER N   │
│ (HLS Player)│  │ (HLS Player)│
└─────────────┘  └─────────────┘
```

### Docker Compose Services

```yaml
services:
  backend: # Existing - minimal changes
  postgres: # Existing - no changes
  redis: # Existing - no changes
  ffmpeg-worker: # NEW SERVICE
```

### Render.com Deployment

```yaml
# render.yaml
services:
  - type: web
    name: whynot-backend
    plan: free # Existing service

  - type: worker
    name: whynot-ffmpeg
    plan: standard # NEW - $25/month minimum
    env: docker
    dockerfilePath: ./ffmpeg-worker/Dockerfile
    scaling:
      minInstances: 1
      maxInstances: 5 # Auto-scale with load

databases:
  - name: whynot-db # Existing
  - name: whynot-redis # Existing (upgrade to paid for production)
```

---

## Progress Tracking

| Phase     | Description                          | Est. Time | Status         |
| --------- | ------------------------------------ | --------- | -------------- |
| Phase 1   | FFmpeg Worker Service Setup          | 6-8h      | ✅ Complete    |
| Phase 2   | Backend RTC → Redis Integration      | 4-6h      | ✅ Complete    |
| Phase 2.5 | Agora RTC Bridge (Puppeteer)         | 8-10h     | 🔄 In Progress |
| Phase 3   | Local Docker Testing                 | 4-6h      | ⬜ Not Started |
| Phase 4   | Render Deployment & Scaling          | 6-8h      | ⬜ Not Started |
| Phase 5   | Monitoring, Alerts & Optimization    | 4-6h      | ⬜ Not Started |
| Phase 6   | Load Testing & Production Validation | 6-8h      | ⬜ Not Started |

**Total Estimated Time**: 38-52 hours (2.5-3.5 weeks part-time)  
**Started**: 2026-02-19  
**Phase 1 Completed**: 2026-02-19  
**Phase 2 Completed**: 2026-02-19  
**Phase 2.5 Started**: 2026-02-19

---

## Phase Breakdown

### Phase 1: FFmpeg Worker Service Setup (6-8h) ✅

**Goal**: Create standalone FFmpeg worker service with Docker container

**Status**: ✅ **COMPLETED** (2026-02-19)

**Deliverables**:

- ✅ `ffmpeg-worker/` directory structure (repository pattern)
- ✅ Dockerfile with FFmpeg Alpine
- ✅ Node.js orchestrator (`FFmpegManager`)
- ✅ Redis queue consumer (`RedisConsumer`)
- ✅ Health check API endpoints (`HealthController`)
- ✅ Process lifecycle management
- ✅ TypeScript compilation & build working
- ✅ Port 3001 (no conflict with main app on 3000)

**Architecture**: Refactored to follow main app repository pattern:

```
ffmpeg-worker/
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── src/
    ├── index.ts                        # Main entry point
    ├── config/
    │   └── index.ts                    # Configuration (port 3001)
    ├── controllers/
    │   └── healthController.ts         # HTTP endpoints
    ├── services/
    │   ├── FFmpegManager.ts            # Spawn/manage FFmpeg processes
    │   └── StreamService.ts            # Business logic layer
    ├── utils/
    │   └── redisConsumer.ts            # Pull jobs from Redis queue
    └── types/
        └── index.ts                    # TypeScript interfaces
```

**Acceptance Criteria**:

- [x] Dockerfile builds successfully
- [x] Can spawn FFmpeg process for test RTMP URL
- [x] Redis queue integration working
- [x] Health endpoints return 200 OK (`/health`, `/stats`, `/streams`)
- [x] Graceful shutdown on SIGTERM
- [x] TypeScript compiles with no errors
- [x] Worker runs on port 3001 without conflicts

**Test Results**:

```bash
# Health endpoint
curl http://localhost:3001/health
# → {"status":"healthy","uptime":135.4,"activeStreams":0,"maxStreams":10}

# Stats endpoint
curl http://localhost:3001/stats
# → {"activeStreams":0,"maxStreams":10,"utilization":0,"streams":[]}

# Service info
curl http://localhost:3001/
# → {"service":"whynot-ffmpeg-worker","version":"1.0.0","endpoints":[...]}
```

---

### Phase 2: Backend RTC → Redis Integration (4-6h) ✅

**Goal**: Connect backend to Agora RTC, pipe frames to FFmpeg via Redis

**Status**: ✅ **COMPLETED** (2026-02-19)

**Deliverables**:

- ✅ `FFmpegQueueService` - BullMQ integration for job management
- ✅ `FFmpegRelayService` - Orchestrates Cloudflare + Redis + Agora
- ✅ `relayRouter` - tRPC endpoints for FFmpeg relay
- ✅ Redis job enqueue logic with retry handling
- ✅ Stream lifecycle management (start/stop/status)

**Implemented Files**:

```
src/services/
├── ffmpegQueueService.ts     # NEW - BullMQ queue management
└── ffmpegRelayService.ts     # NEW - Orchestrates relay flow

src/routers/
├── relay.ts                  # NEW - FFmpeg relay endpoints
└── index.ts                  # UPDATED - Added relay router

package.json                  # UPDATED - Added bullmq, ioredis
```

**API Endpoints** (tRPC):

```typescript
// Start FFmpeg relay for a channel
relay.startFFmpeg({
  channelId: number,
  channelName: string,
  sellerUid: number,
});
// → { success: true, hlsPlaybackUrl: string, jobId: string }

// Stop FFmpeg relay
relay.stopFFmpeg({ channelId: number });
// → { success: true }

// Get relay status
relay.getFFmpegStatus({ channelId: number });
// → { channelId, relayStatus, hlsPlaybackUrl, hasActiveJob, activeJobs }
```

**Implementation Flow**:

1. **Frontend calls** `relay.startFFmpeg()`
2. **Backend**:
   - Creates Cloudflare Stream Live Input (RTMPS endpoint)
   - Generates Agora token for worker (audience role, UID 999999)
   - Enqueues job to Redis with: `{ channelId, rtmpUrl, agoraToken, agoraChannel, streamConfig }`
   - Updates DB: `relay_status = 'active'`
3. **FFmpeg Worker** (Phase 1):
   - Consumes job from Redis queue
   - Subscribes to Agora RTC stream as audience
   - Converts RTC frames → RTMP
   - Pushes to Cloudflare Stream
4. **Buyers** watch via HLS URL from Cloudflare

**Acceptance Criteria**:

- [x] Backend TypeScript compiles with no errors
- [x] BullMQ dependencies installed and configured
- [x] FFmpegQueueService can enqueue/remove jobs
- [x] FFmpegRelayService orchestrates full flow
- [x] tRPC endpoints exposed and type-safe
- [x] **ChannelRouter integrated** - `channel.create` now uses FFmpeg relay instead of Agora Media Push
- [x] **Backward compatibility** - `getStatus()` and `healthCheck()` methods implemented
- [ ] End-to-end test (Phase 3)

**Integration Notes**:

The `channelRouter` has been updated to use `FFmpegRelayService` instead of `HybridStreamingService`:

- ✅ `channel.create` → calls `ffmpegRelay.startRelay()`
- ✅ `channel.leave` (host) → calls `ffmpegRelay.stopRelay()`
- ✅ `channel.getStatus` → calls `ffmpegRelay.getStreamingStatus()`
- ✅ `channel.healthCheck` → calls `ffmpegRelay.healthCheck()`

**Next Steps**: Phase 2.5 - Implement Agora RTC Bridge in worker.

---

### Phase 2.5: Agora RTC Bridge in Worker - Puppeteer Approach (8-10h) ✅

**Goal**: Connect FFmpeg worker to Agora RTC using Puppeteer + Web SDK to receive live frames

**Status**: ✅ **COMPLETED** (2026-02-22)  
**Actual Duration**: 12 hours (including MediaRecorder pivot)

**Problem Solved**:

After Phase 2, FFmpeg stdin received no data because no component subscribed to Agora RTC frames.

**Solution Implemented - Puppeteer + MediaRecorder**:

1. ✅ Worker launches headless Chrome via Puppeteer
2. ✅ Loads `rtc-subscriber.html` with Agora Web SDK 4.20.0
3. ✅ Worker joins as audience (UID 999999) using Agora RTC **free tier**
4. ✅ **Video**: Canvas API captures frames @ 10 FPS → RGBA → YUV420p → FIFO → FFmpeg
5. ✅ **Audio**: MediaRecorder captures WebM/Opus → FIFO → FFmpeg (decodes Opus)
6. ✅ Named pipes (FIFOs) multiplex video + audio to FFmpeg dual inputs
7. ✅ FFmpeg encodes and pushes RTMP to Cloudflare
8. ✅ End-to-end working: Seller → Agora → Worker → FFmpeg → Cloudflare → Buyer

**Key Technical Decision - MediaRecorder vs ScriptProcessorNode**:

Initially attempted ScriptProcessorNode (Web Audio API) for PCM extraction, but it doesn't fire events in Puppeteer headless. Pivoted to MediaRecorder API which:

- ✅ Works perfectly in headless browsers
- ✅ Hardware-accelerated Opus encoding (lower CPU)
- ✅ Modern, stable API (ScriptProcessorNode is deprecated)
- ⚠️ Audio is Opus 128kbps (vs lossless PCM) but difference imperceptible

**Deliverables**:

- ✅ `ffmpeg-worker/public/rtc-subscriber.html` - Agora Web SDK + MediaRecorder
- ✅ `ffmpeg-worker/src/services/AgoraRTCBridge.ts` - Puppeteer + frame/audio capture
- ✅ `ffmpeg-worker/src/services/FFmpegManager.ts` - FIFO management + dual input
- ✅ `ffmpeg-worker/src/utils/frameConverter.ts` - RGBA→YUV420p conversion
- ✅ Backend generates Agora tokens (audience role, UID 999999)

**Performance Metrics (PoC Baseline)**:

| Metric             | Current            | Target (Phase 4) |
| ------------------ | ------------------ | ---------------- |
| Video Resolution   | 640×360            | 1280×720 (720p)  |
| Video FPS          | 10 FPS             | 30 FPS           |
| Audio Quality      | Opus 128kbps       | Opus 256kbps     |
| CPU Usage          | 80-100% per stream | 20-30% with GPU  |
| RAM Usage          | ~2.5GB per stream  | ~1GB             |
| End-to-end Latency | 8-12s              | 5-8s             |

**Known Limitations (PoC)**:

- ⚠️ **Low FPS**: 10 FPS due to `page.evaluate()` serialization bottleneck (0.9MB RGBA per frame)
- ⚠️ **Low Resolution**: 640×360 (sellers publish 720p but worker captures 360p)
- ⚠️ **High CPU**: 80-100% per stream (limits to ~3-5 concurrent streams per worker)
- ⚠️ **High RAM**: ~2.5GB per stream (Puppeteer + Chrome overhead)
- ✅ **Audio Quality**: Acceptable (Opus 128kbps imperceptible loss)

**Cost Analysis** (50 channels × 3h/day × 30d = 4,500 min/mois):

| Component                      | Cost/mois                    |
| ------------------------------ | ---------------------------- |
| Agora RTC (free tier <10K min) | $0                           |
| Render.com Pro (4GB RAM)       | $85                          |
| Redis                          | $10                          |
| **Total**                      | **$95**                      |
| **Savings vs current**         | **-$445 (82% reduction)** ✅ |

**Production Readiness**:

- ✅ **Functional**: Video + audio streaming works end-to-end
- ⚠️ **Scalable**: Limited to 3-5 streams per worker (CPU constraint)
- ✅ **Cost-Effective**: 82% cheaper than Agora Cloud Recording
- ⚠️ **Performance**: Acceptable for staging, needs GPU optimization for production
- 📋 **Next**: Deploy to Render staging → validate with real users → Phase 4 GPU optimization

- Worker RAM: 2GB → **4GB** (Puppeteer + Chrome)
- Worker vCPU: 1 → **2** (rendering + encoding)
- Render.com plan: Standard ($25) → **Pro ($85)**

**Revised Cost** (50 channels × 3h/day × 30d = 4,500 min/mois):

- Agora RTC: **$0** (free tier)
- FFmpeg Worker: **$85/mois** (Pro plan)
- Redis: **$10/mois**
- **Total: $95/mois** (vs $540 current = **82% savings** ✅)

**Acceptance Criteria**:

- [ ] Agora RTC connection established from worker
- [ ] Audio/video frames received from seller stream
- [ ] Frames successfully piped to FFmpeg stdin
- [ ] FFmpeg encodes and pushes to Cloudflare RTMP
- [ ] Buyer can watch HLS stream
- [ ] Graceful error handling (connection loss, seller leaves)
- [ ] Process cleanup on stream end

---

### Phase 3: Docker Containerization & Local Testing (2-3h)

**Goal**: Package FFmpeg worker into Docker container and validate locally

**Status**: ⬜ Not Started

**Why Docker First, GPU Later**:

- Get to production faster (Render.com in Phase 4)
- Validate containerization before GPU complexity
- CPU encoding acceptable for PoC (10 FPS @ 640×360)
- GPU optimization deferred to Phase 7

**Deliverables**:

- `ffmpeg-worker/Dockerfile` - Multi-stage build with FFmpeg + Chromium
- Updated `docker-compose.yml` with ffmpeg-worker service
- Health check endpoint (HTTP on port 3001)
- Local testing scripts

**Key Tasks**:

1. Create production Dockerfile (libx264 CPU encoding)
2. Install Chromium for Puppeteer
3. Add ffmpeg-worker to docker-compose
4. Test end-to-end streaming in Docker
5. Validate resource usage (CPU/RAM)

**Acceptance Criteria**:

- [ ] Dockerfile builds without errors (< 2GB image)
- [ ] `docker-compose up` starts all services
- [ ] FFmpeg worker connects to Redis
- [ ] Puppeteer can launch Chromium in container
- [ ] End-to-end streaming works (1 stream)
- [ ] Health check endpoint responds
- [ ] Graceful shutdown works
- [ ] CPU < 100% per stream, RAM < 3GB per stream

**Performance Baseline** (CPU encoding):

| Metric     | Expected | Notes                    |
| ---------- | -------- | ------------------------ |
| Resolution | 640×360  | Acceptable for PoC       |
| FPS        | 10 FPS   | Acceptable for PoC       |
| CPU/stream | 80-100%  | Limits to 3-5 concurrent |
| RAM/stream | 2-3GB    | Puppeteer overhead       |
| Image Size | ~1.5GB   | Multi-stage optimized    |

📄 **Detailed Plan**: [phase-3-docker-containerization.md](phase-3-docker-containerization.md)

---

### Phase 4: Render Deployment & Scaling (6-8h)

**Goal**: Deploy to Render, configure auto-scaling, verify production readiness

**Deliverables**:

- Updated `render.yaml` with ffmpeg-worker service
- Environment variables configured
- Auto-scaling rules defined
- Deployment guide updated

**Configuration**:

```yaml
# render.yaml additions
services:
  - type: worker
    name: whynot-ffmpeg
    env: docker
    dockerfilePath: ./ffmpeg-worker/Dockerfile
    plan: standard # 1 vCPU, 2GB RAM
    region: oregon
    scaling:
      minInstances: 1
      maxInstances: 5
      targetCPUPercent: 70
    envVars:
      - key: REDIS_URL
        fromService:
          type: redis
          name: whynot-redis
          property: connectionString
      - key: LOG_LEVEL
        value: info
```

**Acceptance Criteria**:

- [ ] FFmpeg worker deploys successfully to Render
- [ ] Worker connects to Redis
- [ ] Production test with 1 stream works
- [ ] Auto-scaling triggers at 70% CPU
- [ ] Health checks pass
- [ ] Logs visible in Render dashboard

---

### Phase 5: Monitoring, Alerts & Optimization (4-6h)

**Goal**: Production monitoring, alerting, performance tuning

**Deliverables**:

- Prometheus metrics endpoint
- Grafana dashboard (optional)
- Error alerting (email/Slack)
- Performance optimization

**Metrics to Track**:

- Active FFmpeg processes
- CPU/RAM per process
- RTMP push success rate
- Stream conversion latency
- Redis queue depth
- Failed job count

**Alerts**:

- FFmpeg process crash
- Redis queue > 10 jobs
- CPU > 90% for 5 minutes
- Worker offline

**Acceptance Criteria**:

- [ ] `/metrics` endpoint exposes Prometheus metrics
- [ ] Alerts configured in Render dashboard
- [ ] Documentation for interpreting metrics
- [ ] Performance tuning applied (bitrate, codec settings)

---

### Phase 6: Load Testing & Production Validation (6-8h)

**Goal**: Validate system handles expected load, create runbooks

**Test Plan**:

1. **Light load**: 10 concurrent streams for 30 minutes
2. **Medium load**: 25 concurrent streams for 1 hour
3. **Heavy load**: 50 concurrent streams for 30 minutes
4. **Spike test**: 0 → 30 → 0 streams in 10 minutes
5. **Endurance test**: 10 streams for 6 hours

**Deliverables**:

- Load testing results document
- Incident response runbook
- Cost analysis vs Agora Cloud Recording
- Migration plan from Feature 010

**Acceptance Criteria**:

- [ ] System handles 50 concurrent streams without crashes
- [ ] Latency < 5s for RTC → RTMP conversion
- [ ] Zero data loss during scaling events
- [ ] Cost validated: < $150/month for 50 streams
- [ ] Runbook covers: crashes, high CPU, Redis failure, Render outage

---

### Phase 7: GPU Optimization & AWS EC2 Deployment (6-8h) 🎮

**Goal**: Optimize streaming performance with GPU hardware acceleration

**Status**: ⬜ Not Started (Optional - After Phase 6 Production Validation)

**Why GPU Acceleration**:

After validating the system works with CPU encoding (Phases 1-6), optimize for production-grade quality:

- ✅ **720p @ 30 FPS** (vs 360p @ 10 FPS on CPU)
- ✅ **20-30% CPU usage** (vs 80-100% on CPU)
- ✅ **More streams per instance** (10-15 vs 3-5)
- ⚠️ Requires AWS EC2 g4dn instances (more complex infrastructure)

**Target Infrastructure**:

- **AWS EC2 g4dn.xlarge**: 4 vCPU, 16GB RAM, NVIDIA Tesla T4 GPU
- **Cost**: ~$0.526/hour = ~$380/month per instance (vs $85 Render)
- **Break-even**: Need 40+ concurrent streams to justify GPU cost

**Deliverables**:

- Multi-architecture Dockerfile (GPU + CPU fallback)
- FFmpeg NVENC encoder configuration (h264_nvenc)
- Auto-detect GPU availability at runtime
- AWS EC2 deployment scripts
- Performance benchmarks (GPU vs CPU)

**Key Tasks**:

1. **Dockerfile with NVIDIA CUDA** (nvidia/cuda:12.0 base image)
2. **FFmpeg with NVENC support** (hardware-accelerated H.264)
3. **Auto-detect GPU/CPU** and choose codec dynamically
4. **AWS EC2 setup** (g4dn.xlarge + NVIDIA drivers)
5. **Deploy and benchmark** (compare 720p@30fps vs 360p@10fps)
6. **Cost analysis** (GPU vs CPU scaling)

**Acceptance Criteria**:

- [ ] Dockerfile builds with GPU and CPU support
- [ ] FFmpeg uses h264_nvenc when GPU available
- [ ] Gracefully falls back to libx264 without GPU
- [ ] Deploy to AWS EC2 g4dn.xlarge successfully
- [ ] Achieve 720p @ 30 FPS with < 30% CPU usage
- [ ] 10+ concurrent streams per GPU instance
- [ ] Cost analysis: GPU economical at 40+ streams

**Performance Target** (GPU encoding):

| Metric           | CPU (Phase 3-6) | GPU (Phase 7) | Improvement   |
| ---------------- | --------------- | ------------- | ------------- |
| Resolution       | 640×360         | 1280×720      | 4x pixels     |
| FPS              | 10 FPS          | 30 FPS        | 3x smoother   |
| CPU/stream       | 80-100%         | 20-30%        | 70% reduction |
| Streams/instance | 3-5             | 10-15         | 3x capacity   |
| Quality          | Acceptable      | Production    | ✨            |

📄 **Detailed Plan**: [phase-7-gpu-optimization-aws-ec2.md](phase-7-gpu-optimization-aws-ec2.md)

**Note**: This phase is optional. Run CPU-based solution (Phases 1-6) in production first, then optimize with GPU only if:

- Stream volume > 40 concurrent channels
- Users complain about video quality
- ROI justifies infrastructure complexity

---

## Cost Analysis

### Infrastructure Costs (Render.com)

| Service          | Plan    | vCPU | RAM   | Cost/month | Notes                    |
| ---------------- | ------- | ---- | ----- | ---------- | ------------------------ |
| Backend          | Free    | 0.5  | 512MB | $0         | No changes               |
| FFmpeg Worker    | Pro     | 2    | 4GB   | $85        | NEW (Puppeteer + FFmpeg) |
| PostgreSQL       | Free    | -    | 1GB   | $0         | No changes               |
| Redis            | Starter | -    | 256MB | $10        | Upgrade from free        |
| **Total (Base)** |         |      |       | **$95**    |                          |

**Auto-Scaling** (if needed):

- 2 workers: $170/month (20-40 streams)
- 3 workers: $255/month (30-60 streams)
- 5 workers: $425/month (50-100 streams)

### Comparison vs Feature 010 (Agora Cloud Recording)

**Scenario**: 50 sellers × 3 hours/day × 30 days = 4,500 streaming minutes/month

| Solution                                   | Cost/month | Break-even |
| ------------------------------------------ | ---------- | ---------- |
| **Feature 010**: Agora Cloud Recording     | $540       | N/A        |
| **Feature 011**: FFmpeg Worker (1 worker)  | $95        | Immediate  |
| **Feature 011**: FFmpeg Worker (3 workers) | $255       | Immediate  |
| **Feature 011**: FFmpeg Worker (5 workers) | $425       | Immediate  |

**Savings**: **$115-445/month** (21-82% cost reduction)

**ROI**: Pays for ~1-2 weeks of development time in first month

**Note**:

- Uses Agora RTC free tier (<10,000 min/mois) for worker subscription
- If exceeding 10K free tier, add ~$0.99/1000 min for overage
- Worker = 1 additional RTC participant per channel (seller + worker = 2 total)

| ---                                        | Solution | Cost/month | Break-even |
| ------------------------------------------ | -------- | ---------- | ---------- |
| **Feature 010**: Agora Cloud Recording     | $540     | N/A        |
| **Feature 011**: FFmpeg Worker (1 worker)  | $95      | Immediate  |
| **Feature 011**: FFmpeg Worker (3 workers) | $255     | Immediate  |
| **Feature 011**: FFmpeg Worker (5 workers) | $425     | Immediate  |

**Savings**: **$115-445/month** (21-82% cost reduction)

**Note**: Uses Agora RTC free tier (<10K min/mois). If exceeding free tier, add ~$0.99/1000 min for overage.

**ROI**: Pays for ~1.5 weeks of development time in first month

---

## Migration Strategy

### Parallel Run (Recommended)

**Phase 1**: Deploy FFmpeg worker, test with 10% of channels
**Phase 2**: Gradually increase to 50% of channels
**Phase 3**: Monitor for 2 weeks, compare metrics
**Phase 4**: Full migration to FFmpeg (100% channels)
**Phase 5**: Disable Agora Cloud Recording

**Timeline**: 4-6 weeks

**Rollback**: Feature flag to revert to Agora Cloud Recording

### Feature Flag

```typescript
// src/config/features.ts
export const USE_FFMPEG_RELAY = process.env.USE_FFMPEG_RELAY === "true";

// src/services/RelayService.ts
if (USE_FFMPEG_RELAY) {
  await rtcToRTMPBridge.start(channelId);
} else {
  await agoraCloudRecording.start(channelId);
}
```

---

## Success Metrics

**Performance**:

- [ ] Conversion latency < 5s (RTC → RTMP)
- [ ] Stream success rate > 99%
- [ ] Worker uptime > 99.5%
- [ ] CPU usage < 80% average

**Cost**:

- [ ] Infrastructure cost < $150/month for 50 streams
- [ ] 75%+ savings vs Agora Cloud Recording

**Reliability**:

- [ ] < 5 critical bugs in first month
- [ ] Zero data loss incidents
- [ ] Recovery time < 2 minutes for crashes

**Review Period**: 60 days after production deployment

---

## Risks & Mitigations

| Risk                   | Impact | Probability | Mitigation                                       |
| ---------------------- | ------ | ----------- | ------------------------------------------------ |
| FFmpeg process crashes | High   | Medium      | Auto-restart, health checks, dead-letter queue   |
| Redis queue overflow   | High   | Low         | Job TTL, queue size limits, alerting             |
| Worker CPU bottleneck  | Medium | Medium      | Auto-scaling, resource monitoring                |
| Render.com outage      | High   | Low         | Fallback to Agora Cloud Recording (feature flag) |
| Memory leaks           | Medium | Medium      | Periodic process restart, memory monitoring      |
| RTMP auth failures     | Medium | Low         | Retry logic, Cloudflare credential rotation      |

---

## Dependencies

### Infrastructure (from dev-quality track 010)

- ✅ Docker Compose architecture
- ✅ Render.com deployment pipeline
- ✅ Redis integration
- ✅ PostgreSQL database

### External Services

- ✅ Agora RTC SDK (server-side)
- ✅ Cloudflare Stream account
- ⬜ FFmpeg Alpine Docker image
- ⬜ Redis queue library (BullMQ or similar)

### Team Skills

- ✅ Docker & Docker Compose
- ✅ Node.js/TypeScript
- ⬜ FFmpeg command-line usage
- ⬜ Process management (spawn, IPC)
- ⬜ Redis queue patterns

---

## Documentation Deliverables

- [ ] `ffmpeg-worker/README.md` - Worker service documentation
- [ ] `docs/FFMPEG_RELAY.md` - Architecture & troubleshooting
- [ ] `RENDER_DEPLOYMENT.md` - Update with FFmpeg worker setup
- [ ] `DOCKER.md` - Update with 4-service architecture
- [ ] Runbook: FFmpeg worker incidents & recovery

---

## Next Steps

1. ✅ Review and approve this feature plan
2. ✅ Create Phase 1 detailed implementation plan
3. ✅ Set up `ffmpeg-worker/` directory structure
4. ✅ Create Dockerfile with FFmpeg installation
5. 🔄 **IN PROGRESS**: Phase 1 development (Tasks 1.1-1.7 complete)
6. ⬜ Complete Phase 1 acceptance testing

---

**Status**: 🔄 Phase 1 in progress - Core structure complete, testing pending

**Questions for Review**:

1. Approved timeline (2-3 weeks)?
2. Approved Render plan budget ($35-125/month)?
3. Migration strategy (parallel run vs big bang)?
4. Rollback plan acceptable (feature flag)?
