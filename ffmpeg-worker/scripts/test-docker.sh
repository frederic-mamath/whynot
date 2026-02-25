#!/bin/bash
set -e

echo "🧪 Testing FFmpeg Worker in Docker..."
echo ""

# Step 1: Build images
echo "1️⃣  Building Docker images..."
docker-compose build ffmpeg-worker

# Step 2: Start services
echo ""
echo "2️⃣  Starting services..."
docker-compose up -d postgres redis backend ffmpeg-worker

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Step 3: Check service health
echo ""
echo "3️⃣  Checking service health..."
docker-compose ps

# Step 4: Check FFmpeg worker logs
echo ""
echo "4️⃣  FFmpeg worker logs (last 20 lines):"
docker-compose logs --tail=20 ffmpeg-worker

# Step 5: Test Redis connection
echo ""
echo "5️⃣  Testing Redis connection from worker..."
docker-compose exec -T ffmpeg-worker node -e "
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
echo ""
echo "6️⃣  Testing FFmpeg in container..."
docker-compose exec -T ffmpeg-worker ffmpeg -version | head -n 1

# Step 7: Test Chromium availability
echo ""
echo "7️⃣  Testing Chromium in container..."
docker-compose exec -T ffmpeg-worker google-chrome-stable --version

echo ""
echo "✅ Docker environment validated!"
echo ""
echo "📺 To test live streaming:"
echo "  1. Start a seller stream in the frontend"
echo "  2. Watch logs: docker-compose logs -f ffmpeg-worker"
echo "  3. Verify stream appears on Cloudflare"
echo ""
echo "🛑 To stop services:"
echo "  docker-compose down"
