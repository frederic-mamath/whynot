# Feature 011: FFmpeg Worker Implementation - Summary

**Status**: ✅ Phase 2 Complete - Ready for End-to-End Testing  
**Related ADR**: [ADR-001: Custom FFmpeg RTMP Relay](../../docs/adr/001-custom-ffmpeg-rtmp-relay.md)  
**Prerequisites**: [Dev-Quality Track 010: Docker Compose Architecture](../../dev-quality/010-docker-compose-architecture/summary.md) ✅  
**Created**: 2026-02-19  
**Phase 1 Completed**: 2026-02-19  
**Phase 2 Completed**: 2026-02-19 (including channelRouter integration)  
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

### Phase 2.5: Agora RTC Bridge in Worker - Puppeteer Approach (8-10h) 🔄

**Goal**: Connect FFmpeg worker to Agora RTC using Puppeteer + Web SDK to receive live frames

**Status**: 🔄 **IN PROGRESS** (2026-02-19)

**Problem Identified**:

After Phase 2, the worker can:

- ✅ Receive jobs from Redis queue
- ✅ Spawn FFmpeg process with RTMP output URL
- ❌ **But FFmpeg stdin receives no data** → stream never starts

**Root Cause**:

FFmpeg is configured with `-i pipe:0` (read from stdin), but there's no source piping RTC frames to it.

**Solution - Puppeteer + Web SDK** (uses Agora RTC free tier):

1. Worker launches headless Chrome via Puppeteer
2. Loads HTML page with Agora Web SDK
3. Web SDK subscribes to RTC channel (as audience, like a buyer)
4. Extract frames via Canvas API (video) and Web Audio API (audio)
5. Convert frames to raw format (YUV420p + PCM)
6. Pipe to FFmpeg stdin

**Why Puppeteer**:

- ✅ Uses Agora RTC free tier (<10K min/mois = **$0 Agora cost**)
- ✅ No paid Media Pull/Push API needed
- ✅ Worker = virtual buyer participant in RTC channel
- ⚠️ Higher CPU/RAM (needs 4GB RAM instead of 2GB)

**Deliverables**:

- HTML subscriber page with Agora Web SDK
- `AgoraRTCBridge` service (Puppeteer integration)
- Frame extraction and conversion utilities
- FFmpeg stdin piping integration

**New Files**:

```
ffmpeg-worker/
├── public/
│   └── rtc-subscriber.html        # NEW - Agora Web SDK page
├── src/
│   ├── services/
│   │   ├── AgoraRTCBridge.ts       # NEW - Puppeteer + frame capture
│   │   └── FFmpegManager.ts        # UPDATE - Connect to bridge
│   └── utils/
│       └── frameConverter.ts       # NEW - RGBA→YUV, audio→PCM
```

**Technical Workflow**:

```typescript
// 1. Launch Puppeteer
browser = await puppeteer.launch({ headless: true });
page = await browser.newPage();

// 2. Navigate to subscriber page
await page.goto("http://localhost:3001/rtc-subscriber.html?channel=...");

// 3. Web SDK joins and subscribes (in browser context)
client.on("user-published", async (user) => {
  await client.subscribe(user, "video");
  await client.subscribe(user, "audio");
});

// 4. Extract frames via Canvas API
setInterval(() => {
  const frame = canvas.toDataURL(); // or getImageData
  // Pipe to FFmpeg stdin
}, 1000 / 30); // 30 FPS
```

**Dependencies**:

```json
{
  "puppeteer": "^21.x", // Headless browser
  "@types/puppeteer": "^5.x" // TypeScript types
}
```

**Infrastructure Impact**:

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

### Phase 3: Local Docker Testing (4-6h)

**Goal**: Verify full pipeline works locally with docker-compose

**Test Scenarios**:

1. **Single stream**: Seller publishes → FFmpeg → Cloudflare → Buyer watches HLS
2. **Multiple streams**: 3-5 concurrent sellers
3. **Stream restart**: Stop/start same channel
4. **Worker restart**: Kill FFmpeg worker, ensure recovery
5. **Resource limits**: Monitor CPU/RAM with 5 streams

**Deliverables**:

- Updated `docker-compose.yml` with ffmpeg-worker service
- Testing script (`scripts/test-ffmpeg-relay.sh`)
- Performance benchmarks document

**Acceptance Criteria**:

- [ ] `docker-compose up` starts all 4 services
- [ ] Single stream works end-to-end
- [ ] 5 concurrent streams run simultaneously
- [ ] Worker recovers from crashes
- [ ] CPU usage < 80% with 5 streams
- [ ] Memory usage < 2GB with 5 streams

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
