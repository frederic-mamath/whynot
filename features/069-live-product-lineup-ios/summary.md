# Feature 069 — Live Product Lineup on iOS

## Initial Prompt

> In the iOS app, in the live page, I would like to allow users to see the list of items planned to be presented during the auction. Users should be able to manifest their interest so the seller knows what to present next.

## Context

Buyers on iOS join a live with zero visibility into what products are coming up. There is no signal for the seller about what the audience actually wants to see. The web app already shows linked products via `product.listByChannel`, but iOS has no equivalent.

The fix: add a second "page" below the live video (snap-scroll, video stays full screen). Buyers see the product lineup and can raise their hand (✋) to signal interest. Sellers see the interest counts during the live to guide their presentation order. Optimistic UI makes the toggle feel instant.

## Tickets

| Ticket | Description | Status |
| :--- | :--- | :--- |
| ticket-001 | DB + Backend — `live_product_interests` table, extend `listByChannel`, `toggleInterest` mutation | planned |
| ticket-002 | iOS — snap-scroll layout + read-only product lineup | planned |
| ticket-003 | iOS — interest toggle with optimistic UI + seller count display | planned |

## User Stories

| User Story | Status |
| :--- | :--- |
| As a buyer in a live, when I scroll down, I see the full list of products planned for this live | planned |
| As a buyer, when I tap ✋ on a product, my interest is registered instantly and the count updates | planned |
| As a buyer, when I tap ✋ again, my interest is removed instantly | planned |
| As a seller in the live, when I scroll down, I see interest counts on each product to guide what to present next | planned |
