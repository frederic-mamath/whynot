# Channel Viewers Limitation Investigation

## Problematic

With the current implementation of WhyNot, each live channel involves **three concurrent systems** that must handle every connected viewer:

1. **Agora RTC** — Viewers receive the host's video/audio stream via Agora's cloud infrastructure. Our client uses `mode: "rtc"` (not `"live"`), which is the communication mode designed for small group calls, not broadcast.

2. **WebSocket (ws)** — Each viewer opens a persistent WebSocket connection to our Node.js server for real-time events (chat messages, bids, product highlights, auction updates). All connections for a channel are stored in an in-memory `Map<channelId, Set<WebSocket>>`.

3. **Render Free Tier** — Our single Docker container runs on Render's free plan, which has hard resource constraints (512 MB RAM, shared CPU, auto-sleep after 15 min of inactivity).

The question is: **how many simultaneous viewers can a single channel support before hitting a bottleneck?**

## Questions

### 1. Agora — RTC mode vs Live mode

Our Agora client is created with:

```ts
AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
```

- **`mode: "rtc"`** is designed for video conferencing (all participants can publish). Agora limits RTC channels to **17 users** total (publishers + subscribers).
- **`mode: "live"`** is designed for broadcast scenarios (1 host → many viewers). Agora supports **up to 1 million audience members** in live mode, with hosts limited to 17.

**Impact: This is the primary bottleneck. With `mode: "rtc"`, we are limited to ~17 users per channel (including the host).** Switching to `mode: "live"` with proper audience role assignment would remove this limit on the Agora side.

### 2. WebSocket connections — Server memory

Each WebSocket connection consumes approximately **2-10 KB of RAM** (depending on message buffers). On Render's free tier with **512 MB RAM** (minus Node.js overhead of ~80-100 MB), we can theoretically hold:

- Conservative: ~400 MB available → **~40,000 connections** at 10 KB each
- In practice: GC pressure, broadcast message serialization, and other app memory reduce this to **~5,000–10,000 connections** before performance degrades.

The broadcast function iterates over all connections per channel (`forEach` on the `Set<WebSocket>`), which costs O(n) per emitted event.

### 3. Render Free Tier — CPU and networking

- **Shared CPU**: Under load, response times spike. WebSocket heartbeat and broadcast handling become slower.
- **Auto-sleep**: The free tier spins down after 15 minutes of inactivity. First connection after sleep takes ~30-60 seconds (cold start + Docker boot + DB migration). This kills any "always-on" streaming use case.
- **Bandwidth**: No documented hard bandwidth limit on free tier, but shared infrastructure means throttling is possible under sustained load.
- **Concurrent connections**: No documented hard connection limit, but the 512 MB RAM cap is the effective ceiling.

### 4. Database connection pool

The DB pool is configured with `max: 10` connections. Each API call at join/leave time uses a DB connection (auth check, channel lookup, participant update). Under high concurrency, this pool can be exhausted, causing queued requests and timeouts.

## Expected Results

| Layer                  | Bottleneck                           | Current Limit                  | After `mode: "live"`                    |
| ---------------------- | ------------------------------------ | ------------------------------ | --------------------------------------- |
| **Agora RTC**          | `mode: "rtc"` caps at 17 users       | **~17 viewers**                | Up to 1M (Agora free: 10,000 min/month) |
| **WebSocket (server)** | In-memory connection map, 512 MB RAM | ~5,000–10,000                  | Same                                    |
| **Render Free Tier**   | CPU, RAM (512 MB), auto-sleep        | ~100–500 practical             | Same                                    |
| **DB Pool**            | 10 connections max                   | Slows at ~50+ concurrent joins | Same                                    |

### Current effective limit: **~17 viewers per channel** (blocked by Agora `rtc` mode)

### Recommended actions

1. **Switch Agora to `mode: "live"`** → Assign `host` role to the streamer and `audience` role to viewers. This alone raises the Agora ceiling from 17 to effectively unlimited.
2. **Upgrade Render plan** → The Starter plan ($7/mo) removes auto-sleep and provides dedicated resources. Essential for any production streaming.
3. **Consider Redis for WebSocket state** → If scaling to multiple instances, the in-memory `Map` won't work. Redis pub/sub would allow horizontal scaling.
4. **Increase DB pool** → Raise `max` from 10 to 20-25 on a paid plan with a larger DB.
