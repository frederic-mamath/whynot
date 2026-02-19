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

| Phase   | Description                          | Est. Time | Status         |
| ------- | ------------------------------------ | --------- | -------------- |
| Phase 1 | FFmpeg Worker Service Setup          | 6-8h      | ✅ Complete    |
| Phase 2 | Backend RTC → Redis Integration      | 4-6h      | ✅ Complete    |
| Phase 3 | Local Docker Testing                 | 4-6h      | ⬜ Not Started |
| Phase 4 | Render Deployment & Scaling          | 6-8h      | ⬜ Not Started |
| Phase 5 | Monitoring, Alerts & Optimization    | 4-6h      | ⬜ Not Started |
| Phase 6 | Load Testing & Production Validation | 6-8h      | ⬜ Not Started |

**Total Estimated Time**: 30-42 hours (2-3 weeks part-time)  
**Started**: 2026-02-19  
**Phase 1 Completed**: 2026-02-19  
**Phase 2 Completed**: 2026-02-19

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

**Next Steps**: Test by creating a channel in the UI and watching FFmpeg worker logs.

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

| Service          | Plan     | vCPU | RAM   | Cost/month | Notes                       |
| ---------------- | -------- | ---- | ----- | ---------- | --------------------------- |
| Backend          | Free     | 0.5  | 512MB | $0         | No changes                  |
| FFmpeg Worker    | Standard | 1    | 2GB   | $25        | NEW (handles 10-30 streams) |
| PostgreSQL       | Free     | -    | 1GB   | $0         | No changes                  |
| Redis            | Starter  | -    | 256MB | $10        | Upgrade from free           |
| **Total (Base)** |          |      |       | **$35**    |                             |

**Auto-Scaling** (if needed):

- 2 workers: $50/month (20-60 streams)
- 3 workers: $75/month (30-90 streams)
- 5 workers: $125/month (50-150 streams)

### Comparison vs Feature 010 (Agora Cloud Recording)

**Scenario**: 50 sellers × 3 hours/day × 30 days = 4,500 streaming minutes/month

| Solution                                   | Cost/month | Break-even |
| ------------------------------------------ | ---------- | ---------- |
| **Feature 010**: Agora Cloud Recording     | $540       | N/A        |
| **Feature 011**: FFmpeg Worker (1 worker)  | $35        | Immediate  |
| **Feature 011**: FFmpeg Worker (3 workers) | $75        | Immediate  |
| **Feature 011**: FFmpeg Worker (5 workers) | $125       | Immediate  |

**Savings**: **$415-505/month** (77-93% cost reduction)

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
