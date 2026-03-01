# Phase 9: Seller — Live Hosting

## Objective

Enable sellers to create channels and host live streams from mobile using Agora RTC in broadcaster mode, with host controls (mic, camera, switch camera), product highlight management, and auction launching.

## User-Facing Changes

- Channel creation screen (title, shop selection, product association)
- Host live screen with self-view camera, LIVE badge, viewer count
- Controls: toggle mic, toggle camera, switch front/back camera, end stream
- Product management panel: list products, highlight/unhighlight
- Auction launcher: configure and start auctions mid-stream

## Files to Update

### Frontend (mobile-app/)

- `app/create-channel.tsx` — Channel creation form
- `app/channel/[channelId]/host.tsx` — Host live screen
- `src/components/live/ChannelControls.tsx` — Mic/camera/switch/end buttons
- `src/components/live/ProductManagementPanel.tsx` — Product list + highlight toggle
- `src/components/live/AuctionConfigModal.tsx` — Auction launch configuration

## Steps

1. Build channel creation screen (title, shop picker, product multi-select)
2. Create host live screen with Agora in `ClientRoleBroadcaster` mode
3. Publish local camera + mic tracks, render `<RtcSurfaceView>` for self-view
4. Create ChannelControls (toggleAudio, toggleVideo, switchCamera, endStream)
5. Create ProductManagementPanel with highlight/unhighlight actions
6. Create AuctionConfigModal (product, starting price, duration, increment, buy-out)
7. Integrate chat as host (read + send messages)
8. Handle camera/mic permissions at runtime

## Acceptance Criteria

- [ ] Seller can create a channel and go live
- [ ] Self-view camera renders on host screen
- [ ] Audio/video toggles work
- [ ] Camera switch (front/back) works
- [ ] End stream stops broadcast and navigates back
- [ ] Product highlight sends WebSocket event visible to viewers
- [ ] Auction can be launched and is visible to viewers
- [ ] Chat works for host (read + send)

## Status

📝 PLANNING
