# Phase 9: Background Auction Processor

**Objective**: Add a server-side background job that automatically processes ended auctions, ensuring reliability even when no clients are connected.

**Estimated Time**: 1 hour

---

## Problem Statement

After Phases 7 & 8, auctions can be closed:
- ✅ Manually via `auction.close` mutation
- ✅ Automatically by client timer when countdown expires

**But what if**:
- ❌ No clients are connected when auction ends
- ❌ All clients disconnect before timer expires
- ❌ Client-side timer fails due to browser tab throttling
- ❌ Network issues prevent client from calling `close`

**Solution**: Background job as safety net to ensure all auctions eventually close.

---

## Solution: Scheduled Background Processor

Run a job every 30 seconds that:
1. Finds all `active` auctions where `ends_at <= now`
2. Calls internal close logic for each
3. Creates orders, clears highlights, broadcasts events
4. Logs processed auctions for monitoring

---

## Tasks

### Task 1: Create Auction Processor Module

**File**: `src/jobs/auctionProcessor.ts`

**What to create**:
- `processEndedAuctions()` function
- Interval timer (30 seconds)
- Error handling and logging
- Graceful shutdown

---

### Task 2: Extract Close Logic into Shared Function

**File**: `src/services/auctionService.ts`

**What to create**:
- `closeAuction(auctionId: string)` function
- Used by both `auction.close` mutation and background job
- Handles all closing logic (mark completed, create order, clear highlight, broadcast)

---

### Task 3: Integrate Processor into Server

**File**: `src/index.ts`

**What to add**:
- Import and start auction processor on server startup
- Graceful shutdown when server stops

---

## Files to Create/Update

### New Files
1. ✅ `src/jobs/auctionProcessor.ts` - Background job implementation
2. ✅ `src/services/auctionService.ts` - Shared auction logic

### Updated Files
3. ✅ `src/routers/auction.ts` - Use shared `closeAuction` function
4. ✅ `src/index.ts` - Start processor on server boot

---

## Implementation Steps

### Step 1: Create Auction Service (30 min)

**File**: `src/services/auctionService.ts`

```typescript
import { db } from '../db';
import { sql } from 'kysely';
import { auctionRepository } from '../repositories';
import { broadcastToChannel } from '../websocket/broadcast';

function calculatePlatformFee(finalPrice: number): number {
  return Math.round(finalPrice * 0.07 * 100) / 100;
}

function calculateSellerPayout(finalPrice: number): number {
  return Math.round(finalPrice * 0.93 * 100) / 100;
}

async function isChannelHost(channelId: number, userId: number): Promise<boolean> {
  const channel = await db
    .selectFrom('channels')
    .select('host_id')
    .where('id', '=', channelId)
    .executeTakeFirst();
  return channel?.host_id === userId;
}

/**
 * Close an auction and handle all side effects
 * Used by both API mutation and background processor
 */
export async function closeAuction(auctionId: string): Promise<{
  auctionId: string;
  status: string;
  winnerId: number | null;
  winnerUsername: string | null;
  finalPrice: number | null;
  orderId: string | null;
}> {
  // 1. Get auction
  const auction = await auctionRepository.findById(auctionId);
  
  if (!auction) {
    throw new Error(`Auction ${auctionId} not found`);
  }

  // 2. If already closed, return early (idempotent)
  if (auction.status !== 'active') {
    console.log(`[closeAuction] Auction ${auctionId} already ${auction.status}`);
    return {
      auctionId,
      status: auction.status,
      winnerId: auction.highest_bidder_id,
      winnerUsername: null,
      finalPrice: parseFloat(auction.current_bid),
      orderId: null,
    };
  }

  // 3. Close auction in transaction
  return db.transaction().execute(async (trx) => {
    // Mark auction as completed
    await trx
      .updateTable('auctions')
      .set({ status: 'completed' })
      .where('id', '=', auctionId)
      .execute();

    let orderId = null;
    let winnerUsername = null;

    // Create order if there's a winner
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
          auction_id: auctionId,
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

    // Clear highlighted product from channel
    await trx
      .updateTable('channels')
      .set({ highlighted_product_id: null })
      .where('id', '=', auction.channel_id)
      .execute();

    // Broadcast events (outside transaction to avoid locks)
    setTimeout(() => {
      broadcastToChannel(auction.channel_id, {
        type: 'auction:ended',
        auctionId,
        winnerId: auction.highest_bidder_id,
        winnerUsername,
        finalPrice: parseFloat(auction.current_bid),
        hasWinner: !!auction.highest_bidder_id,
      });

      broadcastToChannel(auction.channel_id, {
        type: 'PRODUCT_UNHIGHLIGHTED',
        channelId: auction.channel_id,
      });
    }, 0);

    console.log(`[closeAuction] Closed auction ${auctionId}, winner: ${winnerUsername || 'none'}, final price: $${auction.current_bid}`);

    return {
      auctionId,
      status: 'completed',
      winnerId: auction.highest_bidder_id,
      winnerUsername,
      finalPrice: parseFloat(auction.current_bid),
      orderId,
    };
  });
}
```

---

### Step 2: Create Background Processor (20 min)

**File**: `src/jobs/auctionProcessor.ts`

```typescript
import { db } from '../db';
import { closeAuction } from '../services/auctionService';

let processorInterval: NodeJS.Timeout | null = null;

/**
 * Process all auctions that have ended but are still marked as active
 */
export async function processEndedAuctions(): Promise<void> {
  try {
    // Find auctions that should be closed
    const endedAuctions = await db
      .selectFrom('auctions')
      .select(['id', 'ends_at', 'product_id'])
      .where('status', '=', 'active')
      .where('ends_at', '<=', new Date())
      .execute();

    if (endedAuctions.length === 0) {
      return;
    }

    console.log(`[AuctionProcessor] Found ${endedAuctions.length} ended auction(s) to process`);

    // Process each auction
    for (const auction of endedAuctions) {
      try {
        await closeAuction(auction.id);
        console.log(`[AuctionProcessor] ✅ Closed auction ${auction.id}`);
      } catch (error) {
        console.error(`[AuctionProcessor] ❌ Failed to close auction ${auction.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[AuctionProcessor] Error processing auctions:', error);
  }
}

/**
 * Start the background processor
 * Runs every 30 seconds
 */
export function startAuctionProcessor(): void {
  if (processorInterval) {
    console.warn('[AuctionProcessor] Already running, skipping start');
    return;
  }

  console.log('[AuctionProcessor] Starting background processor (30s interval)');

  // Run immediately on start
  processEndedAuctions();

  // Then run every 30 seconds
  processorInterval = setInterval(() => {
    processEndedAuctions();
  }, 30000); // 30 seconds
}

/**
 * Stop the background processor
 * Call this on server shutdown
 */
export function stopAuctionProcessor(): void {
  if (processorInterval) {
    console.log('[AuctionProcessor] Stopping background processor');
    clearInterval(processorInterval);
    processorInterval = null;
  }
}
```

---

### Step 3: Update Auction Router to Use Service (10 min)

**File**: `src/routers/auction.ts`

```typescript
import { closeAuction } from '../services/auctionService';

export const auctionRouter = router({
  // ... other mutations

  close: protectedProcedure
    .input(z.object({
      auctionId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify permissions first
      const auction = await auctionRepository.findById(input.auctionId);
      
      if (!auction) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Auction not found' });
      }

      // Only check permissions if auction is still active
      if (auction.status === 'active') {
        const isHost = await isChannelHost(auction.channel_id, ctx.user!.id);
        if (!isHost && auction.seller_id !== ctx.user!.id) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'Only the seller or host can close the auction' 
          });
        }
      }

      // Use shared close logic
      return closeAuction(input.auctionId);
    }),
});
```

---

### Step 4: Integrate into Server (10 min)

**File**: `src/index.ts`

```typescript
import { startAuctionProcessor, stopAuctionProcessor } from './jobs/auctionProcessor';

// After database connection
console.log('Database connected successfully');

// Start background jobs
startAuctionProcessor();

// ... rest of server setup

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  stopAuctionProcessor();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  stopAuctionProcessor();
  process.exit(0);
});
```

---

## Acceptance Criteria

### Functionality
- ✅ Background job starts on server boot
- ✅ Runs every 30 seconds
- ✅ Finds and closes all ended auctions
- ✅ Creates orders for winners
- ✅ Clears highlighted products
- ✅ Broadcasts `auction:ended` events
- ✅ Logs processed auctions
- ✅ Stops gracefully on server shutdown

### Idempotency
- ✅ Can safely run multiple times on same auction
- ✅ Doesn't create duplicate orders
- ✅ Handles auctions already closed by clients

### Error Handling
- ✅ Continues processing other auctions if one fails
- ✅ Logs errors without crashing
- ✅ Retries on next interval (30s later)

---

## Testing Plan

### Manual Testing

1. **Normal case**:
   - Start server
   - Start 1-minute auction
   - Close all browser tabs (no clients)
   - Wait 90 seconds (auction ends + 30s processor interval)
   - Check logs for "Closed auction X"
   - Verify order created in database
   - Verify highlighted product cleared

2. **Multiple auctions**:
   - Start 3 auctions (1min, 2min, 3min)
   - Let them all expire with no clients
   - Check logs show all 3 processed
   - Verify 3 orders created

3. **Already closed**:
   - Start auction
   - Close manually via client
   - Wait for background job
   - Verify no duplicate order created
   - Verify no errors in logs

4. **Graceful shutdown**:
   - Start server
   - Send SIGTERM or SIGINT
   - Verify processor stops gracefully
   - No hanging intervals

### Database Verification

```sql
-- Check for completed auctions
SELECT id, status, ends_at, highest_bidder_id 
FROM auctions 
WHERE status = 'completed';

-- Check orders were created
SELECT o.id, o.final_price, o.payment_status, a.id as auction_id
FROM orders o
JOIN auctions a ON o.auction_id = a.id;

-- Check highlighted products cleared
SELECT id, highlighted_product_id 
FROM channels 
WHERE highlighted_product_id IS NOT NULL;
```

---

## Status

📝 **PLANNING** - Ready to implement after Phase 8

---

## Notes

### Why 30 Seconds?

- **Too short** (e.g., 5s): Wastes resources, competes with client closes
- **Too long** (e.g., 5min): Poor UX, users wait too long
- **30 seconds**: Good balance, safety net without overhead

### Performance Considerations

- Query only `active` auctions (indexed)
- Query only where `ends_at <= now` (indexed)
- Process sequentially (not parallel) to avoid locks
- Each close is a transaction (atomic)

### Monitoring

Add these metrics later (Phase 10+):
- Number of auctions processed per run
- Average processing time
- Failed close attempts
- Client vs background close ratio

### Future Enhancements

- **Dead letter queue**: Failed closes after N retries
- **Alerting**: Notify if processor hasn't run in X minutes
- **Metrics**: Track processor health and performance
- **Manual retry**: Admin endpoint to reprocess failed auctions

---

**Next**: Implement Phase 9, then proceed to Phase 10 (Pending Deliveries Page)
