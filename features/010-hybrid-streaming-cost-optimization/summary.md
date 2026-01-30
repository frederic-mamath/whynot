# Feature 010: Hybrid Streaming Cost Optimization - Summary

## Overview

Implement a hybrid streaming architecture using **Agora Cloud Recording** that keeps Agora for sellers (high quality, low latency) while using RTMP → HLS/CDN for buyers to drastically reduce per-viewer costs and enable unlimited scalability.

**Solution**: Agora Cloud Recording forwards the stream to Cloudflare Stream via RTMP, which then distributes to buyers via HLS/CDN. This works perfectly with Heroku's basic Eco dyno without FFmpeg installation.

**Future Optimization**: Option B (FFmpeg local relay) can be implemented later to reduce Agora Cloud Recording costs once we outgrow the Eco dyno.

## User Story

**As a platform operator**, I want to reduce streaming costs by serving buyers through CDN/HLS instead of direct Agora connections, so that we can scale to thousands of concurrent viewers without exponential cost increases.

**As a seller**, I want to continue using high-quality, low-latency video streaming to interact with my audience, so that my live selling experience remains professional and responsive.

**As a buyer**, I want to watch live streams reliably and at scale, even if it means accepting a slight latency increase (10-30s), so that I can participate in live shopping events.

## Business Goal

- 💰 **Cost Reduction**: Reduce monthly costs from **$360** to **$37** (90% savings) for 30h streaming with 200 buyers
- 📈 **Scalability**: Support 1,000+ concurrent viewers at **~$1.20/hour** (vs $60/hour with Agora)
- 🎯 **Predictability**: Fixed costs regardless of viewer count (no more viewer-based billing)
- 🚀 **Growth Enablement**: Remove financial barrier to large-scale live events
- ⚡ **Seller Quality**: Maintain premium streaming experience for content creators (no changes)
- 🔧 **Heroku Compatible**: Works with existing Eco dyno, no infrastructure changes needed

## Technical Architecture

### ✅ Chosen Solution: Agora Cloud Recording

**Deployment**: Heroku Eco dyno (512 MB RAM, $5/month) - No upgrades needed!

**Why this works perfectly for Heroku**:

- ✅ No FFmpeg installation required
- ✅ No CPU/RAM overhead on dyno
- ✅ Managed by Agora (reliable, scalable)
- ✅ Simple API integration
- ✅ Handles multiple concurrent streams without dyno upgrade

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
│  - Seller publishes audio/video stream      │
│  - Cloud Recording Service (managed)        │
│  - RTMP Forward feature enabled             │
└──────────────────┬──────────────────────────┘
                   │
                   │ RTMP Push (Agora → Cloudflare)
                   ▼
┌─────────────────────────────────────────────┐
│   Streaming Platform (Cloudflare Stream)    │
│  - Receives RTMP from Agora                 │
│  - Transcodes to HLS                        │
│  - Distributes via CDN                      │
└──────────────────┬──────────────────────────┘
                   │
                   │ HLS Distribution
                   ▼
┌─────────────────────────────────────────────┐
│         Cloudflare CDN (Global)             │
│  - Edge caching                             │
│  - Low cost per GB                          │
└──────────────────┬──────────────────────────┘
                   │
                   │ HLS Playback
                   ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   BUYER 1   │  │   BUYER 2   │  │  BUYER N    │
│  (Web App)  │  │  (Web App)  │  │  (Web App)  │
│  HLS Player │  │  HLS Player │  │  HLS Player │
└─────────────┘  └─────────────┘  └─────────────┘

┌────────────────────────────────────┐
│  Heroku Dyno (Node.js Backend)     │
│  - Manages Agora Cloud Recording   │
│  - Starts/stops RTMP forwarding    │
│  - Tracks stream metadata          │
│  - No FFmpeg required ✅           │
│  - Works with Eco dyno ($5/mo) ✅  │
└────────────────────────────────────┘
```

---

<details>
<summary><strong>Alternative: Option B - FFmpeg Local Relay (Future Optimization)</strong></summary>

This option can be implemented later to eliminate Agora Cloud Recording costs (~$1.49/1000 mins) once we scale beyond the Eco dyno.

### Architecture Option B: FFmpeg Local Relay

```
┌─────────────┐
│   SELLER    │ (Agora WebRTC)
└──────┬──────┘
       │ Agora RTC
       ▼
┌─────────────────────────────────────────────┐
│         Agora Cloud Platform                │
└──────────────────┬──────────────────────────┘
                   │ Single Agora Viewer
                   ▼
┌─────────────────────────────────────────────┐
│  Heroku Dyno (Node.js + FFmpeg Buildpack)  │
│  - Connects to Agora as viewer              │
│  - Captures A/V with FFmpeg                 │
│  - Encodes to RTMP                          │
│  ⚠️ Requires: FFmpeg buildpack              │
│  ⚠️ Limit: 1-2 concurrent streams max       │
└──────────────────┬──────────────────────────┘
                   │ RTMP Push
                   ▼
┌─────────────────────────────────────────────┐
│         Cloudflare Stream / AWS IVS         │
└──────────────────┬──────────────────────────┘
                   │ HLS Distribution
                   ▼
                 Buyers
```

**Advantages**:

- ✅ No additional Agora Cloud Recording cost
- ✅ Full control over encoding

**Disadvantages**:

- ❌ Requires FFmpeg buildpack setup
- ❌ High CPU/RAM usage (~300-500 MB per stream)
- ❌ Limited to 1-2 concurrent streams on Eco dyno
- ❌ May need Performance dyno upgrade ($25+/month)
- ❌ More complex maintenance

**When to consider**: When monthly Agora Cloud Recording costs exceed Performance dyno upgrade costs (~$25/month), or when you need >3 concurrent streams.

</details>

## Progress Tracking

| Phase   | Description                       | Est. Time | Status         |
| ------- | --------------------------------- | --------- | -------------- |
| Phase 1 | Research & Architecture Design    | 3-4 hours | ✅ COMPLETED   |
| Phase 2 | Agora Cloud Recording Integration | 4-6 hours | ✅ COMPLETED   |
| Phase 3 | Cloudflare Stream Integration     | 3-4 hours | ✅ COMPLETED   |
| Phase 4 | Frontend HLS Player for Buyers    | 3-4 hours | ✅ COMPLETED   |
| Phase 5 | Dual-Mode Channel System          | 3-4 hours | 📝 PLANNING    |
| Phase 6 | Monitoring & Cost Tracking        | 3-4 hours | 📝 PLANNING    |
| Phase 7 | Testing & Optimization            | 4-5 hours | 📝 PLANNING    |

**Total Estimated Time**: 23-31 hours (reduced from 27-35h thanks to no FFmpeg!)

**Completed**: 13-18 hours (Phases 1-4)  
**Remaining**: 10-13 hours (Phases 5-7)

---

## UI/UX Components

### ✅ Completed

#### Buyer View (HLS Player)
- **HLSVideoPlayer** component with hls.js integration
- Video player with play/pause, volume, mute, fullscreen controls
- Quality selector (Auto, 1080p, 720p, 480p)
- Latency badge ("~15-30s delay")
- Buffering indicator with spinner
- Error handling with user-friendly messages
- Mobile support (playsInline, touch-friendly controls)
- Safari native HLS support

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

### 📊 Target Scenario: 200 Concurrent Buyers

**Assumptions**:

- 30 hours of live streaming per month
- Average 200 concurrent buyers per stream
- 720p video quality

#### Current Architecture (Agora Only) ❌

**Per Stream Hour (200 buyers)**:

- Seller: $0.06
- 200 Buyers: 200 × $0.06 = **$12.00**
- **Total per hour**: **$12.06**

**Monthly Cost (30 hours)**:

- 30 hours × $12.06 = **$361.80**
- **Scalability**: ❌ Cost grows linearly with viewers

---

#### New Architecture: Agora Cloud Recording ✅

**Per Stream Hour (200 buyers)**:

- Seller (Agora WebRTC): $0.06
- Agora Cloud Recording: $0.09
- Cloudflare Stream (RTMP → HLS): $0.30
- CDN bandwidth (200 viewers @ 720p): $0.60
- Heroku Eco dyno: $0.007 (amortized)
- **Total per hour**: **~$1.05**

**Monthly Cost (30 hours)**:

- Streaming costs: 30 × $1.05 = **$31.50**
- Heroku Eco dyno: **$5.00**
- **Monthly Total**: **~$36.50**

**💰 Savings**: $361.80 - $36.50 = **$325.30/month (90% reduction)**

---

### Detailed Cost Breakdown

| Component                 | Cost            | Billing Model          | Notes                            |
| ------------------------- | --------------- | ---------------------- | -------------------------------- |
| **Agora (Seller)**        | $0.99/1000 mins | Per participant-minute | Unchanged                        |
| **Agora Cloud Recording** | $1.49/1000 mins | Per recording minute   | New cost, but saves buyer costs  |
| **Cloudflare Stream**     | $5/1000 mins    | Per stream minute      | Fixed per stream, not per viewer |
| **Cloudflare CDN**        | Included        | Bandwidth included     | Up to reasonable limits          |
| **Heroku Eco Dyno**       | $5/month        | Fixed monthly          | No upgrade needed                |

---

### Scalability Comparison

| Viewers          | Agora Only  | Hybrid (Cloud Recording) | Savings          |
| ---------------- | ----------- | ------------------------ | ---------------- |
| **10 buyers**    | $0.66/hour  | $1.05/hour               | Break-even point |
| **50 buyers**    | $3.06/hour  | $1.05/hour               | 66%              |
| **100 buyers**   | $6.06/hour  | $1.05/hour               | 83%              |
| **200 buyers**   | $12.06/hour | $1.05/hour               | **91%** ⭐       |
| **500 buyers**   | $30.06/hour | $1.05/hour               | 96%              |
| **1,000 buyers** | $60.06/hour | $1.20/hour               | 98%              |

**Key Insight**: Costs become nearly **fixed** regardless of viewer count!

---

### Future Optimization (Option B)

Once monthly costs exceed ~$25, consider implementing Option B (FFmpeg local relay) to eliminate Agora Cloud Recording costs:

**Option B Monthly (30h, 200 buyers)**:

- Seller (Agora): $1.80
- Cloudflare Stream: $9.00
- CDN: $18.00
- Performance-M dyno: $25.00
- **Total**: **~$53.80**
- **Additional savings vs Option A**: ~$17/month

**Recommendation**: Start with Option A, implement Option B when streaming >50 hours/month.

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
  - **Option A**: Agora Cloud Recording handles this (managed service)
  - **Option B**: Implement auto-restart on crash, health checks
  - Fallback to Agora-only mode if relay fails
  - Monitor Heroku dyno health

### Risk 6: Heroku Resource Limitations (NEW)

- **Likelihood**: High (if using Option B with multiple streams)
- **Impact**: Medium-High
- **Mitigation**:
  - **Use Option A** (Agora Cloud Recording) to avoid this entirely
  - If using Option B: Limit concurrent streams to 1-2 on Eco dyno
  - Monitor dyno memory/CPU usage with Heroku metrics
  - Implement queue system for multiple concurrent streams
  - Upgrade to Performance dyno if needed ($25/month)

### Risk 7: Heroku Dyno Restarts

- **Likelihood**: Medium (Heroku restarts dynos ~daily)
- **Impact**: Low-Medium
- **Mitigation**:
  - Gracefully handle dyno restarts
  - Persist relay state in database
  - Auto-reconnect to Agora on restart
  - Notify sellers of temporary interruption

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

### Technical Dependencies (Option A)

- **Node.js 18+**: For backend API (already have)
- **Agora SDK**: Existing dependency (no changes)
- **Agora Cloud Recording API**: RESTful API, no new SDK needed
- **hls.js**: Frontend HLS player library
- **Streaming Platform Account**: Cloudflare Stream
- **Heroku Eco Dyno**: $5/month (current setup works!)

### External Services

- **Agora** (existing)
  - For Option A: + Cloud Recording service
- **Cloudflare Stream** (recommended) **OR** AWS IVS (alternative)
- **CDN** (included with streaming platform)

### Internal Dependencies

- Existing channel infrastructure (Feature 001)
- User authentication system
- WebSocket infrastructure (for real-time updates)

### Heroku Setup (Simple!)

```bash
# No buildpacks needed - works with your current setup!

# Add environment variables
heroku config:set AGORA_APP_ID=your_app_id
heroku config:set AGORA_APP_CERTIFICATE=your_certificate
heroku config:set AGORA_CUSTOMER_ID=your_customer_id
heroku config:set AGORA_CUSTOMER_SECRET=your_customer_secret
heroku config:set CLOUDFLARE_STREAM_ACCOUNT_ID=your_account_id
heroku config:set CLOUDFLARE_STREAM_API_TOKEN=your_token
```

That's it! No dyno upgrades, no buildpacks, just environment variables.

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

### Cost Optimization

- 🎯 **Option B: FFmpeg Local Relay**: Eliminate Agora Cloud Recording costs (~$1.49/1000 mins) by handling relay locally. Consider when streaming >50 hours/month or when Agora costs exceed Performance dyno upgrade.

### Feature Enhancements

- 🎯 **Low-Latency HLS**: Reduce latency to 3-5 seconds using AWS IVS or Cloudflare LL-HLS
- 🎯 **WebRTC for Premium Buyers**: Hybrid mode with Agora for VIP tier (low latency for paying customers)
- 🎯 **Multi-Bitrate Adaptive Streaming**: Better quality adaptation based on viewer connection
- 🎯 **DVR/Rewind Functionality**: Allow buyers to rewind live stream
- 🎯 **Stream Recording**: Auto-save VODs for replay
- 🎯 **P2P Distribution**: Further reduce CDN costs with WebTorrent for large events

---

## Status

**Overall Status**: 📝 PLANNING

**Next Steps**:

1. Review and approve architecture
2. Choose streaming platform (Cloudflare vs AWS IVS)
3. Set up development environment
4. Begin Phase 1 implementation

**Last Updated**: January 24, 2026
