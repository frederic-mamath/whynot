# PDR-001: Buyer Viewing Experience - HLS vs RTC

**Status**: ✅ Accepted  
**Date**: 2026-02-16  
**Decision Makers**: Frederic Mamath  
**Stakeholders**: Sellers (streamers), Buyers (viewers), Business/Finance

---

## Context

WhyNot is a live shopping platform where sellers stream live video to sell products to buyers. The initial architecture used **Agora RTC for both sellers and buyers**, providing low latency (~300ms) for everyone.

### The Problem: Cost Scalability

As the platform scales, the all-RTC approach becomes prohibitively expensive because:

1. **Each buyer costs the same as a seller** ($0.99/1000 minutes)
2. **Buyer-to-seller ratio is high** (typically 30-1000 buyers per stream)
3. **Costs scale linearly** with viewer count

**Example scenario (50 sellers × 30 buyers × 3h/day)**:
- Monthly cost: **$8,286**
- 97% of cost is buyer viewing ($8,019 for buyers vs $267 for sellers)
- At 1,000 sellers: **$165,726/month** - unsustainable for early-stage business

### Business Constraint

To build a profitable business, we need to:
- Reduce streaming costs by at least 80%
- Maintain seller experience quality (low latency for sellers)
- Accept reasonable trade-offs for buyer experience

---

## Decision

**Switch buyers from Agora RTC to HLS (HTTP Live Streaming) via Cloudflare Stream**, while keeping sellers on Agora RTC.

### Architecture

```
Seller (RTC) → Agora RTC → RTMP Converter → Cloudflare Stream → Buyers (HLS)
```

**Components**:
1. **Sellers**: Continue using Agora RTC SDK (low latency, high quality)
2. **Agora RTMP Converter**: Convert seller's RTC stream to RTMP in real-time
3. **Cloudflare Stream**: Receive RTMP, transcode to HLS, distribute via CDN
4. **Buyers**: Watch via HLS.js player in browser (no SDK needed)

**Key Trade-off**: Buyers experience **10-30 second latency** instead of 300ms, but costs are reduced by **89%**.

---

## Alternatives Considered

### Alternative 1: Keep All-RTC (Status Quo)

**Pros**:
- ✅ Ultra-low latency for everyone (~300ms)
- ✅ Two-way communication possible
- ✅ Already implemented and working
- ✅ Best UX for buyers

**Cons**:
- ❌ **Prohibitively expensive** at scale
- ❌ Linear cost scaling with viewers
- ❌ Unsustainable business model

**Cost**: See detailed tables below

### Alternative 2: Custom RTMP Relay Server

Build a custom Node.js server with FFmpeg to convert RTC to RTMP.

**Pros**:
- ✅ Full control over conversion
- ✅ Lower per-minute costs (no Agora RTMP Converter fee)

**Cons**:
- ❌ Complex infrastructure (FFmpeg, containers, scaling)
- ❌ High development time (2-4 weeks)
- ❌ Server hosting costs ($200-500/month)
- ❌ Maintenance burden
- ❌ Not cost-effective until 500+ concurrent streams

**Verdict**: Premature optimization - Agora RTMP Converter is simpler for MVP

### Alternative 3: Hybrid (Smart Routing)

Route small streams to RTC, large streams to HLS based on viewer count.

```typescript
if (viewerCount < 10) {
  useAgoraRTC(); // Low latency for small audiences
} else {
  useRTMPConverter(); // Cost efficiency for large audiences
}
```

**Pros**:
- ✅ Best of both worlds
- ✅ Optimizes for both UX and cost

**Cons**:
- ❌ Complex implementation (dual systems)
- ❌ Need to handle viewer transitions
- ❌ Not needed for MVP (can add later)

**Verdict**: Good future optimization, but adds complexity to MVP

---

## Cost Analysis

### Scenario: 3 Hours/Day Streaming

**Assumptions**:
- Each seller streams 3 hours/day (5,400 min/month)
- Agora RTC: $0.99/1000 min (HD video)
- Agora RTMP Converter: $2.00/1000 min (estimated)
- Cloudflare Stream: $0.01/1000 min (volume pricing)
- AWS S3: $0 (not used for live streaming)

### Cost Comparison Table - All Scenarios

| Sellers | Buyers/Stream | Option | Seller RTC | Buyer RTC | RTMP Converter | Cloudflare HLS | **Total/Month** | Savings |
|---------|---------------|--------|------------|-----------|----------------|----------------|-----------------|---------|
| **5** | **30** | All-RTC | $26.73 | $801.90 | - | - | **$828.63** | - |
| | | RTMP+HLS | $26.73 | - | $54.00 | $8.10 | **$88.83** | **89%** |
| **5** | **200** | All-RTC | $26.73 | $5,346.00 | - | - | **$5,372.73** | - |
| | | RTMP+HLS | $26.73 | - | $54.00 | $54.00 | **$134.73** | **97%** |
| **5** | **1000** | All-RTC | $26.73 | $26,730.00 | - | - | **$26,756.73** | - |
| | | RTMP+HLS | $26.73 | - | $54.00 | $270.00 | **$350.73** | **99%** |
| **50** | **30** | All-RTC | $267.30 | $8,019.00 | - | - | **$8,286.30** | - |
| | | RTMP+HLS | $267.30 | - | $540.00 | $81.00 | **$888.30** | **89%** |
| **50** | **200** | All-RTC | $267.30 | $53,460.00 | - | - | **$53,727.30** | - |
| | | RTMP+HLS | $267.30 | - | $540.00 | $540.00 | **$1,347.30** | **97%** |
| **50** | **1000** | All-RTC | $267.30 | $267,300.00 | - | - | **$267,567.30** | - |
| | | RTMP+HLS | $267.30 | - | $540.00 | $2,700.00 | **$3,507.30** | **99%** |
| **500** | **30** | All-RTC | $2,673.00 | $80,190.00 | - | - | **$82,863.00** | - |
| | | RTMP+HLS | $2,673.00 | - | $5,400.00 | $810.00 | **$8,883.00** | **89%** |
| **500** | **200** | All-RTC | $2,673.00 | $534,600.00 | - | - | **$537,273.00** | - |
| | | RTMP+HLS | $2,673.00 | - | $5,400.00 | $5,400.00 | **$13,473.00** | **97%** |
| **500** | **1000** | All-RTC | $2,673.00 | $2,673,000.00 | - | - | **$2,675,673.00** | - |
| | | RTMP+HLS | $2,673.00 | - | $5,400.00 | $27,000.00 | **$35,073.00** | **99%** |
| **5000** | **30** | All-RTC | $26,730.00 | $801,900.00 | - | - | **$828,630.00** | - |
| | | RTMP+HLS | $26,730.00 | - | $54,000.00 | $8,100.00 | **$88,830.00** | **89%** |
| **5000** | **200** | All-RTC | $26,730.00 | $5,346,000.00 | - | - | **$5,372,730.00** | - |
| | | RTMP+HLS | $26,730.00 | - | $54,000.00 | $54,000.00 | **$134,730.00** | **97%** |
| **5000** | **1000** | All-RTC | $26,730.00 | $26,730,000.00 | - | - | **$26,756,730.00** | - |
| | | RTMP+HLS | $26,730.00 | - | $54,000.00 | $270,000.00 | **$350,730.00** | **99%** |

### Visual Comparison (50 Sellers × 200 Buyers)

```
Monthly Costs:

All-RTC:         $53,727  ████████████████████████████████████████████████████
RTMP+HLS:         $1,347  █                    (97% savings: $52,380/month)
```

### Break-Even Analysis

**When does RTMP+HLS become cheaper?**

With Cloudflare volume pricing, RTMP+HLS is **always cheaper** starting at ~3 buyers per stream.

| Buyers/Stream | Break-Even Point |
|---------------|------------------|
| 3+ buyers     | ✅ RTMP+HLS wins |
| 10+ buyers    | ✅ 85% savings   |
| 100+ buyers   | ✅ 95% savings   |
| 1000+ buyers  | ✅ 99% savings   |

---

## Consequences

### Positives

1. **💰 Massive Cost Savings**: 89-99% reduction in streaming costs
2. **📈 Linear Scalability**: Costs scale with sellers, not viewers
3. **🌍 Global CDN**: Cloudflare delivers HLS worldwide efficiently
4. **📱 Universal Compatibility**: HLS works on all browsers without SDK
5. **🔧 Simpler Buyer UX**: No app installation, just open URL
6. **💼 Sustainable Business**: Allows profitability at scale

### Negatives

1. **⏱️ Increased Latency**: Buyers experience 10-30s delay (vs 300ms RTC)
2. **🚫 No Two-Way Audio**: Buyers can't speak to seller (one-way only)
3. **📊 More Complex Architecture**: 3 services instead of 1 (Agora + Cloudflare + RTMP Converter)
4. **🔐 Account Dependencies**: Requires Agora RTMP Converter activation (currently blocked - 403 error)
5. **💵 Volume Pricing Needed**: Cloudflare volume pricing critical (standard pricing is expensive)

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Agora RTMP Converter unavailable | Medium | High | Contact Agora support (in progress) |
| Latency impacts engagement | Low | Medium | Live shopping tolerates delay better than gaming |
| RTMP Converter pricing increases | Low | Medium | Can build custom relay if needed |
| Cloudflare Stream outage | Low | High | Multi-CDN strategy long-term |
| Buyer complaints about delay | Medium | Low | Set expectations in UI ("Live in 20s") |

### Technical Debt

- Need to handle RTMP Converter failures gracefully
- Should implement fallback to RTC if RTMP fails
- Need monitoring for HLS stream health
- Cost tracking dashboard required

---

## Success Metrics

**How we'll measure success**:

### Business Metrics

1. **Cost per Stream**: Target < $20/month per active seller
2. **Viewer Retention**: > 70% viewers watch beyond 2 minutes
3. **Conversion Rate**: Product purchases per stream (baseline: TBD)
4. **Monthly Burn Rate**: Streaming costs < 20% of revenue

### Technical Metrics

1. **Stream Success Rate**: > 99% streams start successfully
2. **HLS Latency**: Average < 20 seconds from seller to buyer
3. **Playback Errors**: < 1% of viewer sessions
4. **RTMP Converter Uptime**: > 99.9%

### User Experience Metrics

1. **Buyer Satisfaction**: Survey score > 4/5 for video quality
2. **Seller Satisfaction**: Survey score > 4.5/5 for streaming experience
3. **Time to First Byte**: HLS manifest loads in < 2s
4. **Buffer Ratio**: < 5% of playback time spent buffering

**Review Period**: 30 days after launch, then quarterly

---

## Implementation Notes

### Current Status

- ✅ Code implemented: `AgoraMediaPushService` and `RecordingManager` refactored
- ✅ Cloudflare Stream integration working
- ✅ Database schema updated (migration 025)
- ⚠️ **Blocked**: Agora RTMP Converter returns 403 - "No invalid permission to use this function"

### Next Steps

1. **Contact Agora Support**: Enable RTMP Converter feature (email sent)
2. **Implement Fallback**: RTC fallback if RTMP Converter fails
3. **Add Monitoring**: Track RTMP health, HLS errors, costs
4. **UI Updates**: Show "Live in ~20s" indicator for buyers
5. **Test at Scale**: Verify with 50+ concurrent streams

### Code References

- `src/services/agoraMediaPushService.ts` - RTMP Converter integration
- `src/services/recordingManager.ts` - Orchestrates RTC → RTMP → HLS flow
- `src/services/cloudflareStreamService.ts` - HLS URL generation
- `client/src/hooks/useHLSPlayer.ts` - HLS.js player for buyers
- `migrations/025_increase_agora_resource_id_length.ts` - DB schema

---

## References

- [one-night-break.md](../../one-night-break.md) - Detailed cost analysis and architecture exploration
- [Agora Media Push API](https://docs.agora.io/en/media-push/develop/push-stream-to-cdn)
- [Cloudflare Stream Pricing](https://developers.cloudflare.com/stream/pricing/)
- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [ADR-002](../adr/002-rtmp-converter-architecture.md) *(future)* - Technical architecture decision

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-02-16 | Initial decision documented | Frederic Mamath |
| 2026-01-31 | Cost analysis completed | Frederic Mamath |
| 2026-01-29 | Code implementation finished | Frederic Mamath |

---

**Status Summary**: This decision is **ACCEPTED** pending Agora RTMP Converter activation. The cost savings (89-99%) make this the only viable option for a sustainable business model. The latency trade-off is acceptable for the live shopping use case, where interaction happens via text chat rather than voice.
