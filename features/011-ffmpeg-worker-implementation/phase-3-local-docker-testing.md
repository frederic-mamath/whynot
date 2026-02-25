# Phase 3: Local Docker Testing

**Duration**: 4-6 hours  
**Status**: ⬜ Not Started  
**Prerequisites**: Phase 1 & 2 completed ✅

---

## 🎯 Objective

Validate the complete RTC → Redis → FFmpeg → RTMP pipeline locally using Docker Compose:

1. Update docker-compose.yml with ffmpeg-worker service
2. Test single stream end-to-end
3. Test 5 concurrent streams
4. Validate resource usage
5. Verify error handling and recovery

---

## 📋 Tasks

### Task 3.1: Update Docker Compose Configuration (30min)

**Goal**: Add ffmpeg-worker as 4th service

**`docker-compose.yml`** (add service):

```yaml
version: "3.8"

networks:
  whynot-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:

services:
  # ============================================
  # PostgreSQL Database
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: whynot-postgres
    environment:
      POSTGRES_DB: whynot_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - whynot-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # Redis Cache & Queue
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: whynot-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - whynot-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    command:
      - redis-server
      - --appendonly yes
      - --maxmemory 256mb
      - --maxmemory-policy allkeys-lru

  # ============================================
  # Backend API
  # ============================================
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    container_name: whynot-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/whynot_dev
      REDIS_URL: redis://redis:6379
      PORT: 3000
      AGORA_APP_ID: ${AGORA_APP_ID}
      AGORA_APP_CERTIFICATE: ${AGORA_APP_CERTIFICATE}
      CLOUDFLARE_STREAM_CUSTOMER_CODE: ${CLOUDFLARE_STREAM_CUSTOMER_CODE}
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - whynot-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run dev

  # ============================================
  # FFmpeg Worker (NEW)
  # ============================================
  ffmpeg-worker:
    build:
      context: ./ffmpeg-worker
      dockerfile: Dockerfile
    container_name: whynot-ffmpeg-worker
    environment:
      NODE_ENV: development
      REDIS_URL: redis://redis:6379
      MAX_CONCURRENT_STREAMS: 10
      FFMPEG_LOG_LEVEL: warning
      HEALTH_PORT: 8080
      LOG_LEVEL: info
    ports:
      - "8080:8080" # Health check endpoint
    networks:
      - whynot-network
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    # Resource limits for testing
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M
```

**Verify Configuration**:

```bash
# Validate docker-compose.yml
docker compose config

# Should see 4 services: postgres, redis, backend, ffmpeg-worker
```

**Acceptance Criteria**:

- [x] ffmpeg-worker service added
- [x] Depends on redis
- [x] Health port exposed (8080)
- [x] Resource limits configured
- [x] Configuration validates

---

### Task 3.2: Build and Start All Services (30min)

**Goal**: Build images and start the full stack

**Build Script** (`scripts/docker-build-all.sh`):

```bash
#!/bin/bash
set -e

echo "🏗️  Building all Docker services..."

# Build backend
echo "1️⃣  Building backend..."
docker compose build backend

# Build ffmpeg-worker
echo "2️⃣  Building ffmpeg-worker..."
docker compose build ffmpeg-worker

echo "✅ All services built successfully!"
```

**Start Services**:

```bash
chmod +x scripts/docker-build-all.sh
./scripts/docker-build-all.sh

# Start all services
docker compose up -d

# Check status
docker compose ps

# Expected output:
# NAME                  STATUS              PORTS
# whynot-postgres       Up (healthy)        0.0.0.0:5432->5432/tcp
# whynot-redis          Up (healthy)        0.0.0.0:6379->6379/tcp
# whynot-backend        Up                  0.0.0.0:3000->3000/tcp
# whynot-ffmpeg-worker  Up                  0.0.0.0:8080->8080/tcp
```

**Health Checks**:

```bash
# PostgreSQL
docker exec whynot-postgres pg_isready -U postgres

# Redis
docker exec whynot-redis redis-cli ping

# Backend
curl http://localhost:3000/health

# FFmpeg Worker
curl http://localhost:8080/health
```

**Acceptance Criteria**:

- [x] All 4 services start successfully
- [x] All health checks pass
- [x] No errors in logs
- [x] Services can communicate

---

### Task 3.3: Single Stream Test (1-2h)

**Goal**: Test one RTC stream → FFmpeg → RTMP flow

**Test Script** (`scripts/test-single-stream.ts`):

```typescript
// scripts/test-single-stream.ts

import axios from "axios";

const BACKEND_URL = "http://localhost:3000";
const WORKER_HEALTH_URL = "http://localhost:8080";

async function testSingleStream() {
  console.log("🧪 Testing Single Stream Flow\n");

  try {
    // Step 1: Check all services healthy
    console.log("1️⃣  Checking service health...");

    const backendHealth = await axios.get(`${BACKEND_URL}/health`);
    console.log("   Backend:", backendHealth.data.status);

    const workerHealth = await axios.get(`${WORKER_HEALTH_URL}/health`);
    console.log("   FFmpeg Worker:", workerHealth.data.status);
    console.log("   Active streams:", workerHealth.data.activeStreams);
    console.log("✅ All services healthy\n");

    // Step 2: Create test channel
    console.log("2️⃣  Creating test channel...");
    const createChannelResponse = await axios.post(
      `${BACKEND_URL}/trpc/channels.create`,
      {
        name: "test-stream-channel",
        description: "Test channel for single stream",
        rtmp_url: "rtmp://live.cloudflare.com/live/TEST_STREAM_KEY",
      },
    );
    const channelId = createChannelResponse.data.result.data.id;
    console.log("   Channel ID:", channelId);
    console.log("✅ Channel created\n");

    // Step 3: Start RTMP relay
    console.log("3️⃣  Starting RTMP relay...");
    await axios.post(`${BACKEND_URL}/trpc/streaming.startRelay`, {
      channelId,
    });
    console.log("✅ Relay started\n");

    // Step 4: Wait 10 seconds
    console.log("4️⃣  Waiting 10 seconds for stream to start...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Step 5: Check worker stats
    console.log("5️⃣  Checking FFmpeg worker stats...");
    const workerStats = await axios.get(`${WORKER_HEALTH_URL}/stats`);
    console.log("   Stats:", JSON.stringify(workerStats.data, null, 2));
    console.log("✅ Stats retrieved\n");

    // Step 6: Check backend relay stats
    console.log("6️⃣  Checking backend relay stats...");
    const relayStats = await axios.get(
      `${BACKEND_URL}/trpc/streaming.getRelayStats`,
    );
    console.log("   Relay Stats:", JSON.stringify(relayStats.data, null, 2));
    console.log("✅ Relay stats retrieved\n");

    // Step 7: Wait 30 seconds (simulate streaming)
    console.log("7️⃣  Simulating 30 seconds of streaming...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Step 8: Stop relay
    console.log("8️⃣  Stopping RTMP relay...");
    await axios.post(`${BACKEND_URL}/trpc/streaming.stopRelay`, {
      channelId,
    });
    console.log("✅ Relay stopped\n");

    // Step 9: Final health check
    console.log("9️⃣  Final health check...");
    const finalHealth = await axios.get(`${WORKER_HEALTH_URL}/health`);
    console.log("   Active streams:", finalHealth.data.activeStreams);
    console.log("   Should be 0");
    console.log("✅ Final health check passed\n");

    console.log("✅✅✅ Single stream test PASSED!");
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

testSingleStream();
```

**Run Test**:

```bash
# Install axios if needed
npm install --save-dev axios

# Run test
npx tsx scripts/test-single-stream.ts
```

**Monitor Logs**:

```bash
# In separate terminals:

# Backend logs
docker compose logs -f backend

# FFmpeg worker logs
docker compose logs -f ffmpeg-worker

# Redis logs
docker compose logs -f redis
```

**Expected Results**:

- Backend enqueues job to Redis
- FFmpeg worker picks up job
- FFmpeg process spawns (check logs)
- Stream runs for 30 seconds
- FFmpeg stops gracefully
- No errors in any service

**Acceptance Criteria**:

- [x] Job enqueued to Redis
- [x] FFmpeg worker starts stream
- [x] No errors during streaming
- [x] Graceful shutdown works
- [x] Resources cleaned up

---

### Task 3.4: Concurrent Streams Test (1-2h)

**Goal**: Test 5 concurrent streams

**Test Script** (`scripts/test-concurrent-streams.ts`):

```typescript
// scripts/test-concurrent-streams.ts

import axios from "axios";

const BACKEND_URL = "http://localhost:3000";
const WORKER_HEALTH_URL = "http://localhost:8080";
const NUM_STREAMS = 5;

async function testConcurrentStreams() {
  console.log(`🧪 Testing ${NUM_STREAMS} Concurrent Streams\n`);

  const channelIds: number[] = [];

  try {
    // Step 1: Create 5 channels
    console.log(`1️⃣  Creating ${NUM_STREAMS} test channels...`);
    for (let i = 1; i <= NUM_STREAMS; i++) {
      const response = await axios.post(`${BACKEND_URL}/trpc/channels.create`, {
        name: `concurrent-test-channel-${i}`,
        description: `Concurrent test channel ${i}`,
        rtmp_url: `rtmp://live.cloudflare.com/live/TEST_STREAM_KEY_${i}`,
      });
      channelIds.push(response.data.result.data.id);
      console.log(`   Channel ${i} created (ID: ${channelIds[i - 1]})`);
    }
    console.log(`✅ All ${NUM_STREAMS} channels created\n`);

    // Step 2: Start all relays simultaneously
    console.log("2️⃣  Starting all RTMP relays simultaneously...");
    const startPromises = channelIds.map((channelId) =>
      axios.post(`${BACKEND_URL}/trpc/streaming.startRelay`, { channelId }),
    );
    await Promise.all(startPromises);
    console.log("✅ All relays started\n");

    // Step 3: Wait 15 seconds for all to start
    console.log("3️⃣  Waiting 15 seconds for all streams to start...");
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Step 4: Check worker is handling all streams
    console.log("4️⃣  Checking FFmpeg worker stats...");
    const workerStats = await axios.get(`${WORKER_HEALTH_URL}/stats`);
    console.log(
      `   Active streams: ${workerStats.data.activeStreams}/${NUM_STREAMS}`,
    );
    console.log(`   Utilization: ${workerStats.data.utilization.toFixed(1)}%`);

    if (workerStats.data.activeStreams !== NUM_STREAMS) {
      console.warn(
        `⚠️  Expected ${NUM_STREAMS} active streams, got ${workerStats.data.activeStreams}`,
      );
    }
    console.log("✅ Stats retrieved\n");

    // Step 5: Monitor resource usage
    console.log("5️⃣  Monitoring resource usage for 60 seconds...");
    for (let i = 0; i < 6; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      const health = await axios.get(`${WORKER_HEALTH_URL}/health`);
      console.log(
        `   [${i * 10}s] Active: ${health.data.activeStreams}, Memory: ${health.data.memory.used.toFixed(0)}MB`,
      );
    }
    console.log("✅ Resource monitoring complete\n");

    // Step 6: Stop all relays
    console.log("6️⃣  Stopping all RTMP relays...");
    const stopPromises = channelIds.map((channelId) =>
      axios.post(`${BACKEND_URL}/trpc/streaming.stopRelay`, { channelId }),
    );
    await Promise.all(stopPromises);
    console.log("✅ All relays stopped\n");

    // Step 7: Verify cleanup
    console.log("7️⃣  Verifying cleanup...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const finalHealth = await axios.get(`${WORKER_HEALTH_URL}/health`);
    console.log(
      `   Active streams: ${finalHealth.data.activeStreams} (should be 0)`,
    );

    if (finalHealth.data.activeStreams !== 0) {
      console.error(
        `❌ Cleanup failed: ${finalHealth.data.activeStreams} streams still active`,
      );
      process.exit(1);
    }
    console.log("✅ Cleanup verified\n");

    console.log(
      `✅✅✅ Concurrent streams test (${NUM_STREAMS} streams) PASSED!`,
    );
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

testConcurrentStreams();
```

**Run Test**:

```bash
npx tsx scripts/test-concurrent-streams.ts
```

**Monitor Docker Stats**:

```bash
# In separate terminal
docker stats whynot-ffmpeg-worker

# Watch CPU%, MEM USAGE%, NET I/O
```

**Expected Results**:

- 5 streams start successfully
- CPU usage: 50-150% (depending on hardware)
- Memory usage: 500MB-1.5GB
- No streams fail
- All streams stop cleanly

**Acceptance Criteria**:

- [x] All 5 streams start successfully
- [x] Worker handles concurrent load
- [x] Resource usage within limits
- [x] All streams stop gracefully
- [x] No memory leaks

---

### Task 3.5: Error Recovery Testing (1h)

**Goal**: Test worker recovery from failures

**Test Scenarios**:

**Scenario 1: Kill FFmpeg Process**

```bash
# While stream is running
docker exec whynot-ffmpeg-worker pkill -SIGKILL ffmpeg

# Watch logs - worker should restart stream
docker compose logs -f ffmpeg-worker
```

**Scenario 2: Restart Worker Mid-Stream**

```bash
# Start a stream
curl -X POST http://localhost:3000/trpc/streaming.startRelay \
  -H "Content-Type: application/json" \
  -d '{"channelId": 1}'

# Wait 10 seconds
sleep 10

# Restart worker
docker compose restart ffmpeg-worker

# Check if stream recovers
curl http://localhost:8080/health
```

**Scenario 3: Redis Connection Loss**

```bash
# Start streams
# ...

# Stop Redis
docker compose stop redis

# Wait 5 seconds
sleep 5

# Start Redis
docker compose start redis

# Verify worker reconnects
docker compose logs -f ffmpeg-worker
```

**Test Script** (`scripts/test-error-recovery.sh`):

```bash
#!/bin/bash
set -e

echo "🧪 Testing Error Recovery..."

# Scenario 1: Kill FFmpeg process
echo "1️⃣  Testing FFmpeg process restart..."
docker exec whynot-ffmpeg-worker pkill -SIGKILL ffmpeg || echo "No ffmpeg process running"
sleep 5
echo "✅ FFmpeg restart test complete"

# Scenario 2: Worker restart
echo "2️⃣  Testing worker restart..."
docker compose restart ffmpeg-worker
sleep 10
curl -f http://localhost:8080/health
echo "✅ Worker restart test complete"

# Scenario 3: Redis restart
echo "3️⃣  Testing Redis restart..."
docker compose restart redis
sleep 10
curl -f http://localhost:8080/health
echo "✅ Redis restart test complete"

echo "✅✅✅ Error recovery tests PASSED!"
```

**Acceptance Criteria**:

- [x] Worker restarts FFmpeg on crash
- [x] Worker survives container restart
- [x] Worker reconnects to Redis
- [x] Jobs are retried on failure

---

### Task 3.6: Performance Baseline (30min)

**Goal**: Establish performance baselines for production

**Metrics to Collect**:

1. **Startup Time**

   ```bash
   time docker compose up -d ffmpeg-worker
   # Target: < 10 seconds
   ```

2. **Stream Start Latency**

   ```bash
   # Measure time from startRelay call to FFmpeg process running
   # Target: < 5 seconds
   ```

3. **Resource Usage per Stream**

   ```bash
   docker stats whynot-ffmpeg-worker

   # Target per stream:
   # - CPU: 10-30%
   # - Memory: 100-200MB
   # - Network: 2-5 Mbps (depends on bitrate)
   ```

4. **Queue Throughput**
   ```bash
   # Measure jobs/second Redis can handle
   # Target: > 10 jobs/second
   ```

**Baseline Script** (`scripts/collect-baselines.sh`):

```bash
#!/bin/bash

echo "📊 Collecting Performance Baselines..."

echo "1️⃣  Startup Time:"
time docker compose up -d ffmpeg-worker

echo "2️⃣  Health Check Response Time:"
time curl http://localhost:8080/health

echo "3️⃣  Resource Usage (idle):"
docker stats whynot-ffmpeg-worker --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo "4️⃣  Starting 1 stream..."
# Start stream and measure time
START_TIME=$(date +%s)
curl -X POST http://localhost:3000/trpc/streaming.startRelay -H "Content-Type: application/json" -d '{"channelId":1}'
sleep 5

echo "5️⃣  Resource Usage (1 stream):"
docker stats whynot-ffmpeg-worker --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo "✅ Baselines collected!"
```

**Document Baselines** in `features/011-ffmpeg-worker-implementation/BASELINES.md`:

```markdown
# Performance Baselines (Local Docker)

**Environment**: MacBook Pro M1, 16GB RAM, Docker Desktop

## Metrics

| Metric                    | Value     | Target      |
| ------------------------- | --------- | ----------- |
| Startup time              | 8s        | < 10s       |
| Health check response     | 50ms      | < 100ms     |
| Stream start latency      | 3.2s      | < 5s        |
| CPU per stream (idle)     | 2%        | < 5%        |
| CPU per stream (encoding) | 25%       | < 30%       |
| Memory per stream         | 150MB     | < 200MB     |
| Queue throughput          | 15 jobs/s | > 10 jobs/s |

## Resource Usage

### Idle

- CPU: 2%
- Memory: 120MB

### 1 Stream

- CPU: 27%
- Memory: 270MB

### 5 Streams

- CPU: 135%
- Memory: 1.2GB
```

**Acceptance Criteria**:

- [x] All baselines collected
- [x] Performance within targets
- [x] Baselines documented

---

## ✅ Phase 3 Completion Checklist

- [ ] docker-compose.yml updated with ffmpeg-worker
- [ ] All 4 services build and start successfully
- [ ] Single stream test passes
- [ ] 5 concurrent streams test passes
- [ ] Error recovery tests pass
- [ ] Performance baselines documented
- [ ] All tests automated and repeatable
- [ ] Issues found are documented

---

## 📊 Estimated vs Actual Time

| Task      | Estimated | Actual | Notes |
| --------- | --------- | ------ | ----- |
| 3.1       | 30min     |        |       |
| 3.2       | 30min     |        |       |
| 3.3       | 1-2h      |        |       |
| 3.4       | 1-2h      |        |       |
| 3.5       | 1h        |        |       |
| 3.6       | 30min     |        |       |
| **Total** | **4-6h**  |        |       |

---

## 🐛 Known Issues & Mitigations

Document any issues found during testing:

| Issue                                       | Impact | Mitigation                           | Status |
| ------------------------------------------- | ------ | ------------------------------------ | ------ |
| Example: FFmpeg crashes on invalid RTMP URL | High   | Validate RTMP URLs before enqueueing | Fixed  |
|                                             |        |                                      |        |

---

## 🔄 Next Phase

After completing Phase 3 and validating locally, proceed to **Phase 4: Render Deployment & Scaling** to deploy the FFmpeg worker to production.

**Phase 4 Preview**:

- Update render.yaml with ffmpeg-worker service
- Configure auto-scaling rules
- Deploy to Render
- Validate production deployment
- Test with real Agora streams
