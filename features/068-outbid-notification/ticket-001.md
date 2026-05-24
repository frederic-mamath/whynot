# Ticket 001 — Backend: emit `auction:outbid` WebSocket event

## Goal

Remove the existing TODO at `auction.ts:363` and implement the `auction:outbid` broadcast. Add `outbidUserId` to the message type so clients can self-filter.

## Acceptance Criteria

- As a buyer who was the highest bidder, when someone places a higher bid, the server broadcasts an `auction:outbid` event to the channel
- The event is NOT sent when there was no previous highest bidder (first bid of the auction)
- The event is NOT sent to the new bidder themselves (they are not outbid — they just won)
- The existing `auction:bid_placed` event continues to fire normally after `auction:outbid`

## Technical Strategy

- Backend
  - Router — `app/src/routers/auction.ts`
    - `placeBid`: inside the transaction, capture `const previousHighestBidderId = auction.highest_bidder_id` before the `updateTable` call (the locked row already contains this value)
    - In the `setTimeout` broadcast block, after the existing `auction:bid_placed` broadcast, add: if `previousHighestBidderId && previousHighestBidderId !== ctx.user.id`, fetch the product name from `products` table and broadcast `auction:outbid`
  - Types — `app/src/websocket/types.ts`
    - `AuctionOutbidMessage`: add `outbidUserId: number` field alongside the existing fields (`auctionId`, `productName`, `yourBid`, `currentBid`). `yourBid` = value of `auction.current_bid` captured before the update (the outbid user's last bid). `currentBid` = `input.amount` (the new winning bid).

### Event shape

```ts
{
  type: 'auction:outbid',
  auctionId: string,       // existing field
  outbidUserId: number,    // NEW — clients filter on this
  productName: string,     // existing field — fetch from products table
  yourBid: number,         // existing field — auction.current_bid before update
  currentBid: number,      // existing field — input.amount
}
```

### Broadcast location in `placeBid`

```ts
setTimeout(() => {
  // existing: auction:extended (if shouldExtend)
  // existing: auction:bid_placed

  // NEW — after auction:bid_placed
  if (previousHighestBidderId && previousHighestBidderId !== ctx.user!.id) {
    db.selectFrom("products")
      .select("name")
      .where("id", "=", auction.product_id)
      .executeTakeFirst()
      .then((product) => {
        broadcastToChannel(auction.channel_id, {
          type: "auction:outbid",
          auctionId: input.auctionId,
          outbidUserId: previousHighestBidderId,
          productName: product?.name ?? "",
          yourBid: parseFloat(auction.current_bid),
          currentBid: input.amount,
        });
      });
  }
}, 0);
```

## Verification

```bash
cd app && npm run build:client   # zero TypeScript errors
```

Manual: start a live, two accounts bid in sequence — confirm backend logs show `auction:outbid` broadcast after the second bid.

## Manual operations to configure services

None.
