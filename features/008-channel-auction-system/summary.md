# Channel Auction System - Summary

**Created**: January 8, 2026  
**Status**: ✅ COMPLETE

---

## Overview

A real-time auction system allowing sellers to auction highlighted products in their channels, with buyers bidding competitively, and automated order/payment management via Stripe.

---

## User Stories

### Seller

**As a seller**, I want to auction my highlighted product with a time limit and optional buyout price, so that I can maximize sales through competitive bidding and create urgency.

### Buyer

**As a buyer**, I want to bid on products in real-time and see my won auctions in "My Orders", so that I can compete for items I want and complete payment seamlessly.

---

## Business Goals

- **Increase engagement** - Real-time auctions create excitement and keep users in channels longer
- **Drive revenue** - 7% platform fee on all auction sales
- **Create urgency** - Time-limited auctions encourage immediate action
- **Streamline sales** - Automated payment and order tracking reduces manual work
- **Build trust** - Transparent bid history and secure Stripe payments

---

## Progress Tracking

| Phase        | Description                           | Status      |
| ------------ | ------------------------------------- | ----------- |
| Phase 1      | Design & Planning                     | ✅ DONE     |
| Phase 2      | Database Schema & Migrations          | ✅ DONE     |
| Phase 3      | Backend API & WebSocket Events        | ✅ DONE     |
| Phase 4      | Auction UI Components                 | ✅ DONE     |
| Phase 5      | Bidding Flow & Real-time Updates      | ✅ DONE     |
| Phase 6      | My Orders Page (Buyer)                | ✅ DONE     |
| Phase 7      | Auction Cleanup & Validation          | ✅ DONE     |
| Phase 8      | Client-Side Auto-Close                | ✅ DONE     |
| Phase 9      | Background Auction Processor          | ✅ DONE     |
| **Phase 10** | **Auction End Modal & Notifications** | ✅ **DONE** |
| Phase 11     | Pending Deliveries Page (Seller)      | ✅ DONE     |
| **Phase 12** | **Stripe Payment Integration**        | ✅ **DONE** |
| Phase 13     | Testing & Edge Cases                  | 📝 PLANNING |

---

## ⚠️ Critical Issue Identified (Jan 9, 2026)

**Problem**: When an auction ends, the highlighted product doesn't update in ChatPanel. Sellers can't switch highlights.

**Root Cause**:

- No automatic auction closing when timer expires
- No cleanup of `highlighted_product_id` from channel
- No validation preventing highlight conflicts

**Solution**: **Hybrid Approach (Option 3)** - Phases 7-9

### Phase 7: Auction Cleanup & Validation

- Add `auction.close` mutation
- Validate highlight changes against active auctions
- Prevent multiple active auctions in one channel
- Properly create orders and clear state

### Phase 8: Client-Side Auto-Close

- Auto-close auction when countdown reaches zero
- Manual "End Auction" button for host/seller
- Instant feedback via WebSocket
- Handles 99% of cases

### Phase 9: Background Processor (Safety Net)

- Server-side job runs every 30 seconds
- Closes auctions that clients missed
- Handles offline/disconnected scenarios
- Ensures 100% reliability

**Status**: Phases 7-9 planned and documented, ready to implement

---

## Key Features

### Auction Mechanics

- ✅ **Starting price** - Set in shop configuration
- ✅ **Duration** - Seller chooses when highlighting product (1min, 5min, 10min, 30min)
- ✅ **Auto-extend** - +30 seconds when bid placed in last 30 seconds
- ✅ **Minimum bid increment** - $1 above current highest bid
- ✅ **Optional buyout price** - Instant win option
- ✅ **One auction at a time** - Only highlighted product is auctioned

### Real-time Updates (WebSocket)

- ✅ **Live bid updates** - All channel viewers see new bids instantly
- ✅ **Timer countdown** - Server-side synchronized countdown
- ✅ **Outbid notifications** - Toast notification when outbid
- ✅ **Auction end notification** - Winner and participants notified
- ✅ **Bid history** - Full history visible to all users

### Payment & Orders

- ✅ **Stripe integration** - Secure payment processing
- ✅ **7% platform fee** - Automatically calculated and withheld
- ✅ **1 week payment deadline** - Winner has 7 days to pay
- ✅ **Fallback to 2nd bidder** - If winner doesn't pay, offer to 2nd place
- ✅ **Order tracking** - "My Orders" page for buyers
- ✅ **Delivery tracking** - "Pending Deliveries" page for sellers

### User Experience

- ✅ **No bid retraction** - Bids are binding commitments
- ✅ **Toast notifications** - For outbid, won, payment reminders
- ✅ **Mobile responsive** - Full functionality on all devices
- ✅ **Bid history viewer** - See all bids with usernames and timestamps

---

## UI/UX Components

### ✅ Completed

- None yet

### ⏳ To Create

#### Seller Components

- **AuctionConfigModal** - Configure auction when highlighting product
  - Duration selector (1min, 5min, 10min, 30min)
  - Optional buyout price input
  - Confirmation button
- **PendingDeliveriesPage** - View orders awaiting shipment
  - List of sold products
  - Buyer information
  - Final sale price
  - Payment confirmation status
  - Mark as shipped button

- **AuctionHistoryCard** (in ShopDetailsPage) - View completed auction details
  - Product info
  - Final sale price
  - Winner username
  - All bids with usernames and timestamps
  - Auction duration and end time

#### Buyer Components

- **AuctionWidget** - Display active auction in channel
  - Product image and name
  - Current highest bid
  - Next minimum bid ($1 increment)
  - Countdown timer (with auto-extend indicator)
  - Buyout price (if set)
  - Bid input field + "Place Bid" button
  - "Buy Now" button (if buyout available)
  - Bid history collapsible section
- **MyOrdersPage** - View won auctions
  - List of won products
  - Seller information
  - Winning bid amount
  - Payment status (Pending/Paid)
  - Payment deadline countdown
  - "Pay Now" button (Stripe Checkout)
- **BidHistoryViewer** - Show all bids in auction
  - Username, bid amount, timestamp
  - Highlight current user's bids
  - Highlight winning bid (if ended)

#### Shared Components

- **AuctionCountdown** - Reusable countdown timer
  - Server-synchronized time
  - Auto-extend indicator (+30s badge)
  - Visual urgency (color changes)

---

## API/Backend Changes

### New Database Tables

#### `auctions`

- `id` (uuid, PK)
- `product_id` (FK to products)
- `seller_id` (FK to users)
- `channel_id` (FK to channels)
- `starting_price` (decimal)
- `buyout_price` (decimal, nullable)
- `current_bid` (decimal, default: starting_price)
- `highest_bidder_id` (FK to users, nullable)
- `duration_seconds` (integer: 60, 300, 600, 1800)
- `started_at` (timestamp)
- `ends_at` (timestamp)
- `extended_count` (integer, default: 0)
- `status` (enum: 'active', 'ended', 'paid', 'cancelled')
- `created_at`, `updated_at`

#### `bids`

- `id` (uuid, PK)
- `auction_id` (FK to auctions)
- `bidder_id` (FK to users)
- `amount` (decimal)
- `placed_at` (timestamp)
- `created_at`

#### `orders`

- `id` (uuid, PK)
- `auction_id` (FK to auctions)
- `buyer_id` (FK to users)
- `seller_id` (FK to users)
- `product_id` (FK to products)
- `final_price` (decimal)
- `platform_fee` (decimal, calculated: 7%)
- `seller_payout` (decimal, calculated: 93%)
- `payment_status` (enum: 'pending', 'paid', 'failed', 'refunded')
- `payment_deadline` (timestamp, +7 days from auction end)
- `stripe_payment_intent_id` (string, nullable)
- `paid_at` (timestamp, nullable)
- `shipped_at` (timestamp, nullable)
- `created_at`, `updated_at`

### New API Endpoints (tRPC)

#### Seller Endpoints

- `auction.start` - Start auction for highlighted product
  - Input: `{ productId, durationSeconds, buyoutPrice? }`
  - Returns: `Auction` object
- `auction.cancel` - Cancel active auction (admin only)
  - Input: `{ auctionId }`
- `orders.getPendingDeliveries` - Get orders awaiting shipment
  - Returns: `Order[]` with buyer info
- `orders.markAsShipped` - Mark order as shipped
  - Input: `{ orderId }`

#### Buyer Endpoints

- `auction.placeBid` - Place a bid
  - Input: `{ auctionId, amount }`
  - Validates: amount >= currentBid + 1, auction active, not seller
  - Side effect: Auto-extend if <30s remaining
- `auction.buyout` - Buy product at buyout price
  - Input: `{ auctionId }`
  - Validates: buyout price set, auction active
  - Side effect: End auction immediately
- `auction.getMyOrders` - Get buyer's won auctions
  - Returns: `Order[]` with payment status
- `orders.createPaymentIntent` - Create Stripe payment intent
  - Input: `{ orderId }`
  - Returns: Stripe client secret

#### Shared Endpoints

- `auction.getActive` - Get active auction for channel
  - Input: `{ channelId }`
  - Returns: `Auction` with current bids
- `auction.getBidHistory` - Get all bids for auction
  - Input: `{ auctionId }`
  - Returns: `Bid[]` with bidder usernames
- `auction.getHistory` - Get completed auctions for shop
  - Input: `{ shopId }`
  - Returns: `Auction[]` with winner info

### WebSocket Events

#### Broadcast to Channel

- `auction:started` - New auction started
  - Payload: `Auction` object
- `auction:bid_placed` - New bid placed
  - Payload: `{ auctionId, bidderUsername, amount, nextMinBid, newEndsAt? }`
- `auction:extended` - Timer extended
  - Payload: `{ auctionId, newEndsAt }`
- `auction:ended` - Auction ended
  - Payload: `{ auctionId, winnerId, winnerUsername, finalPrice }`
- `auction:bought_out` - Product bought at buyout price
  - Payload: `{ auctionId, buyerId, buyerUsername, buyoutPrice }`

#### Direct to User

- `auction:outbid` - User was outbid
  - Payload: `{ auctionId, productName, yourBid, currentBid }`
- `auction:won` - User won auction
  - Payload: `{ auctionId, productName, finalPrice, paymentDeadline }`
- `order:payment_reminder` - Payment deadline approaching
  - Payload: `{ orderId, productName, hoursRemaining }`

---

## Business Logic & Rules

### Auction Lifecycle

1. **Start** - Seller highlights product and configures auction
2. **Active** - Buyers place bids, timer counts down
3. **Auto-extend** - If bid placed in last 30s, add 30s to timer
4. **End** - Timer reaches 0 or buyout triggered
5. **Order Created** - Winner gets order with 7-day payment deadline
6. **Payment** - Buyer pays via Stripe
7. **Delivery** - Seller ships, marks as shipped
8. **Complete** - Order closed

### Bid Validation Rules

- ✅ Amount >= current bid + $1
- ✅ Auction status = 'active'
- ✅ Bidder != seller
- ✅ Bidder is authenticated
- ✅ Handle race conditions with database locking

### Payment Fallback Flow

1. Winner has 7 days to pay
2. Daily reminder notifications (day 5, 6, 7)
3. If not paid by deadline:
   - Order marked as 'failed'
   - Offer to 2nd highest bidder (new 7-day deadline)
   - If 2nd bidder fails, offer to 3rd, etc.
   - If all fail, auction marked as 'cancelled'

### Platform Fee Calculation

- **Final Price** = Winning bid
- **Platform Fee** = Final Price × 0.07 (7%)
- **Seller Payout** = Final Price × 0.93 (93%)
- Stripe handles fee distribution via Connect

---

## Testing Plan

### Unit Tests

- `placeBid` - Validates amount, timing, permissions
- `autoExtend` - Correctly adds 30s when <30s remaining
- `calculateFees` - 7% platform fee, 93% seller payout
- `buyout` - Ends auction, creates order immediately
- `paymentFallback` - Offers to 2nd bidder if winner doesn't pay

### Integration Tests

- **Full auction flow** - Start → Bid → Win → Pay → Ship
- **Concurrent bids** - Handle race conditions correctly
- **WebSocket events** - All users receive updates
- **Payment flow** - Stripe integration works end-to-end
- **Fallback flow** - 2nd bidder gets offer if 1st fails

### Manual QA Checklist

- [ ] Start auction with all duration options
- [ ] Place bids as multiple users simultaneously
- [ ] Verify auto-extend triggers correctly (<30s)
- [ ] Test buyout ends auction immediately
- [ ] Verify outbid notifications appear
- [ ] Check "My Orders" shows correct status
- [ ] Complete Stripe payment (test mode)
- [ ] Verify "Pending Deliveries" for seller
- [ ] Check bid history shows all participants
- [ ] Test mobile responsive layout
- [ ] Verify accessibility (keyboard nav, screen readers)

### Edge Cases

- [ ] Bid placed exactly at timer end
- [ ] Multiple bids in auto-extend window
- [ ] Network disconnect during bid
- [ ] Seller tries to bid on own auction
- [ ] Buyout clicked while bid processing
- [ ] Payment deadline expires
- [ ] All bidders fail to pay
- [ ] Auction cancelled mid-way

---

## Success Metrics

### User Engagement

- **Auction participation rate** - % of channel viewers who bid
- **Average bids per auction** - Competition level
- **Time spent in channel during auction** - Engagement duration
- **Repeat bidders** - Users who participate in multiple auctions

### Business Impact

- **Auction conversion rate** - % of auctions that result in payment
- **Average final price vs starting price** - Price appreciation
- **Platform fee revenue** - Total 7% fees collected
- **Seller adoption** - % of sellers using auction feature

### Technical Health

- **WebSocket latency** - Bid update delivery time (<100ms)
- **Concurrent auction capacity** - Max simultaneous auctions
- **Payment success rate** - % of Stripe payments that succeed
- **Fallback success rate** - % of 2nd bidders who complete payment

---

## Technical Considerations

### Race Condition Prevention

```sql
-- Use database-level locking for concurrent bids
BEGIN;
SELECT * FROM auctions WHERE id = $1 FOR UPDATE;
-- Validate bid amount against locked row
-- Insert bid if valid
COMMIT;
```

### Timer Synchronization

- Server is source of truth for time
- Client displays countdown but validates with server
- WebSocket sends periodic time updates (every 5s)
- Auto-extend calculated server-side only

### Stripe Integration

- Use **Stripe Connect** for seller payouts
- Use **Payment Intents** for buyer payments
- Automatically split payment (93% to seller, 7% platform)
- Handle webhooks for payment confirmation

### Data Archival

- Keep completed auctions indefinitely (small data size)
- Index by `seller_id`, `channel_id`, `created_at` for queries
- Soft-delete old orders after 1 year (for analytics)

---

## Open Questions / Future Enhancements

### Not in MVP

- ❌ Auction preview for sellers
- ❌ Push notifications (explore free options like Web Push API?)
- ❌ Email notifications (requires email service setup)
- ❌ Dispute resolution system
- ❌ Seller analytics dashboard
- ❌ Multiple simultaneous auctions per seller

### Future Considerations

- **Web Push API** - Free browser notifications (investigate in Phase 10)
- **Email service** - SendGrid free tier (1000 emails/day)
- **Auction scheduling** - Pre-schedule auctions for specific times
- **Reserve price** - Hidden minimum acceptable price
- **Proxy bidding** - Auto-bid up to user's max amount

---

## Dependencies

### External Services

- ✅ **Stripe** - Payment processing and seller payouts
  - Need Stripe Connect for marketplace functionality
  - Test mode for development

### Internal Systems

- ✅ **WebSocket infrastructure** - Already exists for streaming
- ✅ **Shop system** - Relies on existing shops and products
- ✅ **Authentication** - User must be logged in to bid/pay

### New Dependencies

- 📦 `@stripe/stripe-js` - Stripe frontend SDK
- 📦 `stripe` (backend) - Already installed? (check)

---

## Status

📝 **PLANNING** - Requirements gathered, ready for Phase 1 (Design & Planning)

---

**Next Steps**:

1. Review and approve this summary
2. Begin Phase 1: Create detailed UI mockups and data flow diagrams
3. Set up Stripe Connect test account
4. Design database schema in detail
