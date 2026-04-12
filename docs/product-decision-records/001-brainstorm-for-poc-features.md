# PDR-001 — Post-PoC Feature Brainstorm

**Date:** 2026-04-12
**Status:** Brainstorm
**Author:** Product Owner session with Claude

---

## Context

WhyNot (branded **Popup**) has reached PoC status. The core loop is functional: sellers can go live, run auctions, and buyers can bid and pay. This document captures the product gaps identified at the end of the PoC phase, prioritized by business impact.

---

## Identified Gaps

### 1. Seller Analytics
**Problem:** `SellerExplorerPage` is completely empty. Sellers have no visibility into their business performance.

**Missing metrics:**
- Revenue per live (total sold, average basket, GMV)
- Viewer count over time, peak audience per live
- Product performance (most bid on, fastest sold, abandoned auctions)
- Follower growth over time

**Why it matters:** Sellers won't invest in going live repeatedly if they can't measure results. Analytics is the primary retention lever for the seller side.

---

### 2. Notification System
**Problem:** The only "notification" today is a calendar ICS file download ("Me rappeler"). No notification infrastructure exists.

**Missing:**
- Push notifications (browser/mobile) when a followed seller goes live
- In-app notification center (bell icon) for: order updates, outbid alerts, live starting, new follower
- Email notifications for: order shipped, auction won, payment failed

**Why it matters:** Without notifications, buyers only return if they remember to. A live-commerce platform lives or dies on real-time re-engagement.

---

### 3. Reviews & Ratings
**Problem:** Zero social proof exists — no seller scores, no product ratings, no buyer feedback after delivery.

**Suggested flow:**
- After delivery is confirmed → buyer receives a review prompt
- Seller profile shows average rating + review count
- `SellersPage` can filter/sort by rating

**Why it matters:** Buyers on a new platform are skeptical. A single trust signal (4.8 stars, 32 reviews) dramatically increases first-purchase conversion.

---

### 4. Order Tracking
**Problem:** `MyOrdersPage` shows a status (`pending / paid / shipped`) but has no tracking link, no timeline, and no buyer-facing delivery updates.

**Missing:**
- Tracking number visible to the buyer with a carrier deep-link
- Order timeline (placed → paid → shipped → delivered) with timestamps
- Automatic status notification when seller marks as shipped

**Why it matters:** Post-purchase anxiety is the #1 reason buyers don't return. Transparent delivery builds repeat purchase behavior.

---

### 5. Global Search & Discovery
**Problem:** No global search exists. Buyers can only discover sellers through the home feed or `SellersPage` list. No way to search by product, category, or keyword.

**Missing:**
- Global search bar (products + sellers + upcoming lives)
- Category filters on `SellersPage` and `LivesPage`
- "Trending" or "Most followed" sort on seller discovery

**Why it matters:** The platform has no intent-driven discovery path. A buyer looking for "sneakers" or "vintage" has no way to find relevant content.

---

### 6. Wishlist / Save for Later
**Problem:** Buyers watching a live can see products but have no way to save interest without bidding or buying immediately.

**Missing:**
- "Save" button on product cards (heart/bookmark)
- Saved items tab in `MyOrdersPage` or a dedicated page

**Why it matters:** Not every buyer is ready to purchase in the moment. A wishlist captures intent and creates a re-engagement surface.

---

### 7. Seller Verification Badges
**Problem:** No verification layer exists. Any seller account looks identical to any other — no signal of reliability.

**Suggested:**
- "Verified seller" badge after a threshold of successful deliveries with a minimum rating
- Display on seller profile, `SellersPage`, and during live stream

---

### 8. Live Stream Quality-of-Life
**Problem:** Small friction points during a live that reduce engagement.

**Missing:**
- **Pinned message**: Host pins a key message (e.g., "Free shipping today!") visible to all viewers
- **Viewer reactions**: Simple emoji reactions (like TikTok Live) to increase buyer engagement without requiring them to type
- **Replay**: Record the live and make it viewable for 24h after — buyers who missed it can still purchase

---

## Priority Matrix

| # | Feature | Seller Value | Buyer Value | Effort |
|---|---------|-------------|-------------|--------|
| 1 | Seller Analytics | Critical | — | Medium |
| 2 | Notification system | High | Critical | High |
| 3 | Reviews & ratings | High | High | Medium |
| 4 | Order tracking | Medium | High | Low |
| 5 | Global search | Medium | High | Medium |
| 6 | Wishlist | — | Medium | Low |
| 7 | Seller verification | High | Medium | Low |
| 8 | Live stream QoL | High | Medium | Low |

---

## Recommendation

The **seller analytics + notification system** duo is the highest-leverage investment for the next phase:
- Analytics retains sellers by giving them a reason to keep going live
- Notifications retain buyers by pulling them back to the platform in real time

These two features address the two sides of the marketplace simultaneously and should be the first features planned post-PoC.
