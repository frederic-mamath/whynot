# Phase 5: Bidding Flow & Real-time Updates

**Status**: ⏳ IN PROGRESS  
**Estimated Time**: 2-3 hours

---

## Objective

Integrate auction UI components with backend API and WebSocket for real-time bidding functionality.

---

## User-Facing Changes

After this phase:
- Sellers can start auctions from highlighted products
- Buyers can place bids and see real-time updates
- All users see countdown timer and bid updates instantly
- Buy Now button works for instant purchase
- Toast notifications for all auction events
- Automatic auction refresh on WebSocket events

---

## Files to Update

### Main Integration Files
- `client/src/pages/ChannelDetailsPage.tsx` - Main integration point
- `client/src/components/HighlightedProduct/HighlightedProduct.tsx` - Add auction trigger

### Supporting Files (if needed)
- `client/src/lib/trpc.ts` - Ensure auction/order routers are typed
- WebSocket event handlers (if separate file exists)

---

## Steps

### 1. Update HighlightedProduct Component (30 min)

Add "Start Auction" button for channel hosts when product is highlighted.

**Changes**:
```typescript
import { AuctionConfigModal } from "../AuctionConfigModal";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";

export function HighlightedProduct({ product, isHost }) {
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const utils = trpc.useUtils();
  
  const startAuctionMutation = trpc.auction.start.useMutation({
    onSuccess: () => {
      toast.success("Auction started!");
      setShowAuctionModal(false);
      utils.auction.getActive.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStartAuction = async (config) => {
    await startAuctionMutation.mutateAsync({
      productId: product.id,
      ...config,
    });
  };

  return (
    <div>
      {/* Existing product display */}
      
      {/* Start Auction Button (Host only) */}
      {isHost && (
        <Button onClick={() => setShowAuctionModal(true)}>
          Start Auction
        </Button>
      )}

      {/* Auction Config Modal */}
      <AuctionConfigModal
        productId={product.id}
        productName={product.name}
        startingPrice={product.price}
        isOpen={showAuctionModal}
        onClose={() => setShowAuctionModal(false)}
        onStart={handleStartAuction}
      />
    </div>
  );
}
```

---

### 2. Integrate AuctionWidget in ChannelDetailsPage (1 hour)

Replace or augment HighlightedProduct display with AuctionWidget when auction is active.

**Implementation**:

```typescript
import { AuctionWidget } from "../components/AuctionWidget";
import { HighlightedProduct } from "../components/HighlightedProduct";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";

export function ChannelDetailsPage() {
  const { channelId } = useParams();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  // Fetch active auction
  const { data: activeAuction, refetch: refetchAuction } = 
    trpc.auction.getActive.useQuery(
      { channelId: Number(channelId) },
      { refetchInterval: 5000 } // Poll every 5s as fallback
    );

  // Fetch bid history if auction exists
  const { data: bids = [] } = trpc.auction.getBidHistory.useQuery(
    { auctionId: activeAuction?.id || "" },
    { enabled: !!activeAuction }
  );

  // Place bid mutation
  const placeBidMutation = trpc.auction.placeBid.useMutation({
    onSuccess: () => {
      toast.success("Bid placed successfully!");
      refetchAuction();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Buyout mutation
  const buyoutMutation = trpc.auction.buyout.useMutation({
    onSuccess: (data) => {
      toast.success(`Purchased for $${data.finalPrice.toFixed(2)}!`);
      refetchAuction();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePlaceBid = async (amount: number) => {
    if (!activeAuction) return;
    await placeBidMutation.mutateAsync({
      auctionId: activeAuction.id,
      amount,
    });
  };

  const handleBuyout = async () => {
    if (!activeAuction) return;
    await buyoutMutation.mutateAsync({
      auctionId: activeAuction.id,
    });
  };

  return (
    <div>
      {/* Channel info, video, etc. */}
      
      {/* Auction or Highlighted Product */}
      <div className="p-4">
        {activeAuction ? (
          <AuctionWidget
            auction={activeAuction}
            bids={bids}
            currentUserId={user?.id}
            onPlaceBid={handlePlaceBid}
            onBuyout={handleBuyout}
            isLoading={false}
          />
        ) : highlightedProduct ? (
          <HighlightedProduct
            product={highlightedProduct}
            isHost={isHost}
          />
        ) : null}
      </div>
    </div>
  );
}
```

---

### 3. WebSocket Event Handling (45 min)

Subscribe to auction WebSocket events for real-time updates.

**Pattern** (add to ChannelDetailsPage):

```typescript
useEffect(() => {
  if (!ws || !activeAuction) return;

  const handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'auction:started':
          toast.info("Auction started!");
          refetchAuction();
          break;
          
        case 'auction:bid_placed':
          // Refetch auction data
          refetchAuction();
          // Show notification if not current user
          if (message.bidderId !== user?.id) {
            toast.info(
              `${message.bidderUsername} bid $${message.amount.toFixed(2)}`
            );
          }
          break;
          
        case 'auction:extended':
          // Update will come from refetch
          toast.info("Auction extended by 30 seconds!");
          refetchAuction();
          break;
          
        case 'auction:ended':
          toast.success(
            `Auction won by ${message.winnerUsername} for $${message.finalPrice.toFixed(2)}`
          );
          refetchAuction();
          break;
          
        case 'auction:bought_out':
          toast.success(
            `${message.buyerUsername} bought for $${message.buyoutPrice.toFixed(2)}`
          );
          refetchAuction();
          break;
          
        case 'auction:outbid':
          // User-specific: someone outbid you
          toast.warning(
            `You've been outbid on ${message.productName}! Current bid: $${message.currentBid.toFixed(2)}`
          );
          break;
          
        case 'auction:won':
          // User-specific: you won!
          toast.success(
            `🎉 You won ${message.productName} for $${message.finalPrice.toFixed(2)}!`
          );
          break;
      }
    } catch (err) {
      console.error("Failed to handle WebSocket message:", err);
    }
  };

  ws.addEventListener('message', handleMessage);
  return () => ws.removeEventListener('message', handleMessage);
}, [ws, activeAuction, user]);
```

---

### 4. Countdown Sync with WebSocket (15 min)

Handle auction extension events to keep countdown in sync.

**Add state to track endsAt**:
```typescript
const [localEndsAt, setLocalEndsAt] = useState<string | null>(null);

useEffect(() => {
  if (activeAuction) {
    setLocalEndsAt(activeAuction.endsAt);
  }
}, [activeAuction]);

// In WebSocket handler
case 'auction:extended':
  setLocalEndsAt(message.newEndsAt);
  break;

// Pass to AuctionWidget
<AuctionWidget
  auction={{
    ...activeAuction,
    endsAt: localEndsAt || activeAuction.endsAt
  }}
  // ...
/>
```

---

### 5. Loading States & Error Handling (20 min)

Add proper loading and error states for better UX.

**Loading State**:
```typescript
const { data: activeAuction, isLoading, error } = 
  trpc.auction.getActive.useQuery({ channelId });

if (isLoading) {
  return <AuctionWidget isLoading />;
}

if (error) {
  return (
    <div className="text-center p-4 text-destructive">
      Failed to load auction: {error.message}
    </div>
  );
}
```

**Mutation Loading States**:
- Disable bid input while submitting
- Show loading spinner on buyout button
- Prevent double-submission

---

### 6. Optimistic Updates (Optional, 15 min)

Update UI immediately before server confirms (better UX).

```typescript
const placeBidMutation = trpc.auction.placeBid.useMutation({
  onMutate: async (newBid) => {
    // Cancel outgoing refetches
    await utils.auction.getActive.cancel();
    
    // Snapshot current value
    const previous = utils.auction.getActive.getData({ channelId });
    
    // Optimistically update
    utils.auction.getActive.setData({ channelId }, (old) => 
      old ? { ...old, currentBid: newBid.amount } : old
    );
    
    return { previous };
  },
  onError: (err, newBid, context) => {
    // Rollback on error
    utils.auction.getActive.setData(
      { channelId }, 
      context?.previous
    );
  },
  onSettled: () => {
    // Always refetch after error or success
    utils.auction.getActive.invalidate({ channelId });
  },
});
```

---

### 7. Toast Notifications (10 min)

Ensure all user actions have appropriate feedback.

**Already handled in mutations**, but ensure consistency:

```typescript
// Success
toast.success("Bid placed successfully!");

// Error
toast.error(error.message);

// Info
toast.info("New bid placed");

// Warning
toast.warning("You've been outbid!");
```

---

### 8. Cleanup & Polish (20 min)

**Final touches**:
1. Remove console.logs
2. Add error boundaries around auction widget
3. Test keyboard navigation
4. Verify mobile responsive layout
5. Check accessibility (screen reader)
6. Add loading spinners where missing
7. Ensure proper cleanup on unmount

---

## Design Considerations

### Polling vs WebSocket

**Strategy**: Use both for reliability
- WebSocket for instant updates
- Polling (5s interval) as fallback
- Refetch on window focus

```typescript
const { data: auction } = trpc.auction.getActive.useQuery(
  { channelId },
  {
    refetchInterval: 5000, // Poll every 5s
    refetchOnWindowFocus: true,
  }
);
```

### Race Conditions

**Problem**: User places bid, WebSocket event arrives before mutation completes

**Solution**: 
- Optimistic updates
- Debounce refetch calls
- Use mutation callbacks properly

### Stale Data

**Problem**: User switches channels, old auction data might show

**Solution**:
```typescript
useEffect(() => {
  // Reset local state when channel changes
  setLocalEndsAt(null);
  utils.auction.getActive.invalidate();
}, [channelId]);
```

### Memory Leaks

**Problem**: WebSocket listeners not cleaned up

**Solution**:
```typescript
useEffect(() => {
  const handler = (event) => { /* ... */ };
  ws?.addEventListener('message', handler);
  return () => ws?.removeEventListener('message', handler);
}, [ws, /* dependencies */]);
```

---

## Acceptance Criteria

- [ ] Seller can start auction from highlighted product
- [ ] Auction config modal validates inputs
- [ ] AuctionWidget displays active auction
- [ ] Countdown timer updates every second
- [ ] Buyers can place bids
- [ ] Bid validation works (min amount)
- [ ] Buyout button ends auction
- [ ] WebSocket events trigger UI updates
- [ ] Auto-extend works (<30s bidding)
- [ ] Toast notifications show for all events
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Mobile layout works correctly
- [ ] Multiple users can bid simultaneously
- [ ] Winner display shows after auction ends
- [ ] No memory leaks (WebSocket cleanup)

---

## Testing Checklist

### Manual Testing

**Seller Flow**:
- [ ] Click "Start Auction" on highlighted product
- [ ] Select duration (try each option)
- [ ] Enter optional buyout price
- [ ] Submit and verify auction starts
- [ ] Cannot bid on own auction

**Buyer Flow**:
- [ ] See active auction in channel
- [ ] Enter bid amount
- [ ] Submit bid (valid amount)
- [ ] Try invalid bid (too low)
- [ ] Try bidding in last 30 seconds (verify extend)
- [ ] Click "Buy Now" if available
- [ ] Win auction and see notification

**Real-time Updates**:
- [ ] Open two browsers (different users)
- [ ] User A places bid
- [ ] User B sees update instantly
- [ ] Countdown syncs across browsers
- [ ] Auto-extend shows on all clients

**Edge Cases**:
- [ ] Network disconnects and reconnects
- [ ] Rapid bidding (stress test)
- [ ] Auction ends while user is bidding
- [ ] Switch channels during auction
- [ ] Refresh page during auction

---

## Status

⏳ **IN PROGRESS** - Integrating components

---

## Notes

### WebSocket Message Types

From `src/websocket/types.ts`:
```typescript
'auction:started'
'auction:bid_placed'
'auction:extended'
'auction:ended'
'auction:bought_out'
'auction:outbid'
'auction:won'
```

### tRPC Endpoints

From Phase 3:
```typescript
trpc.auction.start
trpc.auction.placeBid
trpc.auction.buyout
trpc.auction.getActive
trpc.auction.getBidHistory
trpc.auction.getHistory
```

### Common Errors to Handle

1. **"Auction has ended"** - User tried to bid after time expired
2. **"Bid too low"** - Amount less than currentBid + 1
3. **"Cannot bid on own auction"** - Seller tried to bid
4. **"Not authenticated"** - User not logged in
5. **"Auction not found"** - Invalid auction ID

### Performance Optimization

**Avoid unnecessary refetches**:
```typescript
// Bad: Refetch on every render
useEffect(() => {
  refetch();
});

// Good: Refetch only when needed
useEffect(() => {
  refetch();
}, [channelId, activeAuction?.id]);
```

**Debounce WebSocket refetches**:
```typescript
const debouncedRefetch = useMemo(
  () => debounce(refetchAuction, 500),
  [refetchAuction]
);
```

---

**Next Steps**:
1. Update HighlightedProduct with auction trigger
2. Integrate AuctionWidget in ChannelDetailsPage
3. Add WebSocket event handlers
4. Test real-time bidding flow
5. Fix any bugs found during testing
6. Proceed to Phase 6 (My Orders Page)
