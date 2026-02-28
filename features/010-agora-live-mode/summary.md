# Agora Live Mode Migration - Summary

## Overview

Migrate Agora from `mode: "rtc"` (video conferencing, 17 users max) to `mode: "live"` (broadcast, up to 1M viewers) to remove the primary bottleneck limiting channel viewer capacity.

## User Story

As a **viewer**, I want to join a live channel alongside hundreds of other viewers so that I can watch the host's stream without being blocked by a 17-user cap.

## Business Goal

- Remove the hard 17-user limit per channel imposed by Agora's RTC mode
- Enable the platform to scale to real live commerce scenarios (dozens to thousands of viewers)
- Align the streaming architecture with the product vision (1 host → many viewers broadcast)
- Fix a latent bug where the host's token was generated as SUBSCRIBER (would break in live mode)

## Investigation

See [docs/investigations/channels-limitation.md](../../docs/investigations/channels-limitation.md) for the full analysis of all bottleneck layers (Agora, WebSocket, Render, DB pool).

## Progress Tracking

| Phase   | Description              | Status  |
| ------- | ------------------------ | ------- |
| Phase 1 | Investigation & analysis | ✅ DONE |
| Phase 2 | Implementation           | ✅ DONE |

## Files Changed

### Backend

- `app/src/routers/channel.ts` — Fixed `join` mutation to generate `PUBLISHER` token for host, `SUBSCRIBER` for viewers (was always `SUBSCRIBER`)

### Frontend

- `app/client/src/pages/ChannelDetailsPage.tsx` — Switched Agora client to `mode: "live"`, added `setClientRole("host" | "audience")` before track publication

### Cleanup

- Removed orphan `client/src/pages/ChannelDetailsPage.tsx` at repo root (stale copy from `app/` refactoring)

## Tasks Completed

1. **Fixed host token role** — The `join` mutation now checks `channel.host_id === ctx.userId` to assign `role: 'host'` (PUBLISHER) for the streamer and `role: 'audience'` (SUBSCRIBER) for viewers. Previously hardcoded to `'audience'` for all users.
2. **Switched Agora client mode** — Changed `AgoraRTC.createClient({ mode: "rtc" })` to `mode: "live"` for broadcast support.
3. **Added explicit `setClientRole()`** — After `join()` and before `publish()`, the client now calls `setClientRole("host")` for the streamer or `setClientRole("audience")` for viewers. This is mandatory in live mode.
4. **Cleaned up stale duplicate** — Removed the orphan `client/` directory at the repo root.

## Expected Output

| Layer                 | Before             | After                         |
| --------------------- | ------------------ | ----------------------------- |
| **Agora max viewers** | ~17 per channel    | Up to 1M per channel          |
| **Host token**        | SUBSCRIBER (bug)   | PUBLISHER                     |
| **Viewer token**      | SUBSCRIBER         | SUBSCRIBER (unchanged)        |
| **Client role**       | Not set (implicit) | Explicit `host` or `audience` |
| **Latency**           | ~200-400ms (RTC)   | ~1-3s (Live CDN distribution) |

## Status

✅ COMPLETE
