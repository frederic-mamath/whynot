# Feature 068 — Real-time Outbid Notification

## Initial Prompt

> During lives, when users are trying to bid simultaneously, we might have unexpected behavior. How can we ensure that users bidding first benefit from the winning bid? What would other users see? Top notch UX suggestions wanted.

## Context

The backend already serializes concurrent bids correctly via `SELECT ... FOR UPDATE` in a DB transaction (`auction.ts`). No data integrity issue exists. The missing piece is UX: a buyer who was winning an auction gets no signal when someone outbids them. There is already a `// TODO: Send 'auction:outbid' to previous highest bidder` comment at `auction.ts:363`, and `AuctionOutbidMessage` is already defined in `types.ts` — just not implemented.

The fix: emit `auction:outbid` from the backend on every new bid where a previous winner exists, then show a non-blocking animated banner on both iOS and web with a "Bid again" CTA.

**Scope:** only fires when the current user **was the highest bidder** and gets topped. Does not fire for every bid placed.

## Tickets

| Ticket | Description | Status |
| :--- | :--- | :--- |
| ticket-001 | Backend — emit `auction:outbid` WebSocket event | planned |
| ticket-002 | iOS — `OutbidBanner` component in live screen | planned |
| ticket-003 | Web — outbid banner in LiveDetailsPage | planned |

## User Stories

| User Story | Status |
| :--- | :--- |
| As a buyer who was winning, when someone outbids me during a live, I instantly see a banner telling me I've been outbid with the new bid amount | planned |
| As a buyer who was winning on iOS, I can tap "Enchérir à nouveau" on the banner to immediately open the bid sheet | planned |
| As a buyer who was winning on web, I can click "Surenchérir" on the banner to immediately open the bid input | planned |
