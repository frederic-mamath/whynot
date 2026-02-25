# WhyNot FFmpeg Worker

FFmpeg-based RTMP relay worker for WhyNot streaming platform.

## Overview

This service consumes stream jobs from Redis and spawns FFmpeg processes to convert RTC streams to RTMP for Cloudflare Stream delivery.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start in development mode
npm run dev
```

### Docker

```bash
# Build image
docker build -t whynot-ffmpeg-worker .

# Run container
docker run --rm \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -p 3001:3001 \
  whynot-ffmpeg-worker
```

### With Docker Compose

```bash
# From project root
docker compose up -d ffmpeg-worker
```

## Configuration

Environment variables (see `.env.example`):

- `REDIS_URL` - Redis connection string (required)
- `MAX_CONCURRENT_STREAMS` - Maximum concurrent FFmpeg processes (default: 10)
- `FFMPEG_LOG_LEVEL` - FFmpeg log verbosity (default: warning)
- `PORT` - HTTP health check port (default: 3001)
- `LOG_LEVEL` - Application log level (default: info)

## Endpoints

- `GET /health` - Health check (returns 200 if healthy, 503 if degraded)
- `GET /streams` - List active streams
- `GET /stats` - Worker statistics

## Architecture

```
Redis Queue → RedisConsumer → FFmpegManager → FFmpeg Processes → RTMP
                                    ↓
                            HealthServer (HTTP)
```

## Development

```bash
# Type check
npm run type-check

# Build
npm run build

# Run production build
npm start
```

## Testing

See [phase-1-ffmpeg-worker-setup.md](../features/011-ffmpeg-worker-implementation/phase-1-ffmpeg-worker-setup.md) for testing instructions.

## Related Documentation

- [Feature 011 Summary](../features/011-ffmpeg-worker-implementation/summary.md)
- [Phase 1: FFmpeg Worker Setup](../features/011-ffmpeg-worker-implementation/phase-1-ffmpeg-worker-setup.md)
- [ADR-001: Custom FFmpeg RTMP Relay](../docs/adr/001-custom-ffmpeg-rtmp-relay.md)
