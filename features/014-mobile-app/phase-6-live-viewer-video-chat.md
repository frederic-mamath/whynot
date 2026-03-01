# Phase 6: Live Viewer (Video + Chat)

## Objective

Implement the live channel viewer screen with Agora RTC video playback, real-time chat via tRPC subscription, and product highlight overlay — full-screen vertical layout.

## User-Facing Changes

- Full-screen live video viewer (vertical/TikTok-style)
- Real-time chat overlay (semi-transparent, bottom of screen)
- Product highlight overlay when a product is featured
- LIVE badge + viewer count
- Back button to exit live

## Files to Update

### Frontend (mobile-app/)

- `app/channel/[channelId].tsx` — Live viewer screen (full-screen, outside tabs)
- `src/components/live/ChatPanel.tsx` — Chat messages list + input
- `src/components/live/HighlightedProduct.tsx` — Product highlight overlay
- `src/components/live/LiveBadge.tsx` — LIVE badge + viewer count
- `src/hooks/useChannelWebSocket.ts` — Raw WebSocket for channel events
- `package.json` — Add `react-native-agora`
- `app.json` — Agora Config Plugin for camera/mic permissions

## Steps

1. Install `react-native-agora` and configure Expo Config Plugin
2. Rebuild Dev Client with Agora native module
3. Create the live viewer screen with `createAgoraRtcEngine()`
4. Join channel as audience (ClientRoleAudience), render remote video
5. Create ChatPanel with tRPC `message.subscribe` subscription
6. Create raw WebSocket hook for channel events (highlights, user join/leave)
7. Create HighlightedProduct overlay component
8. Implement vertical layout: video fullscreen, chat overlay, badges
9. Handle lifecycle: leave channel on back press, cleanup engine on unmount

## Acceptance Criteria

- [ ] Viewer sees live video stream from host
- [ ] Chat messages appear in real-time
- [ ] Sending messages works
- [ ] Product highlight appears/disappears on WebSocket events
- [ ] LIVE badge and viewer count displayed
- [ ] Back navigation exits and cleans up Agora engine
- [ ] Works on Android physical device via Dev Client

## Status

📝 PLANNING
