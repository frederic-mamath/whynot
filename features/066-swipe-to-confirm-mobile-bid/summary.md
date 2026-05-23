# Feature 066 — Swipe-to-Confirm Mobile Bid

## Initial Prompt

> As a user, in iOS's live, during auctions, I would like a safer option to bid. Today, if I hit the confirm button accidentally, it might bid on an item I don't want. I was thinking of a slider.

## Context

User testing revealed accidental bids during live auctions. The consequence is real: if the accidental winner cancels, the seller loses the sale and the second-highest bidder is discarded. The current flow already has two steps (tap "Enchérir" → sheet → confirm button), but the confirm button inside the sheet is too easy to hit accidentally.

## Approach

Replace the "Confirmer l'enchère" `Pressable` button in `BidRequirementsSheet` with a swipe-to-confirm component. Swiping right deliberately is nearly impossible to trigger accidentally. Built with React Native's built-in `PanResponder` + `Animated` — no new dependencies.

**Not in scope:** bid cancellation after placement, undo window, seller notification changes, any backend changes, the web app's bid flow (covered by feature 052).

## Tickets

| Ticket | Description | Status |
| :--- | :--- | :--- |
| ticket-001 | `SwipeToConfirm` component + wire into `BidRequirementsSheet` | planned |

## User Stories

| User Story | Status |
| :--- | :--- |
| As a buyer, when I open the bid sheet and all requirements are met, I should see a swipe-to-confirm track instead of a tap button | planned |
| As a buyer, when I drag the thumb fully to the right, my bid should be placed | planned |
| As a buyer, when I release the thumb before reaching the end, it should spring back — no bid placed | planned |
| As a buyer, when requirements are not yet met (no name / no payment), the swipe track should be disabled and visually muted | planned |
| As a buyer, when the bid mutation is pending, the swipe track should be disabled to prevent double-submission | planned |
