#!/bin/bash
set -e

echo "🐳 Building FFmpeg Worker Docker image..."

# Build with CPU encoding support
docker build \
  --platform linux/amd64 \
  -t whynot-ffmpeg-worker:latest \
  -t whynot-ffmpeg-worker:cpu \
  -f Dockerfile \
  .

echo "✅ Docker image built successfully!"
echo "📦 Image: whynot-ffmpeg-worker:latest"
echo ""
echo "🔍 Image size:"
docker images whynot-ffmpeg-worker:latest

echo ""
echo "🧪 Quick verification:"
echo "  docker run --rm whynot-ffmpeg-worker:latest node --version"
echo "  docker run --rm whynot-ffmpeg-worker:latest ffmpeg -version | head -n 1"
echo "  docker run --rm whynot-ffmpeg-worker:latest google-chrome-stable --version"
