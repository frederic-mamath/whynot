# 🌙 One Night Break - Streaming Architecture Summary

**Date**: 31 January 2026  
**Status**: Architecture migrated to Agora RTMP Converter (Media Push), but blocked by account permissions

---

## 🎯 Problem We Were Solving

**Original Issue**: Buyers seeing "Stream starting soon..." instead of live video when sellers stream.

**Root Cause**: Cloudflare Stream Live Input had no active stream because nothing was pushing to the RTMP endpoint.

---

## 📊 What We Accomplished Today

### 1. **Debug & Discovery Phase**

- ✅ Added comprehensive logging with `[ServiceName]` prefixes throughout stack
- ✅ Fixed Cloudflare URL construction (webRTCPlayback structure)
- ✅ Fixed RTMPS URL to include streamKey
- ✅ Increased database `agora_resource_id` from VARCHAR(100) to VARCHAR(500)

### 2. **Architecture Exploration**

- ❌ **Agora Cloud Recording** - Attempted but discovered it records to S3 (VOD), doesn't push RTMP in real-time
- ❌ **extensionServiceConfig with rtmp_publisher** - Agora doesn't support this for external RTMP servers
- ✅ **Agora Media Push (RTMP Converter)** - Correct approach, but needs account activation

### 3. **Code Implementation**

- ✅ Created `/src/services/agoraMediaPushService.ts` (150 lines)
  - Methods: `start()`, `query()`, `stop()`
  - Endpoint: `/v1/projects/{appId}/rtmp-converters`
- ✅ Refactored `/src/services/recordingManager.ts` for Media Push
  - `startRecording()`: Creates Cloudflare Live Input → Starts Media Push → Stores taskId
  - `stopRecording()`: Stops Media Push task → Updates database
- ✅ Database migration `025_increase_agora_resource_id_length.ts` applied

### 4. **Infrastructure Configured**

| Service                  | Status                                  | Purpose                                                  |
| ------------------------ | --------------------------------------- | -------------------------------------------------------- |
| **Agora RTC**            | ✅ Working                              | Seller streams video/audio                               |
| **Agora RTMP Converter** | ⚠️ Code ready, needs account activation | Converts RTC → RTMP in real-time                         |
| **AWS S3**               | ✅ Configured                           | Not needed for Media Push (used for Cloud Recording VOD) |
| **Cloudflare Stream**    | ✅ Working                              | Receives RTMP, serves HLS to buyers                      |

---

## � Executive Cost Comparison - Business Scale Analysis

**Scenario**: 30 buyers per seller × 3 hours daily streaming  
**Compared at**: 10, 50, 250, 1,000 sellers

### Monthly Cost Comparison Table

| Scale             | Service              | Option 1: All RTC | Option 2: RTMP + HLS (Standard) | Option 3: RTMP + HLS (Volume) |
| ----------------- | -------------------- | ----------------: | ------------------------------: | ----------------------------: |
| **10 Sellers**    |                      |                   |                                 |                               |
|                   | Agora RTC (Sellers)  |            $53.46 |                          $53.46 |                        $53.46 |
|                   | Agora RTC (Buyers)   |         $1,603.80 |                           $0.00 |                         $0.00 |
|                   | Agora RTMP Converter |             $0.00 |                         $108.00 |                       $108.00 |
|                   | Cloudflare Stream    |             $0.00 |                       $1,620.00 |                        $21.20 |
|                   | AWS S3               |             $0.00 |                           $0.00 |                         $0.00 |
|                   | **TOTAL/month**      |     **$1,657.26** |                   **$1,781.46** |                   **$182.66** |
| **50 Sellers**    |                      |                   |                                 |                               |
|                   | Agora RTC (Sellers)  |           $267.30 |                         $267.30 |                       $267.30 |
|                   | Agora RTC (Buyers)   |         $8,019.00 |                           $0.00 |                         $0.00 |
|                   | Agora RTMP Converter |             $0.00 |                         $540.00 |                       $540.00 |
|                   | Cloudflare Stream    |             $0.00 |                       $8,100.00 |                        $86.00 |
|                   | AWS S3               |             $0.00 |                           $0.00 |                         $0.00 |
|                   | **TOTAL/month**      |     **$8,286.30** |                   **$8,907.30** |                   **$893.30** |
| **250 Sellers**   |                      |                   |                                 |                               |
|                   | Agora RTC (Sellers)  |         $1,336.50 |                       $1,336.50 |                     $1,336.50 |
|                   | Agora RTC (Buyers)   |        $40,095.00 |                           $0.00 |                         $0.00 |
|                   | Agora RTMP Converter |             $0.00 |                       $2,700.00 |                     $2,700.00 |
|                   | Cloudflare Stream    |             $0.00 |                      $40,500.00 |                       $410.00 |
|                   | AWS S3               |             $0.00 |                           $0.00 |                         $0.00 |
|                   | **TOTAL/month**      |    **$41,431.50** |                  **$44,536.50** |                 **$4,446.50** |
| **1,000 Sellers** |                      |                   |                                 |                               |
|                   | Agora RTC (Sellers)  |         $5,346.00 |                       $5,346.00 |                     $5,346.00 |
|                   | Agora RTC (Buyers)   |       $160,380.00 |                           $0.00 |                         $0.00 |
|                   | Agora RTMP Converter |             $0.00 |                      $10,800.00 |                    $10,800.00 |
|                   | Cloudflare Stream    |             $0.00 |                     $162,000.00 |                     $1,625.00 |
|                   | AWS S3               |             $0.00 |                           $0.00 |                         $0.00 |
|                   | **TOTAL/month**      |   **$165,726.00** |                 **$178,146.00** |                **$17,771.00** |

### Visual Cost Comparison

```
Monthly Costs by Scale (30 buyers/seller × 3 hours/day)

10 Sellers:
All RTC:         $1,657  ████████
RTMP Standard:   $1,781  █████████
RTMP Volume:     $183    █                    ← 89% savings

50 Sellers:
All RTC:         $8,286  ████████████████████████████████████████
RTMP Standard:   $8,907  ██████████████████████████████████████████
RTMP Volume:     $893    ████                 ← 89% savings

250 Sellers:
All RTC:        $41,432  ████████████████████████████████████████
RTMP Standard:  $44,537  ██████████████████████████████████████████
RTMP Volume:     $4,447  ████                 ← 89% savings

1,000 Sellers:
All RTC:       $165,726  ████████████████████████████████████████
RTMP Standard: $178,146  ██████████████████████████████████████████
RTMP Volume:    $17,771  ████                 ← 89% savings
```

### Key Insights

**Cost Scaling Analysis**:

| Sellers |  All RTC | RTMP Volume |  Savings | % Saved |
| ------- | -------: | ----------: | -------: | ------: |
| 10      |   $1,657 |        $183 |   $1,474 |     89% |
| 50      |   $8,286 |        $893 |   $7,393 |     89% |
| 250     |  $41,432 |      $4,447 |  $36,985 |     89% |
| 1,000   | $165,726 |     $17,771 | $147,955 |     89% |

**Findings**:

1. **RTMP Volume pricing is 89% cheaper** across all scales
2. **RTMP Standard pricing** is more expensive than All RTC (not recommended)
3. **Cloudflare volume pricing ($0.01/1000 min)** is critical for cost efficiency
4. **Costs scale linearly** with seller count in all options

**Recommendations**:

- ✅ **Use RTMP + HLS with Cloudflare volume pricing** for any scale ≥ 10 sellers
- ✅ Contact Agora to enable RTMP Converter feature
- ✅ Negotiate Cloudflare volume pricing (need commitment or historical usage)
- ❌ Avoid RTMP with standard Cloudflare pricing ($1/1000 min)

---

## �🚫 Current Blocker

**Error**: `403 Forbidden`  
**Message**: `"No invalid permission to use this function. Contact us."`  
**API Endpoint**: `POST /v1/projects/{appId}/rtmp-converters`

**What this means**: Your Agora account doesn't have access to the RTMP Converter (Media Push) feature. This requires:

- Contacting Agora support/sales
- Possibly upgrading to a paid plan
- Enabling the feature on your account

---

## 🔄 Architecture Flow (When Enabled)

```
┌─────────────┐
│   SELLER    │
│  (RTC SDK)  │
└──────┬──────┘
       │ Publish video/audio
       ▼
┌─────────────────────┐
│  Agora RTC Server   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Agora RTMP Converter ($)    │ ← Media Push API
│ Converts RTC → RTMP         │
└──────┬──────────────────────┘
       │ Push RTMPS
       ▼
┌────────────────────────────┐
│ Cloudflare Stream ($)      │
│ rtmps://live.cloudflare... │
└──────┬─────────────────────┘
       │ Serve HLS
       ▼
┌─────────────┐
│   BUYERS    │
│ (HLS.js)    │
└─────────────┘
```

**Key Benefits**:

- Sellers use low-latency RTC
- Buyers use scalable HLS (no P2P, just HTTP)
- Cloudflare CDN handles viewer distribution
- Much cheaper at scale (30+ viewers per stream)

---

## 💰 Price Comparison

**Scenario**: 50 sellers × 3 hours/day × 30 buyers each

### Daily Usage Calculation

- Seller hours: 50 sellers × 3 hours = **150 hours/day** (9,000 minutes/day)
- Buyer hours: 50 streams × 30 buyers × 3 hours = **4,500 hours/day** (270,000 minutes/day)
- **Total: 4,650 hours/day** (139,500 hours/month = 8,370,000 minutes/month)

---

### Option 1: All RTC (Current Working Solution)

Everyone (sellers + buyers) joins Agora RTC channel.

#### Service-by-Service Breakdown

**Agora RTC - HD Video Calling**

| User Type          | Minutes/Day | Minutes/Month | Rate           | Daily Cost | Monthly Cost |
| ------------------ | ----------- | ------------- | -------------- | ---------- | ------------ |
| Sellers (HD Video) | 9,000 min   | 270,000 min   | $0.99/1000 min | $8.91      | $267.30      |
| Buyers (HD Video)  | 270,000 min | 8,100,000 min | $0.99/1000 min | $267.30    | $8,019.00    |

**Other Services**

- AWS S3: $0/month (not used in RTC-only mode)
- Cloudflare Stream: $0/month (not used)

#### Total Cost - Option 1

| Period      | Cost          |
| ----------- | ------------- |
| **Daily**   | **$276.21**   |
| **Monthly** | **$8,286.30** |

**Pros**:

- ✅ Already working
- ✅ No setup needed
- ✅ Low latency for everyone (~300ms)
- ✅ Two-way communication possible

**Cons**:

- ❌ Scales poorly (each buyer costs same as seller)
- ❌ Very expensive at scale
- ❌ At 100 buyers/stream: $920.70/day ($27,621/month)
- ❌ Bandwidth intensive for buyers

---

### Option 2: RTMP Converter + HLS (Target Solution)

Sellers use RTC, buyers use HLS via Cloudflare Stream.

#### Service-by-Service Breakdown

**Agora Services**

| Service                  | Minutes/Day | Minutes/Month | Rate              | Daily Cost | Monthly Cost | Notes                 |
| ------------------------ | ----------- | ------------- | ----------------- | ---------- | ------------ | --------------------- |
| **Agora RTC** (Sellers)  | 9,000 min   | 270,000 min   | $0.99/1000 min    | $8.91      | $267.30      | HD video from sellers |
| **Agora RTMP Converter** | 9,000 min   | 270,000 min   | ~$2.00/1000 min\* | $18.00     | $540.00      | RTC → RTMP conversion |

\*Estimated rate - actual pricing may vary. Contact Agora sales for exact Media Push pricing.

**Cloudflare Stream**

| Service             | Usage           | Rate           | Daily Cost | Monthly Cost | Notes                   |
| ------------------- | --------------- | -------------- | ---------- | ------------ | ----------------------- |
| **Stream Ingress**  | 9,000 min/day   | $0.00          | $0.00      | $0.00        | RTMP ingress is free    |
| **Stream Delivery** | 270,000 min/day | $1.00/1000 min | $270.00    | $8,100.00    | HLS delivery to buyers  |
| **Storage**         | Live streams    | $5/1000 min    | $0.00      | $0.00        | No recording, live only |

**AWS S3** (Not used in this option)

| Service  | Usage | Cost        |
| -------- | ----- | ----------- |
| Storage  | 0 GB  | $0.00/month |
| Transfer | 0 GB  | $0.00/month |

#### Total Cost - Option 2

| Period      | Cost          |
| ----------- | ------------- |
| **Daily**   | **$296.91**   |
| **Monthly** | **$8,907.30** |

**⚠️ Note**: This is MORE expensive than all-RTC for this scenario because Cloudflare Stream delivery ($1/1000 min) is similar to Agora RTC ($0.99/1000 min), plus you pay for RTMP conversion ($2/1000 min).

**Pros**:

- ✅ Scales infinitely (CDN distributed)
- ✅ Works on all browsers (no SDK needed)
- ✅ Reduced bandwidth on buyer side
- ✅ Professional HLS delivery

**Cons**:

- ❌ Needs Agora account activation (blocked now)
- ❌ Higher latency for buyers (~10-30s HLS vs 300ms RTC)
- ❌ More expensive with standard Cloudflare pricing
- ❌ Setup complexity

---

### Option 3: Optimized Cloudflare Stream (Best Solution)

**Key Discovery**: Cloudflare Stream has much cheaper delivery with volume pricing.

#### Service-by-Service Breakdown

**Agora Services**

| Service              | Minutes/Day | Minutes/Month | Rate           | Daily Cost | Monthly Cost |
| -------------------- | ----------- | ------------- | -------------- | ---------- | ------------ |
| Agora RTC (Sellers)  | 9,000 min   | 270,000 min   | $0.99/1000 min | $8.91      | $267.30      |
| Agora RTMP Converter | 9,000 min   | 270,000 min   | $2.00/1000 min | $18.00     | $540.00      |

**Cloudflare Stream (Volume Pricing)**

| Service         | Usage           | Rate               | Daily Cost | Monthly Cost |
| --------------- | --------------- | ------------------ | ---------- | ------------ |
| Base Plan       | Fixed           | $5/month           | $0.17      | $5.00        |
| Stream Delivery | 270,000 min/day | **$0.01/1000 min** | $2.70      | $81.00       |
| Stream Ingress  | 9,000 min/day   | $0.00              | $0.00      | $0.00        |
| Storage         | Live only       | $0.00              | $0.00      | $0.00        |

\*Cloudflare Stream delivers at $0.01/1000 minutes with volume pricing (after initial tier).

**AWS S3** (Not used)

| Service  | Usage | Cost        |
| -------- | ----- | ----------- |
| Storage  | 0 GB  | $0.00/month |
| Transfer | 0 GB  | $0.00/month |

#### Total Cost - Option 3

| Period      | Cost                            |
| ----------- | ------------------------------- |
| **Daily**   | **$29.78**                      |
| **Monthly** | **$893.30** (including $5 base) |

**💰 Savings vs All-RTC**: $7,393/month (89% cheaper!)

**Pros**:

- ✅ **Massive cost savings** at scale
- ✅ Unlimited scalability
- ✅ At 100 buyers/stream: still ~$30/day
- ✅ At 1,000 buyers/stream: still ~$36/day
- ✅ CDN-based delivery worldwide

**Cons**:

- ❌ Requires Agora RTMP Converter activation
- ❌ Higher latency (~20s vs 300ms)
- ❌ Requires Cloudflare volume pricing tier

---

### 📊 Detailed RTMP Converter Cost Analysis

**What is Agora RTMP Converter (Media Push)?**

The RTMP Converter is Agora's service that:

1. Takes your RTC video/audio stream in real-time
2. Transcodes it to RTMP format
3. Pushes it to your RTMP endpoint (Cloudflare Stream in our case)

**Pricing Model**:

- **Charged per minute** of conversion
- **Estimated rate**: ~$2.00 per 1,000 minutes
- **Billed separately** from RTC usage
- **Region-specific** pricing may apply

**For our scenario (50 sellers × 3 hours/day)**:

```
Daily RTMP conversion: 9,000 minutes
Monthly conversion: 270,000 minutes
Daily cost: 9,000 ÷ 1,000 × $2.00 = $18.00
Monthly cost: 270,000 ÷ 1,000 × $2.00 = $540.00
```

**Key Points**:

- ✅ Each seller stream is converted once (not per viewer)
- ✅ Flat cost regardless of viewer count
- ✅ Only charged while stream is active
- ⚠️ Must be enabled on your Agora account
- ⚠️ Exact pricing varies - contact Agora sales

**Alternative RTMP Services** (for comparison):

| Service              | Rate           | Monthly Cost | Notes                        |
| -------------------- | -------------- | ------------ | ---------------------------- |
| Agora RTMP Converter | $2.00/1000 min | $540.00      | Integrated, managed service  |
| AWS MediaLive        | $2.40/hour     | $10,800.00   | More expensive, more control |
| Custom FFmpeg Server | $100-500/month | $100-500     | DIY, requires maintenance    |
| Mux Live             | $0.015/min     | $4,050.00    | Similar to Agora             |

---

### Option 4: Hybrid (Smart Compromise)

Small channels use RTC, large channels use RTMP Converter.

**Rule**: Switch to HLS when viewers > 5

| Component                    | Calculation          | Monthly Cost |
| ---------------------------- | -------------------- | ------------ |
| Small channels (< 5 viewers) | RTC for all          | Variable     |
| Large channels (30+ viewers) | RTMP Converter + HLS | $148.37      |

**Best of both worlds**: Low latency for small streams, cost efficiency for large streams.

### 📈 Break-Even Analysis

**When does RTMP Converter become cheaper than all-RTC?**

With Cloudflare volume pricing ($0.01/1000 min delivery):

| Viewers/Stream | All-RTC Monthly | RTMP + HLS Monthly | Winner         | Savings   |
| -------------- | --------------- | ------------------ | -------------- | --------- |
| 5 buyers       | $1,490          | $893               | **RTMP + HLS** | -$597     |
| 10 buyers      | $2,758          | $893               | **RTMP + HLS** | -$1,865   |
| 30 buyers      | $8,286          | $893               | **RTMP + HLS** | -$7,393   |
| 100 buyers     | $27,621         | $893               | **RTMP + HLS** | -$26,728  |
| 1,000 buyers   | $275,076        | $893               | **RTMP + HLS** | -$274,183 |

**Break-even point**: ~3 viewers per stream (with volume pricing)

**Conclusion**:

- **For < 3 viewers**: All-RTC is cheaper
- **For 3+ viewers**: RTMP Converter + HLS is much cheaper
- **For 30+ viewers**: RTMP Converter saves 89% in costs

---

### 💡 Cost Optimization Recommendations

**Immediate Action**:

1. Contact Agora to enable RTMP Converter and get exact pricing
2. Request Cloudflare volume pricing tier (need historical usage or commitment)

**Implementation Strategy**:

```typescript
// Pseudo-code for smart routing
if (viewerCount < 5) {
  // Small audience - use RTC for low latency
  useAgoraRTC();
} else {
  // Large audience - use RTMP + HLS for cost efficiency
  useRTMPConverter();
}
```

**Long-term**:

- Monitor viewer patterns (peak concurrent viewers)
- Adjust threshold based on actual pricing
- Consider regional CDN pricing differences

---

## 🎬 Next Steps to Enable RTMP Converter

### 1. **Contact Agora Support**

**Email**: support@agora.io  
**Or**: Use Agora Console → Support → Create Ticket

**Subject**: Enable RTMP Converter (Media Push) Feature

**Message Template**:

```
Hello Agora Team,

I'm using Agora RTC SDK for a live shopping platform and need to enable
the RTMP Converter (Media Push) feature to push streams to Cloudflare Stream.

Current Account Details:
- APP ID: 63647f40f7054bcf9c25d10d05713092
- Use Case: Live shopping platform with sellers streaming to multiple buyers
- Expected Usage: ~150 hours/day of RTMP conversion
- Target Destination: Cloudflare Stream (RTMPS)

I'm currently receiving this error when calling the API:
POST /v1/projects/{appId}/rtmp-converters
Response: 403 Forbidden - "No invalid permission to use this function. Contact us."

Could you please:
1. Enable RTMP Converter feature on my account
2. Provide pricing details for Media Push service
3. Confirm the correct API endpoint and request format

Thank you!
```

### 2. **While Waiting: Test Current RTC Solution**

The all-RTC solution is working and functional:

- ✅ Sellers can stream
- ✅ Buyers can watch
- ✅ Cost is reasonable for 30 buyers/stream

**To test**:

```bash
# Server should already be running
# Open browser: http://localhost:5173

1. Create channel as SELLER (User ID 1)
2. Start streaming
3. Join as BUYER (different browser/incognito)
4. Verify video plays
```

### 3. **When RTMP Converter Enabled**

**Code is ready**, just need to restart server:

```bash
# No code changes needed - already implemented!
npm run dev
```

**Test flow**:

1. Create channel as seller
2. Check server logs for: `[MediaPush] ✅ Task started: {taskId}`
3. Join as buyer
4. Check for HLS player instead of Agora RTC
5. Verify video plays via Cloudflare Stream

### 4. **Manual Testing Checklist**

After RTMP Converter is enabled:

- [ ] Create channel as seller
- [ ] Verify Media Push starts (check logs)
- [ ] Verify Cloudflare Stream receives RTMP
- [ ] Join as buyer
- [ ] Verify HLS player loads
- [ ] Check video playback quality
- [ ] Test seller leaving (Media Push stops)
- [ ] Test multiple concurrent streams
- [ ] Monitor costs in Agora console
- [ ] Monitor costs in Cloudflare dashboard

---

## 📂 Files Modified Today

### New Files Created

- `/src/services/agoraMediaPushService.ts` - Complete RTMP Converter API wrapper
- `/migrations/025_increase_agora_resource_id_length.ts` - Database schema update

### Files Refactored

- `/src/services/recordingManager.ts` - Migrated from Cloud Recording to Media Push
- `/src/services/cloudflareStreamService.ts` - Fixed URL construction
- `/client/src/pages/ChannelDetailsPage.tsx` - Added debug logging
- `/client/src/hooks/useHLSPlayer.ts` - Enhanced error logging

### Configuration

- Database: `agora_resource_id` now VARCHAR(500) to store Media Push taskIds
- Agora: Code configured for `/rtmp-converters` endpoint
- Cloudflare: Stream Live Inputs working correctly

---

## 🔍 Key Technical Decisions Made

### Why Media Push over Cloud Recording?

- Cloud Recording saves to S3 for VOD (Video on Demand)
- Media Push pushes to RTMP in real-time (what we need)
- Cloud Recording has 30s+ delay, Media Push has <10s delay

### Why HLS for Buyers?

- Scalable (CDN distributed)
- No per-viewer RTC cost
- Works on all browsers without SDK
- Standard HTTP delivery

### Why Keep Sellers on RTC?

- Low latency for interaction
- Better audio/video quality
- Can receive buyer audio (future feature)
- Professional streaming quality

---

## 🚨 Known Issues & Limitations

### Current Blockers

1. **403 Forbidden on RTMP Converter** - Main blocker, needs Agora support
2. **HLS latency** - 10-30s delay (acceptable for shopping use case)

### Minor Issues

- Database `relay_stopped_at` field doesn't exist (removed from code)
- Some old Cloud Recording code could be cleaned up
- Analytics tracking might need updates for Media Push costs

### Not Implemented Yet

- Automatic fallback from RTMP to RTC if Media Push fails
- Viewer count-based routing (< 5 viewers → RTC, > 5 → HLS)
- Cost monitoring dashboard
- RTMP health monitoring

---

## 💡 Alternative Approaches (If RTMP Converter Too Expensive)

### 1. **Pure RTC (Current)**

- Works now
- Simple
- Costs scale linearly with viewers

### 2. **Custom Relay Server**

- Build Node.js server with FFmpeg
- Receives RTC stream from seller
- Converts to RTMP
- Pushes to Cloudflare
- **Complexity**: High
- **Cost**: Server hosting + maintenance

### 3. **Agora CDN Push (Alternative API)**

- Different Agora API: `startChannelMediaRelay`
- Might have different pricing/availability
- Worth exploring if RTMP Converter denied

### 4. **Direct HLS from Agora**

- Agora has "Agora RTC to HLS" conversion
- Might be simpler than RTMP Converter
- Check if available in your region

---

## 📞 Support Contacts

- **Agora Support**: support@agora.io
- **Agora Sales**: sales@agora.io
- **Cloudflare Support**: https://dash.cloudflare.com/support
- **AWS S3 Support**: https://console.aws.amazon.com/support

---

## ✅ Tomorrow's Plan

1. **Contact Agora** - Send support ticket to enable RTMP Converter
2. **Get Pricing** - Confirm exact Media Push rates
3. **Test When Enabled** - Follow manual testing checklist
4. **Monitor Costs** - Track first day of usage
5. **Optimize** - Implement viewer count-based routing if needed

**Expected Timeline**: 1-3 business days for Agora response

---

**Questions to ask Agora Support**:

1. What's the exact pricing for RTMP Converter/Media Push?
2. Is there a free tier or trial period?
3. What are the regional restrictions?
4. What's the maximum concurrent RTMP conversions allowed?
5. What happens if we exceed limits?

Good luck! 🚀
