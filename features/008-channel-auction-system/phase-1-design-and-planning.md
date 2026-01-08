# Phase 1: Design & Planning

**Status**: 📝 PLANNING  
**Estimated Time**: 3-4 hours

---

## Objective

Design the complete auction system architecture including data models, API contracts, WebSocket event flows, UI mockups, and technical implementation strategy.

---

## User-Facing Changes

After this phase, we will have:
- Complete database schema design for auctions, bids, and orders
- Detailed API endpoint specifications
- WebSocket event flow diagrams
- UI component wireframes and interaction flows
- Technical implementation decisions documented

No code will be implemented yet - this is pure planning.

---

## Files to Create/Update

### Documentation
- `features/008-channel-auction-system/phase-1-design-and-planning.md` (this file)
- `features/008-channel-auction-system/diagrams/` (optional)
  - `auction-flow.md` - State machine diagram
  - `websocket-events.md` - Real-time event flow
  - `payment-flow.md` - Payment and fallback logic
  - `ui-wireframes.md` - Component mockups

### Reference (view only, don't modify)
- `migrations/004_create_products.ts` - Understand products schema
- `migrations/011_add_highlighted_product.ts` - Understand highlight system
- `client/src/components/HighlightedProduct/HighlightedProduct.tsx` - Current UI
- `src/routers/channel.ts` - WebSocket broadcast patterns

---

## Steps

### 1. Database Schema Design (1 hour)

#### 1.1 Auctions Table
Design the `auctions` table with:
- ✅ Product and channel relationship
- ✅ Auction timing (start, end, extensions)
- ✅ Pricing (starting price, buyout, current bid)
- ✅ Status tracking (active, ended, paid, cancelled)
- ✅ Indexes for performance

**Key decisions**:
- Use `DECIMAL(10,2)` for all money fields (precision)
- Use `TIMESTAMP WITH TIME ZONE` for accurate time tracking
- Add `extended_count` to track auto-extensions
- Store `duration_seconds` as integer (60, 300, 600, 1800)

#### 1.2 Bids Table
Design the `bids` table with:
- ✅ Auction and bidder relationship
- ✅ Bid amount and timestamp
- ✅ Indexes for querying bid history

**Key decisions**:
- Keep all bids for history (don't delete)
- Index by `auction_id` + `placed_at` DESC for performance
- Add check constraint: `amount > 0`

#### 1.3 Orders Table
Design the `orders` table with:
- ✅ Auction, buyer, seller, product relationships
- ✅ Payment tracking (Stripe, status, deadlines)
- ✅ Fee calculations (platform fee, seller payout)
- ✅ Fulfillment tracking (shipped_at)

**Key decisions**:
- Store platform_fee separately for accounting
- Use `payment_status` enum: pending, paid, failed, refunded
- Store `stripe_payment_intent_id` for idempotency
- Add `payment_deadline` = auction end + 7 days

#### 1.4 Database Constraints & Indexes
- Foreign keys with appropriate ON DELETE behavior
- Check constraints for business rules
- Indexes for common queries
- Unique constraints where needed

---

### 2. API Design (tRPC Endpoints) (1 hour)

#### 2.1 Auction Router (`src/routers/auction.ts`)
Define all auction-related endpoints:

**Seller Endpoints**:
```typescript
auction.start({
  productId: number,
  durationSeconds: 60 | 300 | 600 | 1800,
  buyoutPrice?: number
})

auction.cancel({ auctionId: string })
```

**Buyer Endpoints**:
```typescript
auction.placeBid({
  auctionId: string,
  amount: number
})

auction.buyout({ auctionId: string })
```

**Shared Endpoints**:
```typescript
auction.getActive({ channelId: number })
auction.getBidHistory({ auctionId: string })
auction.getHistory({ shopId: number })
```

**Validation Rules**:
- Seller must be channel host
- Buyer cannot bid on own auction
- Bid amount >= currentBid + 1
- Auto-extend if <30s remaining

#### 2.2 Orders Router (`src/routers/order.ts`)
Define order management endpoints:

```typescript
order.getMyOrders() // Buyer view
order.getPendingDeliveries() // Seller view
order.createPaymentIntent({ orderId: string })
order.markAsShipped({ orderId: string })
```

**Business logic**:
- Calculate 7% platform fee
- Handle payment deadline expiration
- Implement fallback to 2nd bidder

---

### 3. WebSocket Event Design (30 minutes)

#### 3.1 Channel-wide Events (Broadcast)
Events sent to all users in a channel:

```typescript
// Auction started
{
  type: 'auction:started',
  auction: {
    id: string,
    productId: number,
    productName: string,
    startingPrice: number,
    buyoutPrice?: number,
    endsAt: string,
    currentBid: number
  }
}

// New bid placed
{
  type: 'auction:bid_placed',
  auctionId: string,
  bidderUsername: string,
  amount: number,
  nextMinBid: number,
  newEndsAt?: string // If extended
}

// Auction ended
{
  type: 'auction:ended',
  auctionId: string,
  winnerId: number,
  winnerUsername: string,
  finalPrice: number
}
```

#### 3.2 User-specific Events (Direct)
Events sent to individual users:

```typescript
// User was outbid
{
  type: 'auction:outbid',
  auctionId: string,
  productName: string,
  yourBid: number,
  currentBid: number
}

// User won auction
{
  type: 'auction:won',
  orderId: string,
  productName: string,
  finalPrice: number,
  paymentDeadline: string
}
```

**Implementation pattern**:
- Use existing `broadcastToChannel()` for channel events
- Use `sendToConnection()` for user-specific events
- Emit via `channelEvents.emit()` for tRPC subscriptions

---

### 4. UI Component Design (1 hour)

#### 4.1 Auction Widget (in channel)
Enhance `HighlightedProduct` component to become auction interface:

**Components**:
```
AuctionWidget/
├── AuctionCountdown.tsx       # Timer with auto-extend badge
├── BidInput.tsx               # Bid amount input + Place Bid button
├── BuyoutButton.tsx           # Buy Now button (if available)
├── BidHistory.tsx             # Collapsible bid list
└── AuctionWidget.tsx          # Main container
```

**Layout**:
```
┌─────────────────────────────────────┐
│ [Img] Product Name         [X]      │
│       Current Bid: $50              │
│       Buyout: $100                  │
│       ⏱ 02:34 (+30s auto-extend)    │
│                                     │
│       Next Min: $51                 │
│       [$___] [Place Bid]            │
│       [Buy Now for $100] (optional) │
│                                     │
│       ▼ Bid History (5 bids)        │
│         • alice: $50 (just now)     │
│         • bob: $45 (30s ago)        │
└─────────────────────────────────────┘
```

**States**:
- Not started (show "Auction starting soon")
- Active (show bid controls)
- Ending soon (<30s - highlight timer in red)
- Ended (show winner, disable controls)

#### 4.2 Auction Config Modal
Modal that appears when seller highlights a product:

**Fields**:
- Duration selector (radio buttons: 1min, 5min, 10min, 30min)
- Optional buyout price (checkbox + input)
- Start auction button

**Validation**:
- Buyout price must be > starting price
- Duration must be selected

#### 4.3 My Orders Page
New page accessible from NavBar avatar dropdown:

**Layout**:
```
My Orders
─────────────────────────────────────
┌─────────────────────────────────────┐
│ [Img] Product Name                  │
│       Seller: @username             │
│       Won for: $75                  │
│       Status: Pending Payment       │
│       ⏱ Pay within: 6 days 23 hours │
│       [Pay Now] (Stripe)            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [Img] Another Product               │
│       Seller: @seller2              │
│       Won for: $120                 │
│       Status: Paid - Awaiting Ship  │
│       Paid on: Jan 5, 2026          │
└─────────────────────────────────────┘
```

#### 4.4 Pending Deliveries Page (Seller)
New page for sellers to manage shipments:

**Layout**:
```
Pending Deliveries
─────────────────────────────────────
┌─────────────────────────────────────┐
│ [Img] Product Name                  │
│       Buyer: @buyer_username        │
│       Sale Price: $75               │
│       Your Payout: $69.75 (93%)     │
│       Paid on: Jan 7, 2026          │
│       [Mark as Shipped]             │
└─────────────────────────────────────┘
```

#### 4.5 Auction History (in ShopDetailsPage)
Add new section to show completed auctions:

**Component**: `AuctionHistoryCard`
- Product info
- Winner username
- Final sale price
- Expandable bid history

---

### 5. Business Logic & State Machines (30 minutes)

#### 5.1 Auction State Machine
```
NOT_STARTED → ACTIVE → ENDED → PAID
                ↓           ↓
            CANCELLED   CANCELLED
```

**Transitions**:
- `NOT_STARTED → ACTIVE`: Seller starts auction
- `ACTIVE → ENDED`: Timer reaches 0
- `ACTIVE → CANCELLED`: Seller cancels (admin only)
- `ENDED → PAID`: Winner pays
- `ENDED → CANCELLED`: All bidders fail to pay

**Side effects**:
- On `ENDED`: Create order, notify winner
- On `PAID`: Update order status, notify seller
- On `CANCELLED`: No refunds needed (no payment yet)

#### 5.2 Auto-Extend Logic
```typescript
function shouldExtend(auction: Auction, bidTime: Date): boolean {
  const timeRemaining = auction.endsAt - bidTime;
  return timeRemaining < 30; // 30 seconds
}

function extendAuction(auction: Auction): Date {
  return new Date(auction.endsAt.getTime() + 30000); // +30s
}
```

**Rules**:
- Only extend if <30s remaining
- Increment `extended_count`
- Broadcast `auction:extended` event
- Update bid with new `endsAt`

#### 5.3 Payment Fallback Flow
```
Winner doesn't pay (7 days)
  ↓
Offer to 2nd highest bidder (7 days)
  ↓
Offer to 3rd highest bidder (7 days)
  ↓
All fail → Cancel auction
```

**Implementation**:
- Cron job checks payment deadlines daily
- Send reminder notifications (day 5, 6, 7)
- On expiration: mark order as 'failed', offer to next bidder
- Create new order for next bidder with fresh 7-day deadline

#### 5.4 Race Condition Prevention
Use database row-level locking:

```typescript
// Pseudo-code for placeBid
await db.transaction(async (trx) => {
  // Lock auction row
  const auction = await trx
    .selectFrom('auctions')
    .selectAll()
    .where('id', '=', auctionId)
    .forUpdate()
    .executeTakeFirstOrThrow();
  
  // Validate bid
  if (bid.amount < auction.current_bid + 1) {
    throw new Error('Bid too low');
  }
  
  // Insert bid
  await trx.insertInto('bids').values({...}).execute();
  
  // Update auction
  await trx.updateTable('auctions')
    .set({ current_bid: bid.amount })
    .where('id', '=', auctionId)
    .execute();
});
```

---

### 6. Stripe Integration Strategy (30 minutes)

#### 6.1 Stripe Setup Requirements
- ✅ **Stripe Connect** - Marketplace functionality
- ✅ **Connected Accounts** - One per seller
- ✅ **Payment Intents** - For buyer payments
- ✅ **Application Fee** - 7% platform fee

#### 6.2 Payment Flow
1. Buyer clicks "Pay Now" on order
2. Frontend calls `order.createPaymentIntent({ orderId })`
3. Backend creates Stripe Payment Intent:
   ```typescript
   const paymentIntent = await stripe.paymentIntents.create({
     amount: order.final_price * 100, // Convert to cents
     currency: 'usd',
     application_fee_amount: order.platform_fee * 100,
     transfer_data: {
       destination: seller.stripe_account_id,
     },
   });
   ```
4. Frontend shows Stripe Checkout
5. Webhook confirms payment → update order status

#### 6.3 Required Stripe Webhooks
- `payment_intent.succeeded` - Mark order as paid
- `payment_intent.payment_failed` - Handle failed payment
- `account.updated` - Update seller connection status

#### 6.4 Seller Onboarding Flow
Sellers must connect Stripe account before selling:
- Add `stripe_account_id` to `users` table
- Add `stripe_onboarding_complete` boolean
- Require onboarding before creating auctions
- Show "Connect Stripe" prompt in settings

---

## Design Considerations

### Performance
- **Database indexes** on:
  - `auctions.channel_id` (find active auction)
  - `auctions.status` (query by status)
  - `bids.auction_id + placed_at DESC` (bid history)
  - `orders.buyer_id` (my orders)
  - `orders.seller_id + payment_status` (pending deliveries)

- **WebSocket optimization**:
  - Batch bid updates if multiple bids in same second
  - Only send full bid history on request, not on every bid
  - Use tRPC subscriptions for real-time updates

### Security
- **Authorization checks**:
  - Only channel host can start/cancel auction
  - Seller cannot bid on own auction
  - Only order owner can create payment intent
  - Only seller can mark as shipped

- **Input validation**:
  - Bid amount must be positive number
  - Duration must be one of: 60, 300, 600, 1800
  - Buyout price must be > starting price

### Error Handling
- **Concurrent bids** - Use database locking
- **Network failures** - Retry logic on frontend
- **Payment failures** - Show clear error message, retry option
- **Auction expired during bid** - Reject with clear message

### Mobile Considerations
- **Compact auction widget** - Works in mobile view
- **Touch-friendly buttons** - Minimum 44px tap targets
- **Auto-refresh timer** - Prevent stale countdown
- **Simplified bid history** - Show only top 3 on mobile

---

## Acceptance Criteria

- [x] Database schema designed for auctions, bids, orders
- [x] All API endpoints specified with input/output types
- [x] WebSocket event flow documented
- [x] UI components wireframed with states
- [x] Business logic and state machines defined
- [x] Stripe integration strategy documented
- [x] Race condition prevention strategy defined
- [x] Security and validation rules documented
- [x] Mobile considerations addressed
- [ ] Review and approval from team/stakeholder

---

## Testing Checklist

N/A - This is a planning phase with no code to test.

---

## Status

✅ **DONE** - All design decisions documented and ready for implementation.

---

## Notes

### Key Design Decisions

1. **Single auction per channel** - Simplifies UI and prevents confusion. Highlighted product becomes the auctioned product.

2. **Server-side timer** - Client displays countdown but server is source of truth. Prevents cheating.

3. **Auto-extend on every bid <30s** - Prevents sniping, gives everyone fair chance.

4. **No bid retraction** - Makes bidding serious commitment, prevents abuse.

5. **7-day payment window** - Balances urgency with convenience.

6. **Fallback to 2nd bidder** - Maximizes conversion, reduces wasted auctions.

7. **Stripe Connect** - Industry standard for marketplace payments, handles complexity.

8. **Keep all bid history** - Transparency builds trust, data size is minimal.

### Migration Strategy

Since product highlighting already exists:
1. Migration will add auction-specific fields
2. Existing `highlightProduct` will integrate with `auction.start`
3. UI will conditionally show auction vs. static highlight
4. Backward compatible - existing highlights work as before

### Open Questions for Phase 2

- [ ] Should we send email notifications or just in-app?
- [ ] What happens if seller account is deleted mid-auction?
- [ ] Should buyers see other bidders' usernames? (Yes for transparency)
- [ ] Max auction extensions? (Unlimited for now, monitor abuse)

---

**Next Steps**:
1. Review this design with stakeholders
2. Get approval on database schema
3. Set up Stripe test account
4. Begin Phase 2: Database Schema & Migrations
