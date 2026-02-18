# ADR-001: Custom FFmpeg RTMP Relay Architecture

**Status**: ✅ Accepted  
**Date**: 2026-02-18  
**Technical Lead**: Frederic Mamath  
**Related PDR**: [PDR-001](../pdr/001-buyer-viewing-experience-hls-vs-rtc.md)

---

## Context

Following [PDR-001](../pdr/001-buyer-viewing-experience-hls-vs-rtc.md), we decided to use HLS for buyers to reduce costs by 89-99%. This requires converting seller RTC streams to RTMP for Cloudflare Stream.

### The Problem

**Agora RTMP Converter** (Media Push API) returns `403 Forbidden - "No invalid permission to use this function"`. After 2 weeks without response from Agora support, we need an alternative solution.

### Technical Requirements

1. Receive RTC stream from Agora (seller's video/audio)
2. Convert RTC → RTMP in real-time
3. Push RTMP to Cloudflare Stream
4. Support multiple concurrent streams (5-500 sellers)
5. Low latency conversion (< 5s overhead)
6. Cost-effective at scale
7. Deployable to production (Heroku or alternative)

### Strategic Decision

**Avoid vendor lock-in**: Build a custom FFmpeg-based solution to maintain control over critical infrastructure and reduce dependency on third-party API availability.

---

## Decision

**Build a custom FFmpeg-based RTMP relay service using Docker containers and a job queue architecture.**

### Architecture

```
┌─────────────┐
│   SELLER    │ Publishes RTC stream
│  (Browser)  │
└──────┬──────┘
       │ Agora RTC SDK
       ▼
┌─────────────────────┐
│  Agora RTC Server   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Backend (Express)  │ Subscribes to seller stream
│  - tRPC API         │ Creates conversion job
│  - Agora RTC SDK    │
└──────┬──────────────┘
       │ Enqueue job
       ▼
┌─────────────────────┐
│   Redis Queue       │ Job: {channelId, rtmpUrl, agoraToken}
└──────┬──────────────┘
       │ Dequeue
       ▼
┌─────────────────────┐
│ FFmpeg Worker Pool  │ Shared container
│ - Consumes jobs     │ Runs multiple FFmpeg processes
│ - Manages FFmpeg    │ One process per stream
│ - Health checks     │
└──────┬──────────────┘
       │ RTMP Push
       ▼
┌─────────────────────┐
│ Cloudflare Stream   │
│ rtmps://live...     │
└──────┬──────────────┘
       │ HLS
       ▼
┌─────────────────────┐
│   BUYERS (Browser)  │ HLS.js player
└─────────────────────┘
```

### Components

**1. Backend Service (Express + tRPC)**

- Uses Agora RTC SDK (server-side) to subscribe to seller's stream
- Receives RTC audio/video frames
- Pipes frames to FFmpeg worker via Redis job queue
- Manages stream lifecycle (start/stop)

**2. Redis Queue**

- Job queue for FFmpeg tasks
- Stores: `{channelId, rtmpUrl, agoraToken, status}`
- Handles worker failures (retry mechanism)

**3. FFmpeg Worker Pool (Docker)**

- **Shared container** running Node.js orchestrator
- Spawns FFmpeg child processes (one per stream)
- Receives RTC frames from backend (via Redis or direct pipe)
- Converts to RTMP and pushes to Cloudflare
- Monitors process health, handles crashes

**4. Docker Compose (Local Dev)**

```yaml
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - AGORA_APP_ID
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
      - ffmpeg-worker

  postgres:
    image: postgres:15
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  ffmpeg-worker:
    build: ./ffmpeg-worker
    ports:
      - "8080:8080" # Health check API
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
```

---

## Alternatives Considered

### Alternative 1: Agora RTMP Converter (Original Plan)

**Pros**:

- ✅ Fully managed (no infrastructure)
- ✅ Proven reliability
- ✅ Auto-scaling built-in
- ✅ Simple API integration

**Cons**:

- ❌ **403 Forbidden error** - feature not available
- ❌ Vendor lock-in (dependent on Agora activation)
- ❌ Limited control over conversion quality
- ❌ Cost: ~$2/1000 minutes

**Verdict**: Blocked by account permissions. Agora support unresponsive after 2 weeks.

---

### Alternative 2: Mux Live

Third-party service providing RTC → HLS conversion.

**Cost**: $0.015/minute = **$15/1000 minutes**

**Pros**:

- ✅ Simple API (similar to Agora)
- ✅ Managed infrastructure
- ✅ Good documentation

**Cons**:

- ❌ **7.5x more expensive** than Agora RTMP Converter
- ❌ Still vendor lock-in
- ❌ Need to redesign backend (different SDK)

**Monthly Cost Comparison (50 sellers × 3h/day)**:

- Agora RTMP: $540/month
- Mux Live: **$4,050/month**
- **Difference**: +$3,510/month

**Verdict**: Too expensive for MVP/PoC.

---

### Alternative 3: AWS MediaLive

AWS managed live streaming service.

**Cost**: ~$2.40/hour per stream = **$144/1000 minutes**

**Pros**:

- ✅ Enterprise-grade reliability
- ✅ Auto-scaling
- ✅ Integrated with AWS ecosystem

**Cons**:

- ❌ **72x more expensive** than Agora RTMP Converter
- ❌ Complex setup (channels, inputs, outputs)
- ❌ AWS lock-in

**Monthly Cost (50 sellers × 3h/day)**:

- AWS MediaLive: **$10,800/month**
- **Verdict**: Prohibitively expensive.

---

### Alternative 4: Container Per Stream

Run one Docker container per active stream (instead of shared pool).

**Pros**:

- ✅ Complete isolation (one stream failure doesn't affect others)
- ✅ Easier to debug/monitor per stream
- ✅ Simple orchestration (start container = start stream)

**Cons**:

- ❌ **High memory overhead** (~200MB per container)
- ❌ Slow startup time (2-5s to spin up container)
- ❌ Limited scalability on single server
- ❌ More expensive on cloud (Render charges per container)

**Complexity**: Low (simple Docker lifecycle)

**Cost Implications**:

```
Memory usage:
- Shared pool: 1 container × 500MB = 500MB base + (10MB × streams)
- Per-stream: 50 streams × 200MB = 10GB memory

Render.com cost:
- Shared pool: 1 × Standard ($25/month) = $25/month
- Per-stream: 50 × Starter ($7/month) = $350/month
```

**Verdict**: Container-per-stream is 14x more expensive. Not suitable for scale.

---

### Alternative 5: Custom FFmpeg Pool (CHOSEN)

**Shared container** running Node.js orchestrator that spawns FFmpeg child processes.

**Pros**:

- ✅ **Cost-effective**: 1 container handles 50+ streams
- ✅ Full control over conversion pipeline
- ✅ No vendor lock-in
- ✅ Customizable quality/bitrate settings
- ✅ Can optimize for our specific use case

**Cons**:

- ❌ **Higher complexity**: Need to build orchestration layer
- ❌ Responsibility for monitoring/debugging
- ❌ Infrastructure maintenance burden
- ❌ Development time: ~2-3 weeks

**Cost**:

- Development: 2-3 weeks (one-time)
- Hosting: $25-85/month (Render Standard/Pro plan)
- **Ongoing**: ~$0.00 per stream (just server cost)

**Complexity Analysis**:

| Aspect             | Complexity | Mitigation                                     |
| ------------------ | ---------- | ---------------------------------------------- |
| Process Management | Medium     | Use `child_process` with graceful shutdown     |
| Inter-Process Comm | Medium     | Redis Queue + Pub/Sub for status updates       |
| Error Handling     | High       | Implement retry logic, dead-letter queue       |
| Monitoring         | Medium     | Prometheus metrics, health check API           |
| Scaling            | Medium     | Horizontal scaling (multiple worker instances) |
| Memory Leaks       | Medium     | Process restart after N streams                |

**Verdict**: Best balance of cost, control, and scalability. Acceptable complexity for strategic infrastructure.

---

## Implementation Details

### 1. Backend Integration (Express + tRPC)

**New file**: `src/services/rtcToRtmpBridge.ts`

```typescript
import AgoraRTC from "agora-rtc-sdk-ng";
import { createClient as createRedisClient } from "redis";

export class RTCToRTMPBridge {
  private agoraClient: typeof AgoraRTC;
  private redis: ReturnType<typeof createRedisClient>;

  async startRelay(channelId: number, channelName: string, rtmpUrl: string) {
    // 1. Join Agora channel as subscriber
    const uid = `relay-${channelId}`;
    await this.agoraClient.join(appId, channelName, token, uid);

    // 2. Subscribe to seller's audio/video
    const seller = await this.waitForSeller(channelName);
    await this.agoraClient.subscribe(seller, "video");
    await this.agoraClient.subscribe(seller, "audio");

    // 3. Enqueue FFmpeg job
    await this.redis.lPush(
      "ffmpeg:jobs",
      JSON.stringify({
        channelId,
        channelName,
        rtmpUrl,
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    // 4. Stream frames to FFmpeg worker (via Redis Streams or WebRTC)
    this.pipeToFFmpeg(channelId, seller);
  }

  private pipeToFFmpeg(channelId: number, track: MediaStreamTrack) {
    // Implementation: Push RTC frames to FFmpeg
    // Option A: WebRTC peer connection to FFmpeg container
    // Option B: Encode frames, push to Redis Stream
  }
}
```

### 2. FFmpeg Worker (Node.js + Docker)

**New service**: `ffmpeg-worker/`

```
ffmpeg-worker/
├── Dockerfile
├── package.json
├── src/
│   ├── index.ts           # Main worker loop
│   ├── ffmpegManager.ts   # Spawn/manage FFmpeg processes
│   ├── healthCheck.ts     # HTTP server for /health
│   └── redis.ts           # Queue consumer
```

**`ffmpeg-worker/src/ffmpegManager.ts`**:

```typescript
import { spawn } from "child_process";

export class FFmpegManager {
  private processes = new Map<number, ChildProcess>();

  startStream(channelId: number, rtmpUrl: string) {
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-f",
        "rawvideo",
        "-pixel_format",
        "yuv420p",
        "-video_size",
        "1280x720",
        "-framerate",
        "30",
        "-i",
        "pipe:0", // Read video from stdin
        "-f",
        "s16le",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-i",
        "pipe:3", // Read audio from fd 3
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-tune",
        "zerolatency",
        "-b:v",
        "2500k",
        "-maxrate",
        "2500k",
        "-bufsize",
        "5000k",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-f",
        "flv",
        rtmpUrl,
      ],
      {
        stdio: ["pipe", "pipe", "pipe", "pipe"],
      },
    );

    this.processes.set(channelId, ffmpeg);

    ffmpeg.on("error", (err) => {
      console.error(`FFmpeg error for channel ${channelId}:`, err);
      this.retry(channelId, rtmpUrl);
    });

    return ffmpeg;
  }

  stopStream(channelId: number) {
    const proc = this.processes.get(channelId);
    if (proc) {
      proc.kill("SIGTERM");
      this.processes.delete(channelId);
    }
  }
}
```

**`ffmpeg-worker/Dockerfile`**:

```dockerfile
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 8080

CMD ["node", "dist/index.js"]
```

### 3. Docker Compose (Local Development)

**`docker-compose.yml`**:

```yaml
version: "3.8"

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - AGORA_APP_ID=${AGORA_APP_ID}
      - AGORA_CERTIFICATE=${AGORA_CERTIFICATE}
      - CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
      - CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/whynot
    depends_on:
      - postgres
      - redis
      - ffmpeg-worker
    volumes:
      - ./src:/app/src
      - ./client:/app/client

  postgres:
    image: postgres:15-alpine
    ports:
      - "54321:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=whynot
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  ffmpeg-worker:
    build:
      context: ./ffmpeg-worker
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=debug
    depends_on:
      - redis
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: "4"
          memory: 4G
        reservations:
          cpus: "2"
          memory: 2G

volumes:
  postgres_data:
  redis_data:
```

**Local testing**:

```bash
# Start all services
docker-compose up --build

# Backend: http://localhost:3000
# FFmpeg Worker Health: http://localhost:8080/health
# Redis: localhost:6379
# Postgres: localhost:54321
```

---

## Deployment Options

### Option A: Heroku

**Limitations**:

- ❌ No native docker-compose support
- ❌ Need separate `heroku.yml` config
- ❌ One Procfile = one dyno type
- ❌ Costly for multiple services

**Setup**: Would require 3 dynos:

- Web dyno (backend): Performance-M ($250/month)
- Worker dyno (FFmpeg): Performance-L ($500/month) - CPU intensive
- Postgres: Standard-0 ($50/month)
- Redis: Premium-0 ($15/month)

**Total**: ~$815/month minimum

**Verdict**: Expensive and limited docker support.

---

### Option B: Render.com (RECOMMENDED)

**Advantages**:

- ✅ **Native docker-compose support** via `render.yaml`
- ✅ Automatic deploys from GitHub
- ✅ Free Postgres (up to 1GB)
- ✅ Free Redis (up to 25MB)
- ✅ Simpler pricing model

**Render Plans Comparison**:

| Plan         | vCPU | RAM   | Price     | Use Case                                   |
| ------------ | ---- | ----- | --------- | ------------------------------------------ |
| **Hobby**    | 0.5  | 512MB | $0/month  | Development only (sleeps after inactivity) |
| **Starter**  | 0.5  | 512MB | $7/month  | Small workloads (1-5 concurrent streams)   |
| **Standard** | 1    | 2GB   | $25/month | Production (10-30 streams)                 |
| **Pro**      | 2    | 4GB   | $85/month | Scale (50-100 streams)                     |

**PoC Setup (Hobby Plan - FREE)**:

```yaml
# render.yaml
services:
  - type: web
    name: whynot-backend
    env: docker
    dockerfilePath: ./Dockerfile
    plan: hobby # FREE (but sleeps after 15min inactivity)
    envVars:
      - key: REDIS_URL
        fromService:
          type: redis
          name: whynot-redis
          property: connectionString

  - type: worker
    name: whynot-ffmpeg
    env: docker
    dockerfilePath: ./ffmpeg-worker/Dockerfile
    plan: hobby # FREE
    envVars:
      - key: REDIS_URL
        fromService:
          type: redis
          name: whynot-redis
          property: connectionString

databases:
  - name: whynot-db
    plan: free # Up to 1GB storage
    databaseName: whynot
    user: postgres

  - name: whynot-redis
    plan: free # Up to 25MB memory
```

**PoC Limitations (Hobby plan)**:

- ⚠️ Services sleep after 15 minutes of inactivity
- ⚠️ 512MB RAM (can handle ~5 concurrent streams)
- ⚠️ 0.5 vCPU (FFmpeg will be slow)

**Is Hobby Sufficient for PoC?**

| Aspect             | Hobby Plan              | Acceptable for PoC?             |
| ------------------ | ----------------------- | ------------------------------- |
| Concurrent streams | 3-5 max                 | ✅ Yes (demo purposes)          |
| Stream quality     | 720p @ 1500kbps         | ✅ Yes (acceptable)             |
| Latency            | +5-10s (CPU bottleneck) | ⚠️ Acceptable for testing       |
| Uptime             | Sleeps after 15min      | ⚠️ Fine if you ping every 10min |
| Cost               | $0/month                | ✅ Perfect for PoC              |

**Verdict**: Hobby plan works for **initial PoC** (demo with 1-3 test streams). Upgrade to **Starter ($7/month)** for real testing with 10+ concurrent users.

**Production Recommendation** (50 sellers × 30 buyers):

- Backend: Standard ($25/month)
- FFmpeg Worker: Pro ($85/month) - CPU intensive
- Postgres: Paid plan ($7-15/month for >1GB)
- Redis: Paid plan ($10/month for >25MB)

**Total**: ~$127-140/month (vs $815 on Heroku)

**Savings**: **83% cheaper than Heroku**

---

## Auto-Scaling Strategy

### Complexity vs Cost Analysis

**Option 1: Single Large Instance (Simple)**

One Pro instance (2 vCPU, 4GB RAM) handling all streams.

**Capacity**: ~50-100 concurrent streams  
**Cost**: $85/month fixed  
**Complexity**: Low (no orchestration needed)

**Pros**:

- ✅ Simple architecture
- ✅ Predictable cost
- ✅ No coordination overhead

**Cons**:

- ❌ Single point of failure
- ❌ Can't handle >100 streams
- ❌ Waste resources during low traffic

---

**Option 2: Horizontal Auto-Scaling (Medium Complexity)**

Multiple Standard instances (1 vCPU, 2GB each) with load balancing.

**Setup**:

```yaml
# render.yaml
services:
  - type: worker
    name: whynot-ffmpeg
    scaling:
      minInstances: 1
      maxInstances: 5
      targetCPUPercent: 70 # Scale when CPU > 70%
```

**Capacity**: Auto-scales from 10 → 250 streams  
**Cost**: $25-125/month (scales with load)  
**Complexity**: Medium (Render handles scaling)

**Pros**:

- ✅ Cost-efficient (pay for what you use)
- ✅ Handles traffic spikes
- ✅ Render manages scaling automatically

**Cons**:

- ⚠️ Need Redis-based job queue for distribution
- ⚠️ Slightly more complex monitoring

**Implementation**:

- Redis Queue distributes jobs across workers
- Each worker pulls jobs independently
- Render auto-scales based on CPU/memory metrics

**Additional Cost**: None (built into Render)

---

**Option 3: Kubernetes (High Complexity)**

Full orchestration with K8s (GKE, EKS, or Render Kubernetes).

**Cost**: $100-300/month minimum (cluster + nodes)  
**Complexity**: High (DevOps required)

**Verdict**: Overkill for < 1,000 concurrent streams.

---

### Auto-Scaling Recommendation

**For PoC/MVP**: Single instance (no auto-scaling)

- Start with Render Pro ($85/month)
- Handles 50-100 streams easily
- Monitor CPU/memory via Render dashboard

**When to scale**: If you consistently hit >80% CPU for 24+ hours

- Enable Render auto-scaling (2-5 instances)
- Cost increases to $170-425/month
- Zero code changes needed

**Complexity**: Low to Medium  
**Setup time**: 10 minutes (just update `render.yaml`)

---

## Cost Comparison Summary

**Monthly costs for 50 sellers × 3h/day**:

| Solution                   | Monthly Cost | Notes                     |
| -------------------------- | ------------ | ------------------------- |
| Agora RTMP Converter       | $540         | Blocked (403 error)       |
| Mux Live                   | $4,050       | 7.5x more expensive       |
| AWS MediaLive              | $10,800      | 20x more expensive        |
| Custom FFmpeg (Heroku)     | $815         | No docker-compose support |
| **Custom FFmpeg (Render)** | **$127**     | ✅ Best value             |

**Savings**: Custom FFmpeg on Render is **76% cheaper** than Agora and **84% cheaper** than Heroku.

**PoC Phase**: $0/month (Render Hobby plan)

---

## Consequences

### Technical Impact

**Performance**:

- Latency: +3-5s overhead (RTC → FFmpeg → RTMP)
- Quality: Configurable (can match or exceed Agora)
- Reliability: Dependent on infrastructure monitoring

**Scalability**:

- Single instance: 50-100 streams
- Auto-scaling: 250-500 streams
- Beyond 500: Need regional distribution (multiple Render regions)

**Maintenance**:

- Ongoing: Monitor FFmpeg process health
- Updates: FFmpeg version updates, security patches
- Debugging: More complex than managed solution

**Security**:

- Need to secure Redis queue
- FFmpeg process isolation
- RTMP credential management

---

### Trade-offs

**Positive**:

- ✅ **Full control** over conversion pipeline
- ✅ **No vendor lock-in** (not dependent on Agora approval)
- ✅ **Cost-effective** ($127/month vs $540-10,800)
- ✅ **Customizable** (can optimize for live shopping use case)
- ✅ **Production-ready platform** (Render.com)

**Negative**:

- ❌ **Development time**: 2-3 weeks to build + test
- ❌ **Maintenance burden**: Ongoing monitoring required
- ❌ **Complexity**: More moving parts than Agora API
- ❌ **Responsibility**: We own uptime/reliability

**Risks**:

| Risk                          | Impact | Mitigation                          |
| ----------------------------- | ------ | ----------------------------------- |
| FFmpeg process crashes        | High   | Auto-restart, health checks, alerts |
| Memory leaks                  | Medium | Process restart after N streams     |
| Redis queue overflow          | Medium | Dead-letter queue, job TTL          |
| Render.com outage             | Medium | Multi-region deployment (future)    |
| FFmpeg security vulnerability | Low    | Automated security updates          |

---

## Success Metrics

**Performance Metrics**:

1. **Conversion Latency**: < 5s (RTC frame → RTMP push)
2. **Stream Success Rate**: > 99% (successful start)
3. **Uptime**: > 99.5% (FFmpeg worker availability)
4. **CPU Usage**: < 80% average per worker

**Cost Metrics**:

1. **Cost per Stream**: < $3/month per active seller
2. **Infrastructure Cost**: < $150/month for 50 concurrent streams

**Development Metrics**:

1. **Time to Production**: < 3 weeks from start to deploy
2. **Bug Rate**: < 5 critical bugs in first month

**Review Period**: 60 days after production deployment

---

## Implementation Plan

### Phase 1: Local Development (Week 1)

- [ ] Create `ffmpeg-worker/` service
- [ ] Implement `FFmpegManager` (spawn/manage processes)
- [ ] Build Redis queue integration
- [ ] Create docker-compose.yml
- [ ] Test locally with 1-3 concurrent streams

### Phase 2: Backend Integration (Week 2)

- [ ] Implement `RTCToRTMPBridge` service
- [ ] Connect backend → Redis → FFmpeg worker
- [ ] Add health check endpoints
- [ ] Test end-to-end flow (seller → RTC → FFmpeg → Cloudflare)

### Phase 3: Production Deployment (Week 3)

- [ ] Create Render account
- [ ] Set up `render.yaml` configuration
- [ ] Deploy to Render Hobby plan (PoC)
- [ ] Monitor performance with 5-10 test streams
- [ ] Upgrade to Starter/Standard if successful

### Phase 4: Optimization (Week 4+)

- [ ] Implement auto-scaling (if needed)
- [ ] Add Prometheus metrics
- [ ] Set up alerting (Datadog/Sentry)
- [ ] Load testing (50+ concurrent streams)

---

## References

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg RTMP Streaming](https://trac.ffmpeg.org/wiki/StreamingGuide)
- [Render.com Documentation](https://render.com/docs)
- [Render vs Heroku Comparison](https://render.com/render-vs-heroku-comparison)
- [Docker Compose Spec](https://docs.docker.com/compose/compose-file/)
- [Redis Queue Patterns](https://redis.io/docs/manual/patterns/distributed-locks/)
- [PDR-001: Buyer Viewing Experience](../pdr/001-buyer-viewing-experience-hls-vs-rtc.md)

---

## Changelog

| Date       | Change                             | Author          |
| ---------- | ---------------------------------- | --------------- |
| 2026-02-18 | Initial ADR created                | Frederic Mamath |
| 2026-02-16 | Agora RTMP Converter blocked (403) | Frederic Mamath |

---

**Decision Summary**: Build a custom FFmpeg-based RTMP relay using Docker containers and Redis queue, deployed on Render.com. This provides full control, reduces costs by 76% vs Agora, and avoids vendor lock-in. The shared container pool architecture balances cost-efficiency with manageable complexity.
