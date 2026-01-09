# Phase 7: Auction Cleanup & Validation

**Objective**: Add server-side validation to prevent highlighting conflicts with active auctions, and create endpoint to properly close auctions.

**Estimated Time**: 1-2 hours

---

## Problem Statement

Currently, when an auction ends:
1. ❌ The auction is not marked as `completed`
2. ❌ No order is created for the winner
3. ❌ The `highlighted_product_id` is not cleared from the channel
4. ❌ No `auction:ended` WebSocket event is broadcast
5. ❌ Seller can change highlighted product, but UI doesn't update properly

This causes:
- Confusion about which product is highlighted
- Inability to start new auctions
- Stale state in the ChatPanel
- Manual cleanup required

---

## Solution: Option 3 (Hybrid Approach)

**Phase 7**: Server-side validation + close auction endpoint  
**Phase 8**: Client-side auto-close with timer  
**Phase 9**: Background processor as safety net  

---

## Phase 7 Tasks

### Task 1: Add Validation to `highlightProduct`

**File**: `src/routers/channel.ts`

**What to add**:
- Check if current highlighted product has an active auction
- Prevent highlighting if active auction exists
- Return clear error message

**Logic**:
```typescript
// Before updating channel.highlighted_product_id
const activeAuction = await db
  .selectFrom('auctions')
  .select('id')
  .where('channel_id', '=', input.channelId)
  .where('status', '=', 'active')
  .executeTakeFirst();

if (activeAuction) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Cannot change highlighted product while auction is active. Please close the auction first.',
  });
}
```

---

### Task 2: Create `auction.close` Mutation

**File**: `src/routers/auction.ts`

**Purpose**: Properly close an auction and clean up state

**Input**:
```typescript
{
  auctionId: string; // uuid
}
```

**Process**:
1. Verify auction exists and is active
2. Mark auction as `completed`
3. If there's a winner (highest_bidder_id):
   - Create order with 7-day payment deadline
   - Calculate platform fee (7%) and seller payout (93%)
   - Set payment status to `pending`
4. Clear `highlighted_product_id` from channel
5. Broadcast `auction:ended` event to channel

**Return**:
```typescript
{
  auctionId: string;
  status: 'completed';
  winnerId: number | null;
  winnerUsername: string | null;
  finalPrice: number | null;
  orderId: string | null; // If winner exists
}
```

---

### Task 3: Add `auction:ended` WebSocket Event Handling

**Backend** (`src/routers/auction.ts`):
```typescript
broadcastToChannel(auction.channel_id, {
  type: 'auction:ended',
  auctionId: auction.id,
  winnerId: auction.highest_bidder_id,
  winnerUsername: winner?.firstname && winner.lastname 
    ? `${winner.firstname} ${winner.lastname}` 
    : 'Anonymous',
  finalPrice: parseFloat(auction.current_bid),
  hasWinner: !!auction.highest_bidder_id,
});
```

**Frontend** (`client/src/components/AuctionDisplay/AuctionDisplay.tsx`):
- Listen for `auction:ended` event
- Clear auction state
- Show "Auction Ended" message with winner info
- If current user won, show toast notification

---

### Task 4: Update `auction.start` Validation

**File**: `src/routers/auction.ts`

**Add check**: Prevent starting auction if another active auction exists in the channel

```typescript
// After verifying channel exists
const existingActiveAuction = await db
  .selectFrom('auctions')
  .select('id')
  .where('channel_id', '=', channel.id)
  .where('status', '=', 'active')
  .executeTakeFirst();

if (existingActiveAuction) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'An auction is already active in this channel. Please close it first.',
  });
}
```

---

## Files to Update

### Backend
1. ✅ `src/routers/auction.ts`
   - Add `close` mutation
   - Update `start` validation
   - Add order creation logic

2. ✅ `src/routers/channel.ts`
   - Add active auction check in `highlightProduct`

3. ✅ `src/repositories/OrderRepository.ts`
   - Ensure `create` method exists and is correct

### Frontend
4. ✅ `client/src/components/AuctionDisplay/AuctionDisplay.tsx`
   - Handle `auction:ended` WebSocket event
   - Clear auction state
   - Show ended state UI

5. ✅ `client/src/pages/ChannelDetailsPage.tsx`
   - Handle `auction:ended` to refresh highlighted product

---

## Implementation Steps

### Step 1: Backend - Add `auction.close` Mutation (30 min)

```typescript
close: protectedProcedure
  .input(z.object({
    auctionId: z.string().uuid()
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Get auction and verify it's active
    const auction = await auctionRepository.findById(input.auctionId);
    if (!auction) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Auction not found' });
    }
    if (auction.status !== 'active') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Auction is not active' });
    }

    // 2. Verify user is seller or channel host
    const isHost = await isChannelHost(auction.channel_id, ctx.user!.id);
    if (!isHost && auction.seller_id !== ctx.user!.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the seller or host can close the auction' });
    }

    return db.transaction().execute(async (trx) => {
      // 3. Mark auction as completed
      await trx
        .updateTable('auctions')
        .set({ status: 'completed' })
        .where('id', '=', input.auctionId)
        .execute();

      let orderId = null;
      let winnerUsername = null;

      // 4. Create order if there's a winner
      if (auction.highest_bidder_id) {
        const finalPrice = parseFloat(auction.current_bid);
        const platformFee = calculatePlatformFee(finalPrice);
        const sellerPayout = calculateSellerPayout(finalPrice);
        const paymentDeadline = new Date();
        paymentDeadline.setDate(paymentDeadline.getDate() + 7); // +7 days

        const order = await trx
          .insertInto('orders')
          .values({
            id: sql`gen_random_uuid()`,
            auction_id: input.auctionId,
            buyer_id: auction.highest_bidder_id,
            seller_id: auction.seller_id,
            product_id: auction.product_id,
            final_price: finalPrice.toFixed(2),
            platform_fee: platformFee.toFixed(2),
            seller_payout: sellerPayout.toFixed(2),
            payment_status: 'pending',
            payment_deadline: paymentDeadline,
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        orderId = order.id;

        // Get winner info
        const winner = await trx
          .selectFrom('users')
          .select(['firstname', 'lastname'])
          .where('id', '=', auction.highest_bidder_id)
          .executeTakeFirst();

        winnerUsername = winner?.firstname && winner.lastname
          ? `${winner.firstname} ${winner.lastname}`
          : 'Anonymous';
      }

      // 5. Clear highlighted product from channel
      await trx
        .updateTable('channels')
        .set({ highlighted_product_id: null })
        .where('id', '=', auction.channel_id)
        .execute();

      // 6. Broadcast auction ended event
      setTimeout(() => {
        broadcastToChannel(auction.channel_id, {
          type: 'auction:ended',
          auctionId: input.auctionId,
          winnerId: auction.highest_bidder_id,
          winnerUsername,
          finalPrice: parseFloat(auction.current_bid),
          hasWinner: !!auction.highest_bidder_id,
        });

        // Broadcast product unhighlighted
        broadcastToChannel(auction.channel_id, {
          type: 'PRODUCT_UNHIGHLIGHTED',
          channelId: auction.channel_id,
        });

        // Notify winner if exists
        if (auction.highest_bidder_id && orderId) {
          // TODO: Send direct notification to winner
        }
      }, 0);

      return {
        auctionId: input.auctionId,
        status: 'completed' as const,
        winnerId: auction.highest_bidder_id,
        winnerUsername,
        finalPrice: parseFloat(auction.current_bid),
        orderId,
      };
    });
  }),
```

---

### Step 2: Backend - Add Validation to `highlightProduct` (10 min)

In `src/routers/channel.ts`, before updating the channel:

```typescript
// Check if there's an active auction in this channel
const activeAuction = await db
  .selectFrom('auctions')
  .select('id')
  .where('channel_id', '=', input.channelId)
  .where('status', '=', 'active')
  .executeTakeFirst();

if (activeAuction) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Cannot change highlighted product while auction is active. Please close the auction first.',
  });
}
```

---

### Step 3: Backend - Add Validation to `auction.start` (10 min)

In `src/routers/auction.ts`, after verifying channel exists:

```typescript
// Check no active auction exists for this channel
const existingActiveAuction = await db
  .selectFrom('auctions')
  .select('id')
  .where('channel_id', '=', channel.id)
  .where('status', '=', 'active')
  .executeTakeFirst();

if (existingActiveAuction) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'An auction is already active in this channel',
  });
}
```

---

### Step 4: Frontend - Handle `auction:ended` Event (30 min)

**In AuctionDisplay.tsx**:

```typescript
// Add to WebSocket event handler
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'auction:ended' && data.auctionId === auction?.id) {
      setAuction(null);
      setHighestBid(null);
      
      if (data.winnerId === currentUser?.id) {
        toast.success(`🎉 You won the auction for $${data.finalPrice}!`, {
          description: 'Check "My Orders" to complete payment',
          duration: 5000,
        });
      } else if (data.hasWinner) {
        toast.info(`Auction ended. Winner: ${data.winnerUsername}`, {
          description: `Final price: $${data.finalPrice}`,
        });
      } else {
        toast.info('Auction ended with no winner');
      }
    }
  };
  
  // Add event listener
}, [auction, currentUser]);
```

**In ChannelDetailsPage.tsx**:

```typescript
// In the channel events subscription
if (event.type === 'auction:ended') {
  // Refetch highlighted product to clear it
  utils.channel.getHighlightedProduct.invalidate({
    channelId: Number(channelId)
  });
}
```

---

## Acceptance Criteria

### Backend
- ✅ `auction.close` mutation properly:
  - Marks auction as `completed`
  - Creates order if winner exists
  - Clears `highlighted_product_id` from channel
  - Broadcasts `auction:ended` event
  
- ✅ `highlightProduct` validation:
  - Prevents highlighting when active auction exists
  - Returns clear error message

- ✅ `auction.start` validation:
  - Prevents starting auction when one already active in channel
  - Returns clear error message

### Frontend
- ✅ `auction:ended` event handling:
  - Clears auction display
  - Shows winner notification (if current user won)
  - Shows ended notification (to all users)
  - Clears highlighted product in ChatPanel

### Testing
- ✅ Start auction → manually close → verify order created
- ✅ Try to highlight different product during auction → blocked
- ✅ Try to start second auction in channel → blocked
- ✅ Close auction with no bids → no order created
- ✅ Close auction with bids → order created with correct fees

---

## Status

📝 **PLANNING** - Ready to implement

---

## Notes

### Why This Approach?

This phase focuses on:
1. **Validation** - Prevent invalid states (multiple auctions, highlight conflicts)
2. **Cleanup** - Properly close auctions and create orders
3. **Communication** - Broadcast state changes to all clients

This sets the foundation for Phase 8 (auto-close) and Phase 9 (background processor).

### Edge Cases Handled

- ✅ Auction with no bids (no order created)
- ✅ Concurrent highlight attempts (database validation)
- ✅ Seller/host permissions (only they can close)
- ✅ Already completed auction (can't close twice)

### Next Steps After Phase 7

1. Phase 8: Add client-side timer to auto-close when auction ends
2. Phase 9: Add background job to process auctions that weren't closed by clients
3. This creates a reliable, fault-tolerant auction system

---

**Next**: Implement Phase 7, then proceed to Phase 8 (Client-Side Auto-Close)
