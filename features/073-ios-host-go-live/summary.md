# Feature 073 — iOS host can actually go live

## Initial prompt

> "When I get into a live as a seller and live's host, it doesn't stream from my camera and microphone. I was expecting to be able to host lives and start auction directly from iOS during this feature (feature 070)."

## Scope decision

After PO review (see conversation history):

- Feature 070 **did** ship the iOS broadcaster screen (`app/seller-live/[liveId].tsx`) and the auction control logic — tickets 007 and 008. The native Agora module supports host mode (`initializeBroadcaster`, `joinChannelAsBroadcaster`, `stopBroadcaster`), and the screen calls `live.highlightProduct`, `auction.start`, `auction.close`, `live.end`.
- The actual gap is **server-side**: the seller-live screen calls `live.join` to obtain its Agora token, and `live.join` (`app/src/routers/live.ts:286-327`) gates the token behind `live.starts_at <= now`. There is no distinction between buyer-trying-to-join-early and host-trying-to-start. When the host tapped "Go Live" before the scheduled time, the server returned `liveStatus: "upcoming"` with no token, and the client alerted "live didn't start yet" and `router.back()`'d.
- Secondary UX gap: tapping your own live from the Home feed routes you to the buyer view (`app/live/[liveId].tsx`), so the host sees their own live "as a buyer" with no way to switch into broadcaster mode from that entry point.

**This feature ships the missing host path: a dedicated `live.start` mutation that lets the host transition the live to active and obtain a broadcaster token at any time, the iOS seller-live screen rewired onto it, and auto-routing of hosts away from the buyer view of their own lives.**

## Explicitly out of scope

- Changing `live.join` semantics for buyers — the upcoming/ended gates are correct for buyers and stay as-is.
- Adding an `actual_started_at` column to keep both the scheduled time and the real-start time separate. The simplest implementation updates `starts_at` to `now()` when the host starts — losing the original scheduled time. If we later want analytics on "did the host start on time", that's a separate feature.
- Pre-live "soundcheck" / private rehearsal mode. The host going live IS the live starting; buyers in the feed will see it become active.
- Web parity. The web app's host flow is unchanged. If the web also has this bug, it's a separate ticket — flag it but do not fix here.
- Push notifications to followers when the host starts the live (separate concern from broadcasting itself).

## User Stories

| User Story | Status |
| :--------- | :----- |
| As a seller, when I tap "Go Live" before the scheduled `starts_at`, the live transitions to active and my broadcaster screen connects to Agora | planned |
| As a seller on the broadcaster screen, I see my camera preview within a few seconds, with no "live didn't start yet" error | planned |
| As a seller, when I tap my own live from the Home feed, I am routed to the broadcaster screen instead of the buyer view | planned |
| As a non-host buyer, the existing buyer-side behaviour is unchanged — I still see "Live pas encore commencé" when a live's `starts_at` is in the future | planned |

## Ticket sequence

Three atomic tickets. Each leaves the app in a buildable state.

| # | Scope | What still doesn't work if shipped alone |
|---|-------|------------------------------------------|
| 001 | Backend `live.start` mutation — host-only, transitions the live to active, returns Agora broadcaster token | iOS still calls `live.join` and still gets bounced. No user-visible change yet. |
| 002 | iOS seller-live screen calls `live.start` instead of `live.join` | Hosts can now broadcast. Tapping own live from Home feed still drops them into the buyer view. |
| 003 | Home-feed → live routing: if the authenticated user is the live's host, redirect to `/seller-live/[id]` | Full flow polished. |
