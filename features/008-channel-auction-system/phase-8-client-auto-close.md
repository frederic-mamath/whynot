# Phase 8: Client-Side Auto-Close

**Objective**: Automatically close auctions on the client-side when the timer reaches zero, providing instant feedback and ensuring auctions end on time.

**Estimated Time**: 30-45 minutes

---

## Problem Statement

After Phase 7, we have a manual `auction.close` endpoint, but:
- ❌ No automatic closing when timer expires
- ❌ Users must manually close or wait for background job
- ❌ No instant feedback when auction ends
- ❌ Timer can show 0:00 but auction still "active"

---

## Solution: Client-Side Auto-Close with Timer

When the auction countdown reaches zero:
1. Client automatically calls `auction.close` mutation
2. Instant feedback to all users in channel
3. Server validates and processes the close
4. WebSocket broadcasts `auction:ended` to everyone

---

## Tasks

### Task 1: Add Auto-Close to AuctionDisplay Component

**File**: `client/src/components/AuctionDisplay/AuctionDisplay.tsx`

**What to add**:
- `useEffect` hook that monitors countdown timer
- Call `auction.close` mutation when timer reaches 0
- Handle success/error states

**Logic**:
```typescript
const closeAuctionMutation = trpc.auction.close.useMutation({
  onSuccess: (data) => {
    // Auction closed successfully
    // WebSocket will handle UI updates
  },
  onError: (error) => {
    console.error('Failed to close auction:', error);
    toast.error('Failed to close auction. It will be processed automatically.');
  },
});

useEffect(() => {
  if (!auction || !auction.endsAt) return;

  const checkTimer = setInterval(() => {
    const now = Date.now();
    const endsAt = new Date(auction.endsAt).getTime();
    const timeRemaining = endsAt - now;

    // If timer expired and auction hasn't been closed yet
    if (timeRemaining <= 0 && auction.status === 'active') {
      closeAuctionMutation.mutate({ auctionId: auction.id });
    }
  }, 1000); // Check every second

  return () => clearInterval(checkTimer);
}, [auction, closeAuctionMutation]);
```

---

### Task 2: Add Close Button for Host/Seller

**File**: `client/src/components/AuctionDisplay/AuctionDisplay.tsx`

**What to add**:
- Manual "End Auction" button for seller/host
- Only visible to seller or channel host
- Confirms before closing

**UI**:
```typescript
{isHostOrSeller && (
  <Button
    variant="destructive"
    size="sm"
    onClick={handleManualClose}
    disabled={closeAuctionMutation.isLoading}
  >
    <XCircle className="size-4 mr-2" />
    End Auction Early
  </Button>
)}
```

**Handler**:
```typescript
const handleManualClose = () => {
  if (confirm('Are you sure you want to end this auction early?')) {
    closeAuctionMutation.mutate({ auctionId: auction.id });
  }
};
```

---

### Task 3: Prevent Multiple Close Calls

**Issue**: Multiple clients might try to close at the same time when timer expires.

**Solution**: Add optimistic locking in mutation

```typescript
const closeAuctionMutation = trpc.auction.close.useMutation({
  onMutate: () => {
    // Set local flag to prevent duplicate calls
    setIsClosing(true);
  },
  onSuccess: (data) => {
    setIsClosing(false);
  },
  onError: (error) => {
    setIsClosing(false);
    // Ignore "already closed" errors
    if (!error.message.includes('not active')) {
      toast.error('Failed to close auction');
    }
  },
});

// In timer check
if (timeRemaining <= 0 && auction.status === 'active' && !isClosing) {
  closeAuctionMutation.mutate({ auctionId: auction.id });
}
```

---

### Task 4: Update Backend to Handle Idempotent Close

**File**: `src/routers/auction.ts`

**What to change**: Make `auction.close` idempotent (safe to call multiple times)

```typescript
// In auction.close mutation
if (auction.status !== 'active') {
  // Already closed, return existing result
  return {
    auctionId: input.auctionId,
    status: auction.status,
    winnerId: auction.highest_bidder_id,
    winnerUsername: null, // Don't fetch again
    finalPrice: parseFloat(auction.current_bid),
    orderId: null, // Don't know order ID
  };
}
```

---

## Files to Update

### Frontend
1. ✅ `client/src/components/AuctionDisplay/AuctionDisplay.tsx`
   - Add auto-close timer
   - Add manual close button (host/seller only)
   - Add `isClosing` state to prevent duplicates

### Backend
2. ✅ `src/routers/auction.ts`
   - Make `close` mutation idempotent
   - Return gracefully if already closed

---

## Implementation Steps

### Step 1: Add Auto-Close Timer to AuctionDisplay (20 min)

**File**: `client/src/components/AuctionDisplay/AuctionDisplay.tsx`

```typescript
import { useState, useEffect } from 'react';

export function AuctionDisplay({ auction, currentUser, isHost }) {
  const [isClosing, setIsClosing] = useState(false);
  
  const closeAuctionMutation = trpc.auction.close.useMutation({
    onMutate: () => {
      setIsClosing(true);
    },
    onSuccess: (data) => {
      setIsClosing(false);
      console.log('Auction closed:', data);
      // WebSocket will update UI
    },
    onError: (error) => {
      setIsClosing(false);
      // Ignore "already closed" errors
      if (!error.message.includes('not active')) {
        console.error('Failed to close auction:', error);
        toast.error('Failed to close auction automatically');
      }
    },
  });

  // Auto-close when timer expires
  useEffect(() => {
    if (!auction || !auction.endsAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const endsAt = new Date(auction.endsAt).getTime();
      const timeRemaining = endsAt - now;

      // Close when timer expires
      if (timeRemaining <= 0 && !isClosing) {
        console.log('⏰ Timer expired, closing auction:', auction.id);
        closeAuctionMutation.mutate({ auctionId: auction.id });
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction, isClosing, closeAuctionMutation]);

  // ... rest of component
}
```

---

### Step 2: Add Manual Close Button (15 min)

**Add to AuctionDisplay.tsx**:

```typescript
const isHostOrSeller = isHost || auction?.sellerId === currentUser?.id;

const handleManualClose = () => {
  if (confirm('Are you sure you want to end this auction early?')) {
    closeAuctionMutation.mutate({ auctionId: auction.id });
  }
};

// In JSX, add button section
{isHostOrSeller && (
  <div className="mt-4 pt-4 border-t">
    <Button
      variant="outline"
      size="sm"
      onClick={handleManualClose}
      disabled={closeAuctionMutation.isLoading || isClosing}
      className="w-full"
    >
      <XCircle className="size-4 mr-2" />
      {closeAuctionMutation.isLoading ? 'Ending Auction...' : 'End Auction Early'}
    </Button>
  </div>
)}
```

---

### Step 3: Make Backend Idempotent (10 min)

**File**: `src/routers/auction.ts`

**Update the `close` mutation**:

```typescript
close: protectedProcedure
  .input(z.object({
    auctionId: z.string().uuid()
  }))
  .mutation(async ({ ctx, input }) => {
    const auction = await auctionRepository.findById(input.auctionId);
    
    if (!auction) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Auction not found' });
    }

    // ✅ CHANGED: Return gracefully if already closed
    if (auction.status !== 'active') {
      console.log(`Auction ${input.auctionId} already ${auction.status}`);
      return {
        auctionId: input.auctionId,
        status: auction.status,
        winnerId: auction.highest_bidder_id,
        winnerUsername: null,
        finalPrice: parseFloat(auction.current_bid),
        orderId: null,
      };
    }

    // Verify permissions (only if still active)
    const isHost = await isChannelHost(auction.channel_id, ctx.user!.id);
    if (!isHost && auction.seller_id !== ctx.user!.id) {
      throw new TRPCError({ 
        code: 'FORBIDDEN', 
        message: 'Only the seller or host can close the auction' 
      });
    }

    // Continue with closing logic...
    return db.transaction().execute(async (trx) => {
      // ... (rest of Phase 7 implementation)
    });
  }),
```

---

## Acceptance Criteria

### Functionality
- ✅ Auction automatically closes when timer reaches 0:00
- ✅ Manual "End Auction Early" button works for host/seller
- ✅ Multiple close calls don't create errors (idempotent)
- ✅ `auction:ended` WebSocket event received by all users
- ✅ Winner gets notification if they won
- ✅ Order created if winner exists
- ✅ Highlighted product cleared from channel

### User Experience
- ✅ Countdown shows 0:00 for max 1 second before closing
- ✅ Toast notification shows auction ended
- ✅ Auction display clears/updates immediately
- ✅ No duplicate close errors in console
- ✅ Manual close button confirms before executing

### Edge Cases
- ✅ User navigates away during countdown → background job will close
- ✅ Network disconnect when timer expires → retry or background job
- ✅ Multiple users in channel → first to close wins, others ignored
- ✅ Auction already closed manually → auto-close doesn't error

---

## Testing Plan

### Manual Testing

1. **Auto-close on timer expiry**:
   - Start 1-minute auction
   - Wait for countdown to reach 0:00
   - Verify auction closes automatically within 1 second
   - Verify `auction:ended` toast appears
   - Verify order created (check database or My Orders)

2. **Manual close button**:
   - Start auction as seller
   - Click "End Auction Early"
   - Confirm dialog
   - Verify auction closes immediately

3. **Multiple clients**:
   - Open channel in 2 browser tabs
   - Start auction
   - Wait for timer to expire
   - Verify both tabs close without errors
   - Check server logs for only 1 order created

4. **Network disconnect**:
   - Start auction
   - Disconnect network before timer expires
   - Reconnect after timer expires
   - Verify auction eventually closes (background job in Phase 9)

---

## Status

📝 **PLANNING** - Ready to implement after Phase 7

---

## Notes

### Why Client-Side Auto-Close?

**Pros**:
- ✅ Instant feedback to users
- ✅ No delay waiting for background job
- ✅ Better UX (feels responsive)
- ✅ Works for 99% of cases

**Cons**:
- ❌ Won't work if no clients connected when timer expires
- ❌ Relies on client-side timing (can drift)

**Solution**: Phase 9 adds background processor as safety net.

### Timer Synchronization

- Server is source of truth for `endsAt` timestamp
- Client calculates `timeRemaining = endsAt - now`
- Small drift (1-2 seconds) is acceptable
- Background job will catch auctions that clients miss

### Idempotency is Critical

Multiple clients calling `close` simultaneously is expected and normal.
The mutation must handle this gracefully without:
- Creating duplicate orders
- Throwing errors
- Causing confusion

**Solution**: Check auction status first, return early if already closed.

---

**Next**: Implement Phase 8, then proceed to Phase 9 (Background Processor)
