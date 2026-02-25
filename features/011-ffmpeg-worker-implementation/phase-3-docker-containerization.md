# Phase 3: Docker Containerization & Local Testing

**Duration**: 2-3 hours  
**Status**: 🔄 In Progress (Started: 2026-02-23)  
**Prerequisites**: Phase 2.5 completed ✅ (Agora RTC Bridge working locally)

---

## 🎯 Objective

Package the FFmpeg worker into a Docker container and validate it works:

1. **Create Dockerfile** with CPU encoding (libx264)
2. **Build Docker image** with Puppeteer + FFmpeg + Node.js
3. **Update docker-compose.yml** to include ffmpeg-worker service
4. **Test locally** with docker-compose
5. **Validate** end-to-end streaming through Docker

**Why Docker First, GPU Later**:

- ✅ Get to production faster (Render.com deployment in Phase 4)
- ✅ Validate containerization works before adding GPU complexity
- ✅ CPU encoding acceptable for PoC (10 FPS @ 640×360)
- ⏭️ GPU optimization deferred to Phase 7 (AWS EC2 + NVENC)

---

## 📋 Tasks

### Task 3.1: Create Production Dockerfile (1h)

**Goal**: Build multi-stage Dockerfile optimized for Render.com deployment

**File**: `ffmpeg-worker/Dockerfile`

```dockerfile
# ============================================
# Stage 1: Base Image with FFmpeg
# ============================================
FROM node:20-slim as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Verify FFmpeg installation
RUN ffmpeg -version

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base as deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# ============================================
# Stage 3: Builder
# ============================================
FROM deps as builder

WORKDIR /app

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Build TypeScript
RUN npm run build

# Verify build output
RUN ls -la dist/

# ============================================
# Stage 4: Production Runtime
# ============================================
FROM base

WORKDIR /app

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install Chromium/Chrome for Puppeteer
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Verify Chrome installation
RUN google-chrome-stable --version

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy public assets (rtc-subscriber.html)
COPY public ./public

# Create /tmp directory for FIFOs (named pipes)
RUN mkdir -p /tmp && chmod 777 /tmp

# Create non-root user for security
RUN groupadd -r worker && useradd -r -g worker worker \
    && chown -R worker:worker /app \
    && chown -R worker:worker /tmp

USER worker

# Expose health check port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start worker
CMD ["node", "dist/index.js"]
```

**Key Design Decisions**:

- **Base Image**: `node:20-slim` (smaller than full node image)
- **FFmpeg**: Installed from apt (libx264 CPU encoder)
- **Chromium**: Google Chrome Stable for Puppeteer (better compatibility than Chromium)
- **Multi-stage**: Separate build and runtime stages (smaller final image)
- **Non-root user**: Security best practice
- **Health check**: HTTP endpoint on port 3001

**Build Script**: `ffmpeg-worker/build.sh`

```bash
#!/bin/bash
set -e

echo "🐳 Building FFmpeg Worker Docker image..."

docker build \
  --platform linux/amd64 \
  -t whynot-ffmpeg-worker:latest \
  -t whynot-ffmpeg-worker:cpu \
  -f Dockerfile \
  .

echo "✅ Docker image built successfully!"
echo "📦 Image: whynot-ffmpeg-worker:latest"
echo "🔍 Size:"
docker images whynot-ffmpeg-worker:latest

echo ""
echo "🧪 Quick test:"
echo "  docker run --rm whynot-ffmpeg-worker:latest node --version"
echo "  docker run --rm whynot-ffmpeg-worker:latest ffmpeg -version"
```

**Acceptance Criteria**:

- [ ] Dockerfile builds without errors
- [ ] FFmpeg installed and working
- [ ] Chromium installed and working
- [ ] TypeScript builds successfully
- [ ] Health check configured
- [ ] Image size < 2GB

---

### Task 3.2: Update docker-compose.yml (30min)

**Goal**: Add ffmpeg-worker service to local development stack

**File**: `docker-compose.yml` (add service)

```yaml
services:
  # ... existing postgres, redis, backend services ...

  # ============================================
  # FFmpeg Worker (NEW)
  # ============================================
  ffmpeg-worker:
    build:
      context: ./ffmpeg-worker
      dockerfile: Dockerfile
    container_name: whynot-ffmpeg-worker
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=debug
      - AGORA_APP_ID=${AGORA_APP_ID}
      - MAX_CONCURRENT_STREAMS=3
      - FFMPEG_LOG_LEVEL=warning
    depends_on:
      - redis
    networks:
      - whynot-network
    volumes:
      # Mount source for hot-reload (development only)
      - ./ffmpeg-worker/src:/app/src
      - ./ffmpeg-worker/public:/app/public
    restart: unless-stopped
    # Increase shared memory for Chromium
    shm_size: 2gb
    # Resource limits (optional, for development)
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 4G

networks:
  whynot-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

**Important Notes**:

- **`shm_size: 2gb`**: Required for Chromium/Puppeteer to avoid crashes
- **`depends_on: redis`**: Ensures Redis starts first
- **Resource limits**: Prevent worker from consuming all host resources
- **Volumes**: Mount source code for development (remove in production)

**Acceptance Criteria**:

- [ ] docker-compose.yml includes ffmpeg-worker
- [ ] Service depends on Redis
- [ ] Environment variables configured
- [ ] Shared memory increased for Chromium

---

### Task 3.3: Test Locally with Docker Compose (1h)

**Goal**: Validate end-to-end streaming works in containerized environment

**Test Script**: `ffmpeg-worker/scripts/test-docker.sh`

```bash
#!/bin/bash
set -e

echo "🧪 Testing FFmpeg Worker in Docker..."

# Step 1: Build images
echo "1️⃣  Building Docker images..."
docker-compose build ffmpeg-worker

# Step 2: Start services
echo "2️⃣  Starting services..."
docker-compose up -d postgres redis backend ffmpeg-worker

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Step 3: Check service health
echo "3️⃣  Checking service health..."
docker-compose ps

# Step 4: Check FFmpeg worker logs
echo "4️⃣  FFmpeg worker logs:"
docker-compose logs --tail=20 ffmpeg-worker

# Step 5: Test Redis connection
echo "5️⃣  Testing Redis connection from worker..."
docker-compose exec ffmpeg-worker node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(() => {
  console.log('✅ Redis connection OK');
  process.exit(0);
}).catch(err => {
  console.error('❌ Redis connection failed:', err);
  process.exit(1);
});
"

# Step 6: Test FFmpeg availability
echo "6️⃣  Testing FFmpeg in container..."
docker-compose exec ffmpeg-worker ffmpeg -version | head -n 1

# Step 7: Test Chromium availability
echo "7️⃣  Testing Chromium in container..."
docker-compose exec ffmpeg-worker google-chrome-stable --version

echo ""
echo "✅ Docker environment validated!"
echo ""
echo "📺 To test live streaming:"
echo "  1. Start a seller stream in the frontend"
echo "  2. Watch logs: docker-compose logs -f ffmpeg-worker"
echo "  3. Verify stream appears on Cloudflare"
```

**Manual Testing Steps**:

1. **Start services**:

   ```bash
   docker-compose up -d
   ```

2. **Watch worker logs**:

   ```bash
   docker-compose logs -f ffmpeg-worker
   ```

3. **Start a live stream** (from frontend):
   - Login as seller
   - Create/start a channel
   - Start broadcasting via Agora RTC

4. **Verify worker picks up job**:
   - Watch logs for "📦 Received new stream job"
   - Should see Puppeteer launching
   - Should see "✅ Video track ready and playing"
   - Should see "✅ Audio track ready and capturing"
   - Should see "🎬 Frame X captured"
   - Should see "🎤 Captured X MB of audio"

5. **Check Cloudflare stream**:
   - Open buyer view
   - Verify video + audio playing
   - Check latency (~8-12s acceptable)

6. **Test graceful shutdown**:

   ```bash
   docker-compose stop ffmpeg-worker
   ```

   - Should see cleanup logs
   - FIFOs should be removed
   - No zombie processes

**Acceptance Criteria**:

- [ ] All services start without errors
- [ ] FFmpeg worker connects to Redis
- [ ] Puppeteer can launch Chromium
- [ ] FFmpeg can encode video
- [ ] End-to-end streaming works (Seller → Agora → Worker → Cloudflare → Buyer)
- [ ] CPU usage acceptable (< 100% per stream)
- [ ] Memory usage acceptable (< 3GB per stream)
- [ ] Graceful shutdown works

---

### Task 3.4: Create Health Check Endpoint (30min)

**Goal**: HTTP endpoint for Docker/Render health checks

**File**: `ffmpeg-worker/src/index.ts` (add HTTP server)

```typescript
import http from "http";
import { setupWorker } from "./services/WorkerService";
import { config } from "./config";

// ... existing worker setup code ...

// Health check HTTP server
const healthServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
      }),
    );
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

const HEALTH_PORT = process.env.HEALTH_PORT || 3001;
healthServer.listen(HEALTH_PORT, () => {
  console.log(`🏥 Health check server listening on port ${HEALTH_PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("📥 Received SIGTERM, shutting down gracefully...");
  healthServer.close();
  process.exit(0);
});
```

**Test Health Endpoint**:

```bash
# Outside Docker
curl http://localhost:3001/health

# Inside Docker
docker-compose exec ffmpeg-worker curl http://localhost:3001/health
```

**Expected Response**:

```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2026-02-22T10:30:00.000Z",
  "memoryUsage": {
    "rss": 123456789,
    "heapTotal": 12345678,
    "heapUsed": 1234567,
    "external": 123456,
    "arrayBuffers": 12345
  }
}
```

**Acceptance Criteria**:

- [ ] Health endpoint responds with 200 OK
- [ ] Returns uptime and memory stats
- [ ] Works from inside and outside container
- [ ] Docker HEALTHCHECK passes

---

## ✅ Phase 3 Completion Checklist

### Docker Build & Configuration

- [ ] Dockerfile created and builds successfully
- [ ] FFmpeg installed and working
- [ ] Chromium installed and working
- [ ] TypeScript compiles without errors
- [ ] Image size optimized (< 2GB)
- [ ] Multi-stage build working

### Docker Compose

- [ ] ffmpeg-worker service added to docker-compose.yml
- [ ] Environment variables configured
- [ ] Redis dependency configured
- [ ] Shared memory size increased (2GB)
- [ ] Resource limits set

### Testing

- [ ] `docker-compose up` starts all services
- [ ] FFmpeg worker connects to Redis
- [ ] Puppeteer can launch Chromium
- [ ] Health check endpoint responds
- [ ] End-to-end streaming works (1 stream)
- [ ] Graceful shutdown works
- [ ] No memory leaks after 10 minutes

### Documentation

- [ ] Build script created (build.sh)
- [ ] Test script created (test-docker.sh)
- [ ] README updated with Docker instructions
- [ ] Known issues documented

---

## 📊 Performance Baseline (CPU Encoding)

**Expected Metrics** (single stream):

| Metric                 | Expected Value     |
| ---------------------- | ------------------ |
| Video Resolution       | 640×360            |
| Video FPS              | 10 FPS             |
| Audio Quality          | Opus 128kbps       |
| CPU Usage              | 80-100% per stream |
| RAM Usage              | 2-3GB per stream   |
| Docker Image Size      | ~1.5GB             |
| Container Startup Time | 15-20 seconds      |

**Limitations** (acceptable for PoC):

- ⚠️ Max 3-5 concurrent streams per worker (CPU bottleneck)
- ⚠️ Low FPS (10 instead of 30)
- ⚠️ Low resolution (360p instead of 720p)
- ✅ Cost-effective ($95/month total)
- ✅ No GPU required (simpler infrastructure)

**Note**: GPU optimization deferred to Phase 7 (AWS EC2 + NVENC for 720p@30fps).

---

## 🔄 Next Phase

**Phase 4: Render.com Deployment** (4-6h)

After Phase 3 validates Docker works locally:

1. Push Docker image to registry (Docker Hub or GitHub Container Registry)
2. Create/update `render.yaml` blueprint
3. Deploy ffmpeg-worker to Render.com
4. Configure auto-scaling (1-5 instances)
5. Test in staging environment
6. Monitor costs and performance

**Success Criteria**:

- FFmpeg worker deployed and running on Render
- Connects to production Redis
- Handles real seller streams
- Auto-scales based on CPU usage
- Costs align with $95/month projection

---

## 🐛 Troubleshooting

### Issue: Chromium crashes in Docker

**Symptoms**:

```
Error: Failed to launch the browser process!
[0222/103045.678:FATAL:setuid_sandbox_host.cc(158)] The SUID sandbox helper binary was found, but is not configured correctly.
```

**Solution**:
Add `--no-sandbox` to Puppeteer launch args (already in AgoraRTCBridge.ts):

```typescript
await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    // ... other args
  ],
});
```

---

### Issue: FFmpeg "Broken pipe" error

**Symptoms**:

```
[NULL @ 0x...] Unable to find a suitable output format for 'pipe:0'
pipe:0: Invalid argument
```

**Solution**:
Ensure FIFOs are created before FFmpeg starts. Already handled in FFmpegManager.ts (lines 50-102).

---

### Issue: Out of memory in Docker

**Symptoms**:

```
<--- Last few GCs --->
[1234:0x...] JavaScript heap out of memory
```

**Solution**:
Increase container memory limit and shared memory:

```yaml
services:
  ffmpeg-worker:
    shm_size: 2gb
    deploy:
      resources:
        limits:
          memory: 4G
```

---

## 📚 Resources

- [Puppeteer Docker Troubleshooting](https://pptr.dev/troubleshooting#running-puppeteer-in-docker)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Render.com Docker Deployment](https://render.com/docs/deploy-docker)
