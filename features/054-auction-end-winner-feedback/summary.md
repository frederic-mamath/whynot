# Feature 054 — Auction End Winner Feedback

## Initial prompt

> As a user, in the live details page, when the auction ends, I want to see a feedback to know who has won the auction. I want the user to be identified by its user.nickname. If the authenticated user is the winner of the auction, I want to see the pop animation.

## Scope

Fix and improve the auction end experience:
- Replace firstname+lastname with nickname as the winner identifier across all surfaces (repository, mapper, WebSocket broadcast, chat)
- Debug and fix the AuctionEndModal not triggering when an auction ends
- Add a particle burst animation inside the modal when the authenticated user is the winner

## Tickets

| Ticket | Description | Status |
|--------|-------------|--------|
| ticket-001 | Fix winner nickname + AuctionEndModal trigger | planned |
| ticket-002 | Particle pop animation for winner inside AuctionEndModal | planned |
