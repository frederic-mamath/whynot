# Phase 7: GPU Optimization & AWS EC2 Deployment

**Duration**: 6-8 hours  
**Status**: ⬜ Not Started  
**Prerequisites**: Phase 1-6 completed ✅ (especially Phase 3: Docker CPU baseline working)

---

## 🎯 Objective

Optimize streaming performance with GPU hardware acceleration on AWS EC2:

1. **Build Dockerfile** with NVIDIA CUDA + FFmpeg NVENC support
2. **Auto-detect GPU/CPU** and fallback gracefully
3. **Test locally** with docker-compose (CPU mode)
4. **Deploy to AWS EC2 g4dn.xlarge** (Tesla T4 GPU)
5. Validate 720p@30fps streaming with hardware acceleration
6. Measure cost savings vs CPU-only approach

**Target Infrastructure**:

- **Production**: AWS EC2 g4dn.xlarge (4 vCPU, 16GB RAM, Tesla T4 GPU)
- **Local Development**: Docker Desktop (CPU fallback, 640x360@10fps)

---

## 📋 Tasks

### Task 3.1: Create Production Dockerfile with GPU Support (2h)

**Goal**: Build multi-stage Dockerfile with NVIDIA CUDA + FFmpeg NVENC

**File**: `ffmpeg-worker/Dockerfile`

```dockerfile
# ============================================
# Stage 1: Base Image with NVIDIA CUDA
# ============================================
FROM nvidia/cuda:12.0-runtime-ubuntu22.04 as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# Stage 2: FFmpeg with NVENC Support
# ============================================
FROM base as ffmpeg-builder

# Install FFmpeg build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    yasm \
    nasm \
    git \
    libx264-dev \
    libx265-dev \
    libvpx-dev \
    libopus-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pre-built FFmpeg with NVENC (or build from source if needed)
RUN add-apt-repository ppa:savoury1/ffmpeg4 \
    && apt-get update \
    && apt-get install -y ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Verify NVENC support
RUN ffmpeg -encoders | grep nvenc || echo "⚠️  NVENC not available (will fallback to CPU)"

# ============================================
# Stage 3: Node.js + Chromium for Puppeteer
# ============================================
FROM base as runtime

# Copy FFmpeg from builder
COPY --from=ffmpeg-builder /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-builder /usr/lib /usr/lib

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Chromium for Puppeteer (headless browser for Agora RTC)
RUN apt-get update && apt-get install -y \
    chromium-browser \
    chromium-codecs-ffmpeg-extra \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# ============================================
# Stage 4: Application Build
# ============================================
FROM runtime as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY public ./public

# Build TypeScript
RUN npm run build

# ============================================
# Stage 5: Production Image
# ============================================
FROM runtime

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy public assets (rtc-subscriber.html)
COPY public ./public

# Create non-root user for security
RUN useradd -m -u 1001 worker && chown -R worker:worker /app
USER worker

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.HEALTH_PORT || 3001) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Expose health check port
EXPOSE 3001

# Start worker
CMD ["node", "dist/index.js"]
```

**Build Script** (`ffmpeg-worker/build.sh`):

```bash
#!/bin/bash
set -e

echo "🐳 Building FFmpeg Worker Docker image..."

# Build with GPU support (for AWS EC2)
docker build \
  --platform linux/amd64 \
  -t whynot-ffmpeg-worker:latest \
  -t whynot-ffmpeg-worker:gpu \
  .

echo "✅ Docker image built successfully!"
echo "📦 Image: whynot-ffmpeg-worker:latest"
```

**Test GPU/CPU Detection** (`ffmpeg-worker/scripts/test-gpu.sh`):

```bash
#!/bin/bash
# Run inside container to test GPU availability

if nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected:"
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
    echo ""
    echo "🎮 Testing FFmpeg NVENC:"
    ffmpeg -encoders 2>/dev/null | grep nvenc
else
    echo "⚠️  No NVIDIA GPU detected - will use CPU encoding (libx264)"
    echo "📹 Available encoders:"
    ffmpeg -encoders 2>/dev/null | grep -E "(libx264|h264)"
fi
```

**Acceptance Criteria**:

- [ ] Dockerfile builds successfully
- [ ] FFmpeg installed with NVENC support
- [ ] Chromium installed for Puppeteer
- [ ] Multi-stage build reduces final image size
- [ ] GPU detection script works
- [ ] Health check configured

---

### Task 3.2: Auto-detect GPU and Configure FFmpeg Codec (1h)

**Goal**: Make FFmpegManager detect GPU at runtime and choose codec automatically

**Update**: `ffmpeg-worker/src/services/FFmpegManager.ts`

```typescript
// Add at the top of the file
import { execSync } from "child_process";

export class FFmpegManager {
  private processes = new Map<number, ProcessEntry>();
  private readonly MAX_RETRIES = 3;
  private gpuAvailable: boolean = false;
  private readonly videoCodec: string;

  constructor() {
    console.log("📦 FFmpegManager service initialized");

    // Detect GPU availability
    this.gpuAvailable = this.detectGPU();
    this.videoCodec = this.gpuAvailable ? "h264_nvenc" : "libx264";

    console.log(
      `🎮 GPU: ${this.gpuAvailable ? "✅ Available (NVENC)" : "❌ Not available (CPU)"}`,
    );
    console.log(`📹 Video Codec: ${this.videoCodec}`);

    // Graceful shutdown handler
    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  /**
   * Detect if NVIDIA GPU is available
   */
  private detectGPU(): boolean {
    try {
      // Check if nvidia-smi exists
      execSync("nvidia-smi", { stdio: "ignore" });

      // Check if FFmpeg has NVENC encoder
      const encoders = execSync("ffmpeg -encoders 2>/dev/null", {
        encoding: "utf-8",
      });

      const hasNvenc = encoders.includes("h264_nvenc");

      if (hasNvenc) {
        console.log("✅ NVIDIA GPU with NVENC support detected");
        return true;
      } else {
        console.warn("⚠️  nvidia-smi found but FFmpeg NVENC not available");
        return false;
      }
    } catch (error) {
      console.log("ℹ️  No NVIDIA GPU detected - using CPU encoding");
      return false;
    }
  }

  /**
   * Build FFmpeg command arguments with GPU/CPU auto-detection
   */
  private buildFFmpegArgs(
    streamConfig: StreamConfig,
    rtmpUrl: string,
  ): string[] {
    // Current fixed resolution and FPS (from Phase 2.5 testing)
    const resolution = "640x360";
    const actualFramerate = 10;

    const baseArgs = [
      // Input from stdin (RTC frames will be piped)
      "-f",
      "rawvideo",
      "-pixel_format",
      "yuv420p",
      "-video_size",
      resolution,
      "-framerate",
      actualFramerate.toString(),
      "-i",
      "pipe:0",

      // Video encoding (GPU or CPU)
      "-c:v",
      this.videoCodec,
    ];

    // Add codec-specific options
    if (this.gpuAvailable) {
      // NVENC GPU encoding
      baseArgs.push(
        "-preset",
        "p4", // Performance preset (p1-p7, p4 = balanced)
        "-tune",
        "ll", // Low latency tuning
        "-b:v",
        `${streamConfig.videoBitrate}k`,
        "-maxrate",
        `${streamConfig.videoBitrate * 1.2}k`,
        "-bufsize",
        `${streamConfig.videoBitrate * 2}k`,
        "-pix_fmt",
        "yuv420p",
        "-g",
        (actualFramerate * 2).toString(), // GOP size = 2 seconds
      );
    } else {
      // CPU encoding (libx264)
      baseArgs.push(
        "-preset",
        "veryfast",
        "-tune",
        "zerolatency",
        "-b:v",
        `${streamConfig.videoBitrate}k`,
        "-maxrate",
        `${streamConfig.videoBitrate * 1.2}k`,
        "-bufsize",
        `${streamConfig.videoBitrate * 2}k`,
        "-pix_fmt",
        "yuv420p",
        "-g",
        (actualFramerate * 2).toString(),
      );
    }

    // Audio encoding (same for GPU/CPU)
    baseArgs.push(
      "-c:a",
      streamConfig.audioCodec,
      "-b:a",
      `${streamConfig.audioBitrate}k`,
      "-ar",
      "48000",
      "-ac",
      "2",

      // Output format
      "-f",
      "flv",

      // Logging
      "-loglevel",
      config.ffmpeg.logLevel,

      // Output URL
      rtmpUrl,
    );

    return baseArgs;
  }

  // ... rest of the class stays the same
}
```

**Acceptance Criteria**:

- [ ] GPU detection works at runtime
- [ ] Codec switches automatically (NVENC vs libx264)
- [ ] Logs clearly indicate GPU/CPU mode
- [ ] FFmpeg args adapt based on codec

---

### Task 3.3: Update Docker Compose for Local Testing (30min)

**Goal**: Add ffmpeg-worker as 4th service (CPU mode for local dev)

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
  # FFmpeg Worker (CPU Mode for Local Dev)
  # ============================================
  ffmpeg-worker:
    build:
      context: ./ffmpeg-worker
      dockerfile: Dockerfile
    container_name: whynot-ffmpeg-worker
    environment:
      NODE_ENV: development
      REDIS_URL: redis://redis:6379
      AGORA_APP_ID: ${AGORA_APP_ID}
      MAX_CONCURRENT_STREAMS: 3 # Limited for local testing
      FFMPEG_LOG_LEVEL: warning
      HEALTH_PORT: 3001
      LOG_LEVEL: info
    ports:
      - "3001:3001" # Health check + static files (rtc-subscriber.html)
    networks:
      - whynot-network
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    # Resource limits for local testing
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 4G # Increased for Puppeteer + Chrome
        reservations:
          cpus: "0.5"
          memory: 1G
```

**Notes**:

- **No GPU** passthrough in local docker-compose (will use CPU automatically)
- **Memory increased** to 4GB for Puppeteer + Chrome
- **Port 3001** serves health + static files (rtc-subscriber.html)
- **MAX_CONCURRENT_STREAMS: 3** to avoid overwhelming local machine

**Verify Configuration**:

```bash
# Validate docker-compose.yml
docker compose config

# Build and start
docker compose build ffmpeg-worker
docker compose up -d

# Check all services
docker compose ps
```

**Acceptance Criteria**:

- [ ] ffmpeg-worker service added
- [ ] Builds without GPU drivers (CPU fallback)
- [ ] Memory limit set to 4GB for Puppeteer
- [ ] Configuration validates

---

### Task 3.4: Test Locally with Docker Compose (1-2h)

**Goal**: Validate video capture + encoding works in CPU mode

**Test Steps**:

```bash
# 1. Start all services
docker compose up -d

# 2. Check FFmpeg worker logs
docker compose logs -f ffmpeg-worker

# Expected log:
# 📦 FFmpegManager service initialized
# ℹ️  No NVIDIA GPU detected - using CPU encoding
# 📹 Video Codec: libx264

# 3. Check health
curl http://localhost:3001/health

# 4. Start a stream from UI
# - Create channel
# - Go live with Agora RTC
# - Observe worker logs

# Expected:
# 🌐 Launching headless browser for channel X
# ✅ Joined Agora channel
# 📹 Video and audio tracks ready
# 🎬 Starting frame capture at 10 FPS...
# 📹 Captured 30 frames (current FPS: 10.1)

# 5. Verify encoding
docker compose exec ffmpeg-worker ps aux | grep ffmpeg

# Should see FFmpeg process running with -c:v libx264
```

**Monitor Resource Usage**:

```bash
# Check container stats
docker stats whynot-ffmpeg-worker

# Expected (1 stream, CPU mode):
# CPU: ~80-100%
# Memory: ~2.5GB (Puppeteer + Chrome + FFmpeg)
```

**Acceptance Criteria**:

- [ ] Worker starts in CPU mode (libx264)
- [ ] Puppeteer connects to Agora RTC
- [ ] Frames captured at ~10 FPS (640x360)
- [ ] FFmpeg encodes successfully
- [ ] Stream appears on Cloudflare
- [ ] Video plays correctly (not sped up)
- [ ] Memory usage < 4GB

---

### Task 3.5: Prepare AWS EC2 Deployment (1h)

**Goal**: Create EC2-specific configuration and launch scripts

**File**: `ffmpeg-worker/deploy/ec2-userdata.sh`

```bash
#!/bin/bash
# EC2 User Data script for g4dn.xlarge (Tesla T4 GPU)

set -e

echo "🚀 Initializing WhyNot FFmpeg Worker on EC2..."

# Update system
apt-get update
apt-get upgrade -y

# Install NVIDIA drivers (if not using Deep Learning AMI)
# Skip this step if using AWS Deep Learning AMI (drivers pre-installed)
if ! command -v nvidia-smi &> /dev/null; then
    echo "📦 Installing NVIDIA drivers..."
    apt-get install -y ubuntu-drivers-common
    ubuntu-drivers autoinstall
    reboot  # Required after driver install
fi

# Install Docker
echo "🐳 Installing Docker..."
apt-get install -y docker.io
systemctl start docker
systemctl enable docker

# Install NVIDIA Container Toolkit
echo "🎮 Installing NVIDIA Container Toolkit..."
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

apt-get update
apt-get install -y nvidia-container-toolkit
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

# Verify GPU access from Docker
echo "✅ Testing GPU access..."
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi

# Pull and run FFmpeg worker
echo "📦 Pulling FFmpeg Worker..."
docker pull YOUR_REGISTRY/whynot-ffmpeg-worker:gpu

# Create environment file
cat > /opt/whynot/.env <<EOF
NODE_ENV=production
REDIS_URL=redis://YOUR_REDIS_HOST:6379
AGORA_APP_ID=YOUR_AGORA_APP_ID
MAX_CONCURRENT_STREAMS=15
FFMPEG_LOG_LEVEL=warning
HEALTH_PORT=3001
LOG_LEVEL=info
EOF

# Run worker with GPU access
echo "🚀 Starting FFmpeg Worker..."
docker run -d \
  --name whynot-ffmpeg-worker \
  --gpus all \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file /opt/whynot/.env \
  --memory=12g \
  --cpus=3.5 \
  YOUR_REGISTRY/whynot-ffmpeg-worker:gpu

echo "✅ WhyNot FFmpeg Worker deployed successfully!"
echo "🔍 Check status: docker logs -f whynot-ffmpeg-worker"
```

**File**: `ffmpeg-worker/deploy/ec2-launch.sh`

```bash
#!/bin/bash
# Launch EC2 instance with GPU support

set -e

# Configuration
INSTANCE_TYPE="g4dn.xlarge"  # Tesla T4, 4 vCPU, 16GB RAM, ~$0.526/hour
AMI_ID="ami-0c2ab3b8efb09f272"  # Ubuntu 22.04 LTS (update for your region)
KEY_NAME="whynot-ec2-key"
SECURITY_GROUP="whynot-ffmpeg-worker-sg"
SUBNET_ID="subnet-xxxxx"  # Replace with your subnet

echo "🚀 Launching EC2 instance..."

# Create security group (if not exists)
aws ec2 create-security-group \
  --group-name $SECURITY_GROUP \
  --description "FFmpeg Worker with GPU" \
  || echo "Security group already exists"

# Allow health check port
aws ec2 authorize-security-group-ingress \
  --group-name $SECURITY_GROUP \
  --protocol tcp \
  --port 3001 \
  --cidr 0.0.0.0/0 \
  || echo "Rule already exists"

# Launch instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type $INSTANCE_TYPE \
  --key-name $KEY_NAME \
  --security-groups $SECURITY_GROUP \
  --user-data file://ec2-userdata.sh \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=50}' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=WhyNot-FFmpeg-Worker}]' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "✅ Instance launched: $INSTANCE_ID"
echo "⏳ Waiting for instance to be running..."

aws ec2 wait instance-running --instance-ids $INSTANCE_ID

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "✅ Instance ready!"
echo "📍 Public IP: $PUBLIC_IP"
echo "🔗 Health check: http://$PUBLIC_IP:3001/health"
echo "🔑 SSH: ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP"
```

**Acceptance Criteria**:

- [ ] User data script created
- [ ] Launch script created
- [ ] Security group configuration defined
- [ ] ENV variables template created

---

### Task 3.6: Deploy and Test on AWS EC2 (2-3h)

**Goal**: Deploy to EC2 g4dn.xlarge and validate GPU encoding

**Deployment Steps**:

```bash
# 1. Build and push Docker image
cd ffmpeg-worker
docker build -t YOUR_REGISTRY/whynot-ffmpeg-worker:gpu .
docker push YOUR_REGISTRY/whynot-ffmpeg-worker:gpu

# 2. Launch EC2 instance
cd deploy
chmod +x ec2-launch.sh
./ec2-launch.sh

# Output:
# ✅ Instance launched: i-0abc123...
# 📍 Public IP: 54.123.45.67

# 3. Wait 5-10 minutes for user data script to complete

# 4. SSH into instance
ssh -i ~/.ssh/whynot-ec2-key.pem ubuntu@54.123.45.67

# 5. Check GPU
nvidia-smi

# Expected output:
# +-----------------------------------------------------------------------------+
# | NVIDIA-SMI 525.xx       Driver Version: 525.xx       CUDA Version: 12.0    |
# |-------------------------------+----------------------+----------------------+
# | GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
# | Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
# |===============================+======================+======================|
# |   0  Tesla T4            Off  | 00000000:00:1E.0 Off |                    0 |
# | N/A   32C    P0    26W /  70W |      0MiB / 15360MiB |      0%      Default |
# +-------------------------------+----------------------+----------------------+

# 6. Check Docker container
docker logs -f whynot-ffmpeg-worker

# Expected logs:
# 📦 FFmpegManager service initialized
# ✅ NVIDIA GPU with NVENC support detected
# 🎮 GPU: ✅ Available (NVENC)
# 📹 Video Codec: h264_nvenc

# 7. Test health endpoint
curl http://localhost:3001/health

# 8. Start a stream from UI and monitor
docker logs -f whynot-ffmpeg-worker

# Expected:
# 🎬 Starting stream for channel X
# 🌐 Launching headless browser for channel X
# ✅ Joined Agora channel
# 📹 Captured 30 frames (current FPS: 30.5)  # Should reach 30 FPS with GPU!
```

**Performance Validation**:

```bash
# Monitor GPU usage
watch -n 1 nvidia-smi

# Expected with 1 stream:
# GPU-Util: 10-15%
# Memory-Usage: ~500MB
# Temp: ~40-50°C

# Monitor Docker stats
docker stats whynot-ffmpeg-worker

# Expected with 1 stream (GPU mode):
# CPU: ~25%  (much lower than CPU mode's ~80%)
# Memory: ~2.5GB
```

**Cost Analysis**:

| Config          | Instance       | Streams | Cost/month | Cost/stream |
| --------------- | -------------- | ------- | ---------- | ----------- |
| CPU (Render)    | Pro ($85)      | 2-3     | $85        | $28-42      |
| GPU (EC2)       | g4dn.xlarge    | 15-20   | $380       | $19-25      |
| GPU (3x EC2)    | 3× g4dn.xlarge | 50-60   | $1,140     | $19-23      |
| Current (Agora) | N/A            | 50      | $540       | $10.80      |

**Acceptance Criteria**:

- [ ] EC2 instance launched successfully
- [ ] NVIDIA drivers installed
- [ ] Docker container runs with GPU access
- [ ] Worker detects GPU and uses h264_nvenc
- [ ] Frame capture reaches 30 FPS (vs 10 FPS CPU)
- [ ] GPU utilization 10-15% per stream
- [ ] Can handle 15+ concurrent streams
- [ ] Cost per stream competitive with current solution

---

## ✅ Phase 3 Completion Checklist

- [ ] Dockerfile with NVIDIA CUDA + FFmpeg NVENC created
- [ ] Auto-detection GPU/CPU implemented in FFmpegManager
- [ ] docker-compose.yml updated (CPU fallback for local)
- [ ] Local testing successful (CPU mode, 640x360@10fps)
- [ ] EC2 deployment scripts created
- [ ] EC2 instance deployed with GPU support
- [ ] GPU encoding validated (720p@30fps)
- [ ] Performance metrics documented
- [ ] Cost analysis completed

---

## 📊 Estimated vs Actual Time

| Task      | Estimated | Actual | Notes |
| --------- | --------- | ------ | ----- |
| 3.1       | 2h        |        |       |
| 3.2       | 1h        |        |       |
| 3.3       | 30min     |        |       |
| 3.4       | 1-2h      |        |       |
| 3.5       | 1h        |        |       |
| 3.6       | 2-3h      |        |       |
| **Total** | **6-8h**  |        |       |

---

## 🎮 Local Development: Will It Work?

**✅ YES** - The Docker image works locally with automatic CPU fallback:

### With GPU (NVIDIA GPU on host):

```bash
# Run with GPU access
docker run --gpus all whynot-ffmpeg-worker

# Logs:
# ✅ NVIDIA GPU with NVENC support detected
# 🎮 GPU: ✅ Available (NVENC)
# 📹 Video Codec: h264_nvenc
# Performance: 720p @ 30 FPS, GPU-Util 10-15%
```

### Without GPU (Mac, Windows, Linux without NVIDIA):

```bash
# Run normally (no --gpus flag)
docker run whynot-ffmpeg-worker

# Logs:
# ℹ️  No NVIDIA GPU detected - using CPU encoding
# 🎮 GPU: ❌ Not available (CPU)
# 📹 Video Codec: libx264
# Performance: 640x360 @ 10 FPS, CPU 80-100%
```

**The exact same image** works in both scenarios:

- **AWS EC2 g4dn** → Auto-detects GPU → Uses NVENC → Full performance
- **Local Mac/PC** → No GPU found → Fallback CPU → Reduced performance but functional

---

## 🐛 Known Issues & Mitigations

| Issue                            | Impact | Mitigation                          | Status |
| -------------------------------- | ------ | ----------------------------------- | ------ |
| CPU mode limited to 10 FPS       | Medium | Use GPU for production              | ✓      |
| Puppeteer requires 2-4GB RAM     | Medium | Set memory limit to 4GB             | ✓      |
| FFmpeg NVENC requires NVIDIA GPU | High   | Auto-fallback to libx264 on CPU     | ✓      |
| EC2 g4dn costs $380/month        | Medium | Only deploy when scaling >5 streams | -      |

---

## 🔄 Next Phase

After completing Phase 3 and validating on AWS EC2, proceed to **Phase 4: Production Optimization & Monitoring**:

- Implement auto-scaling based on Redis queue depth
- Add CloudWatch monitoring and alerting
- Optimize Puppeteer memory usage
- Test with 50+ concurrent streams
- Fine-tune NVENC settings for quality/performance balance
