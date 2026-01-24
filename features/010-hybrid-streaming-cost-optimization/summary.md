# Feature 010: Hybrid Streaming Cost Optimization - Summary

## Overview

Implement a hybrid streaming architecture that keeps Agora for sellers (high quality, low latency) while using RTMP → HLS/CDN for buyers to drastically reduce per-viewer costs and enable unlimited scalability.

## User Story

**As a platform operator**, I want to reduce streaming costs by serving buyers through CDN/HLS instead of direct Agora connections, so that we can scale to thousands of concurrent viewers without exponential cost increases.

**As a seller**, I want to continue using high-quality, low-latency video streaming to interact with my audience, so that my live selling experience remains professional and responsive.

**As a buyer**, I want to watch live streams reliably and at scale, even if it means accepting a slight latency increase (10-30s), so that I can participate in live shopping events.

## Business Goal

- 💰 **Cost Reduction**: Reduce variable costs from ~$X per viewer to fixed cost of ~$50-200/month
- 📈 **Scalability**: Support 1,000+ concurrent viewers per channel without cost explosion
- 🎯 **Predictability**: Move from unpredictable per-minute billing to fixed infrastructure costs
- 🚀 **Growth Enablement**: Remove financial barrier to large-scale live events
- ⚡ **Seller Quality**: Maintain premium streaming experience for content creators

## Technical Architecture

```
┌─────────────┐
│   SELLER    │ (Agora WebRTC - Low latency, high quality)
│  (Web App)  │
└──────┬──────┘
       │
       │ Agora RTC
       ▼
┌─────────────────────────────────────────────┐
│         Agora Cloud Platform                │
│  (Seller publishes audio/video stream)      │
└──────────────────┬──────────────────────────┘
                   │
                   │ Single Agora Viewer Connection
                   ▼
┌─────────────────────────────────────────────┐
│      Backend Relay Service (Node.js)        │
│  - Connects to Agora as single viewer       │
│  - Captures A/V stream                      │
│  - Encodes to RTMP                          │
│  - Pushes to streaming platform             │
└──────────────────┬──────────────────────────┘
                   │
                   │ RTMP Push
                   ▼
┌─────────────────────────────────────────────┐
│   Streaming Platform (Choose one):          │
│   - Cloudflare Stream ($5/1000 mins)        │
│   - AWS IVS ($0.40/hour + bandwidth)        │
│   - Mux Video                               │
└──────────────────┬──────────────────────────┘
                   │
                   │ HLS Distribution
                   ▼
┌─────────────────────────────────────────────┐
│              CDN (Global)                   │
│  - Low cost per GB (~$0.02-0.08/GB)        │
│  - Scales automatically                     │
│  - Edge caching                             │
└──────────────────┬──────────────────────────┘
                   │
                   │ HLS Playback
                   ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   BUYER 1   │  │   BUYER 2   │  │  BUYER N    │
│  (Web App)  │  │  (Web App)  │  │  (Web App)  │
│  HLS Player │  │  HLS Player │  │  HLS Player │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Progress Tracking

| Phase   | Description                          | Est. Time | Status      |
| ------- | ------------------------------------ | --------- | ----------- |
| Phase 1 | Research & Architecture Design       | 3-4 hours | 📝 PLANNING |
| Phase 2 | Backend Relay Service (Agora → RTMP) | 6-8 hours | 📝 PLANNING |
| Phase 3 | Streaming Platform Integration       | 4-5 hours | 📝 PLANNING |
| Phase 4 | Frontend HLS Player for Buyers       | 3-4 hours | 📝 PLANNING |
| Phase 5 | Dual-Mode Channel System             | 4-5 hours | 📝 PLANNING |
| Phase 6 | Monitoring & Cost Tracking           | 3-4 hours | 📝 PLANNING |
| Phase 7 | Testing & Optimization               | 4-5 hours | 📝 PLANNING |

**Total Estimated Time**: 27-35 hours

---

## UI/UX Components

### ✅ Completed

- None yet

### ⏳ Remaining

#### Seller View (No changes - keeps Agora)

- Existing Agora-based streaming interface
- New: Stream health indicators for RTMP relay
- New: Viewer count (HLS viewers + Agora viewers if any)

#### Buyer View (New HLS Player)

- **LiveChannelHLS** component (replaces Agora for buyers)
- HLS video player with hls.js
- Latency indicator badge ("~15s delay")
- Buffering/loading states
- Quality selector (auto, 1080p, 720p, 480p)
- Playback controls (play/pause, volume, fullscreen)
- Connection quality indicator
- Fallback UI for unsupported browsers

#### Admin/Monitoring Dashboard

- Real-time cost tracking
- Concurrent viewer metrics (Agora vs HLS)
- Stream health monitoring
- RTMP relay status
- Bandwidth usage graphs

---

## API/Backend Changes

### New Services

#### `RelayService` (src/services/relayService.ts)

- `startRelay(channelId, agoraToken)`: Start Agora → RTMP relay
- `stopRelay(channelId)`: Stop relay and cleanup
- `getRelayStatus(channelId)`: Check if relay is running
- `getStreamMetrics(channelId)`: Get viewer count, bitrate, health

#### `StreamingPlatformService` (src/services/streamingPlatformService.ts)

- `createLiveStream(channelId)`: Create stream on platform (Cloudflare/AWS IVS)
- `getStreamKey()`: Get RTMP push credentials
- `getPlaybackUrl(channelId)`: Get HLS URL for buyers
- `endLiveStream(channelId)`: Terminate stream
- `getStreamAnalytics(channelId)`: Get viewer stats

### Modified Services

#### `ChannelService` (src/services/channelService.ts)

- Add `streamMode` field: `"agora-only"` | `"hybrid"` | `"hls-only"`
- Add `hlsPlaybackUrl` field
- Add `relayStatus` field: `"starting"` | `"active"` | `"stopped"` | `"error"`
- Modify `createChannel()` to initialize relay
- Modify `endChannel()` to cleanup relay

### New tRPC Routes

#### `relay.start` (POST)

```typescript
input: { channelId: string }
output: { success: boolean, playbackUrl: string }
```

#### `relay.stop` (POST)

```typescript
input: {
  channelId: string;
}
output: {
  success: boolean;
}
```

#### `relay.status` (GET)

```typescript
input: { channelId: string }
output: {
  isActive: boolean,
  viewerCount: number,
  bitrate: number,
  health: "good" | "fair" | "poor"
}
```

#### `streaming.getPlaybackUrl` (GET)

```typescript
input: { channelId: string }
output: { hlsUrl: string, latency: number }
```

### Database Schema Changes

#### `channels` table (migration)

```sql
ALTER TABLE channels ADD COLUMN stream_mode VARCHAR(20) DEFAULT 'hybrid';
ALTER TABLE channels ADD COLUMN hls_playback_url VARCHAR(500);
ALTER TABLE channels ADD COLUMN relay_status VARCHAR(20);
ALTER TABLE channels ADD COLUMN relay_started_at TIMESTAMP;
ALTER TABLE channels ADD COLUMN streaming_platform VARCHAR(50);
ALTER TABLE channels ADD COLUMN stream_key_id VARCHAR(100);
```

#### New `stream_metrics` table

```sql
CREATE TABLE stream_metrics (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  agora_viewers INTEGER DEFAULT 0,
  hls_viewers INTEGER DEFAULT 0,
  bitrate_kbps INTEGER,
  relay_health VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### External Integrations

#### Option A: Cloudflare Stream

- SDK: `@cloudflare/stream`
- RTMP Push URL: `rtmps://live.cloudflare.com/live/{stream_key}`
- HLS Playback: `https://customer-{id}.cloudflarestream.com/{video_id}/manifest/video.m3u8`
- Cost: ~$5 per 1,000 minutes streamed

#### Option B: AWS IVS (Interactive Video Service)

- SDK: `@aws-sdk/client-ivs`
- RTMP Push URL: `rtmps://{ingest_endpoint}:443/app/{stream_key}`
- HLS Playback: `https://{playback_url}/channel/{channel_arn}.m3u8`
- Cost: ~$0.40/hour + $0.015/GB bandwidth

#### Agora SDK (Modified Usage)

- Relay server acts as single Agora viewer
- Uses existing Agora credentials
- No frontend SDK changes for sellers

---

## Testing Plan

### Unit Tests

#### Backend Relay Service

- [ ] `RelayService.startRelay()` initializes FFmpeg process correctly
- [ ] `RelayService.stopRelay()` cleans up resources
- [ ] `RelayService.getRelayStatus()` returns accurate state
- [ ] Error handling for FFmpeg crashes
- [ ] Error handling for Agora connection failures

#### Streaming Platform Integration

- [ ] Stream creation returns valid RTMP credentials
- [ ] Playback URL generation is correct
- [ ] Stream termination cleanup works
- [ ] Analytics retrieval is accurate

### Integration Tests

- [ ] End-to-end flow: Seller starts channel → Relay activates → HLS URL available
- [ ] Multiple concurrent channels handled correctly
- [ ] Relay survives network interruptions (reconnection logic)
- [ ] Cost tracking records accurate metrics
- [ ] Channel cleanup stops relay and terminates stream

### Manual QA Checklist

#### Seller Experience

- [ ] Seller can start channel normally (no perceived changes)
- [ ] Video/audio quality remains high for seller
- [ ] Latency remains low for seller interactions
- [ ] Stream health indicators update in real-time

#### Buyer Experience (HLS)

- [ ] HLS player loads and plays video smoothly
- [ ] Latency is acceptable (15-30 seconds)
- [ ] Quality switching works (auto, 1080p, 720p, 480p)
- [ ] Buffering recovery is graceful
- [ ] Mobile playback works (iOS Safari, Android Chrome)
- [ ] Fullscreen mode works
- [ ] Audio sync is maintained

#### System Health

- [ ] CPU usage on relay server is acceptable (<70% per stream)
- [ ] Memory usage doesn't leak over time
- [ ] Logs capture errors appropriately
- [ ] Monitoring dashboard shows accurate metrics

### Load Testing

- [ ] 1 seller + 100 HLS buyers - stable
- [ ] 1 seller + 500 HLS buyers - stable
- [ ] 1 seller + 1,000 HLS buyers - stable
- [ ] 5 concurrent channels - system stable
- [ ] Relay server auto-scaling works (if applicable)

### Edge Cases

- [ ] Seller disconnects mid-stream → Relay handles gracefully
- [ ] Relay server crashes → Auto-restart mechanism works
- [ ] Streaming platform outage → Error message to users
- [ ] Network congestion → Quality degrades gracefully
- [ ] Zero buyers watching → Relay still operates (or optimizes)

---

## Success Metrics

### Cost Reduction (Primary Goal)

- **Target**: Reduce cost per 1,000 viewer-hours from ~$1,000-3,000 (Agora) to ~$50-200 (HLS/CDN)
- **Measurement**: Track monthly Agora bill vs streaming platform + CDN costs

### Scalability

- **Target**: Support 1,000+ concurrent buyers per channel without degradation
- **Measurement**: Load testing results, production viewer count logs

### Latency (Acceptable Trade-off)

- **Target**: HLS latency 10-30 seconds (vs 1-3 seconds for Agora)
- **Measurement**: Time-to-first-frame metrics, playback lag tracking

### Reliability

- **Target**: 99.5% uptime for relay service
- **Measurement**: Downtime monitoring, error rate logs

### User Experience

- **Target**: <5% complaint rate about video quality/lag
- **Measurement**: User feedback, support tickets

---

## Cost Analysis

### Current Architecture (Agora Only)

- **Seller**: ~$0.99/1,000 minutes (~$1/hour)
- **Each Buyer**: ~$0.99/1,000 minutes (~$1/hour)
- **100 buyers watching 1 hour**: $101
- **1,000 buyers watching 1 hour**: $1,001
- **Scalability**: ❌ Linear cost per viewer

### New Architecture (Hybrid)

- **Seller**: ~$0.99/hour (unchanged)
- **Relay Server**: ~$0.99/hour (1 Agora viewer)
- **Streaming Platform**: ~$0.40-5/hour (fixed)
- **CDN**: ~$0.02-0.08/GB (~5-20GB/hour for HD)
- **100 buyers watching 1 hour**: ~$3-10
- **1,000 buyers watching 1 hour**: ~$5-15
- **Scalability**: ✅ Mostly fixed cost

### Projected Savings

- **Break-even point**: ~5-10 concurrent buyers
- **At 100 buyers**: ~90% cost reduction
- **At 1,000 buyers**: ~98% cost reduction

---

## Risks & Mitigations

### Risk 1: Increased Latency Impacts User Experience

- **Likelihood**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Clearly communicate latency to buyers ("Live stream has 15s delay")
  - Use low-latency HLS when available (AWS IVS, Cloudflare LL-HLS)
  - Reserve Agora for VIP buyers if needed (hybrid mode)

### Risk 2: Relay Server Becomes Single Point of Failure

- **Likelihood**: Medium
- **Impact**: High
- **Mitigation**:
  - Implement auto-restart on crash
  - Health checks and alerting
  - Consider redundant relay servers for critical streams
  - Fallback to Agora-only mode if relay fails

### Risk 3: FFmpeg/RTMP Encoding Quality Issues

- **Likelihood**: Low-Medium
- **Impact**: Medium
- **Mitigation**:
  - Thoroughly test encoding settings
  - Monitor bitrate and quality metrics
  - Allow seller preview of HLS output
  - Implement adaptive bitrate encoding

### Risk 4: Streaming Platform Vendor Lock-in

- **Likelihood**: High
- **Impact**: Medium
- **Mitigation**:
  - Abstract streaming platform behind service interface
  - Support multiple providers (Cloudflare, AWS IVS, Mux)
  - Use standard RTMP/HLS protocols
  - Plan migration path if needed

### Risk 5: Unexpected CDN Bandwidth Costs

- **Likelihood**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Set up cost alerts and budgets
  - Monitor bandwidth usage in real-time
  - Implement quality caps (max 1080p)
  - Consider P2P delivery for large events (future)

---

## Dependencies

### Technical Dependencies

- **Node.js 18+**: For relay service runtime
- **FFmpeg**: For A/V processing and RTMP encoding
- **Agora SDK**: Existing dependency (no changes)
- **hls.js**: Frontend HLS player library
- **Streaming Platform Account**: Cloudflare Stream or AWS IVS
- **Docker** (optional): For containerized relay service

### External Services

- Agora (existing)
- Cloudflare Stream **OR** AWS IVS (new)
- CDN (included with streaming platform)

### Internal Dependencies

- Existing channel infrastructure (Feature 001)
- User authentication system
- WebSocket infrastructure (for real-time updates)

---

## Rollout Plan

### Phase 1: Alpha (Internal Testing)

- Deploy to staging environment
- Test with internal team (1-2 channels)
- Monitor cost and performance

### Phase 2: Beta (Limited Sellers)

- Invite 5-10 sellers to test
- Hybrid mode: Allow sellers to choose Agora or HLS for buyers
- Gather feedback on latency impact

### Phase 3: General Availability

- Enable HLS for all buyers by default
- Keep Agora as fallback option
- Monitor support tickets and user feedback

### Phase 4: Optimization

- Fine-tune encoding settings
- Optimize relay server resource usage
- Explore LL-HLS for lower latency
- Consider multi-bitrate adaptive streaming

---

## Future Enhancements (Out of Scope)

- 🎯 **Low-Latency HLS**: Reduce latency to 3-5 seconds (Phase 8)
- 🎯 **WebRTC for Premium Buyers**: Hybrid mode with Agora for VIP tier (Phase 9)
- 🎯 **Multi-Bitrate Adaptive Streaming**: Better quality adaptation (Phase 10)
- 🎯 **DVR/Rewind Functionality**: Allow buyers to rewind live stream (Phase 11)
- 🎯 **Stream Recording**: Auto-save VODs for replay (Phase 12)
- 🎯 **P2P Distribution**: Further reduce CDN costs with WebTorrent (Phase 13)

---

## Status

**Overall Status**: 📝 PLANNING

**Next Steps**:

1. Review and approve architecture
2. Choose streaming platform (Cloudflare vs AWS IVS)
3. Set up development environment
4. Begin Phase 1 implementation

**Last Updated**: January 24, 2026
