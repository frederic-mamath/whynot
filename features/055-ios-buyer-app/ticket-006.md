# ticket-006 — Chat + Live Events

## Acceptance Criteria

- As a buyer in a live, when I open the live, I should see the last 50 chat messages
- As a buyer in a live, I should see new messages appear in real time as others send them
- As a buyer in a live, when I type and send a message, it should appear in the chat immediately
- As a buyer in a live, when the seller highlights a product, I should see a product card overlay appear on screen
- As a buyer in a live, when the seller removes the highlight, the product card overlay should disappear

## Technical Strategy

- Frontend
  - `src/components/live/ChatPanel.tsx`
    - Props: `channelId: number`
    - `trpc.message.list.useQuery({ channelId, limit: 50 })` on mount → initial messages
    - `trpc.message.subscribe.useSubscription({ channelId }, { onData: appendMessage })` → real-time
    - `FlatList` of messages (username + content), auto-scroll to bottom on new message
    - `TextInput` + send button → `trpc.message.send.useMutation({ channelId, content })`
    - Semi-transparent background (messages readable over video)
  - `src/components/live/HighlightedProduct.tsx`
    - Props: `product: { name, price, imageUrl } | null`
    - Card overlay: product image, name, formatted price
    - Positioned at top-center of the live screen
    - Returns `null` when `product` is null
  - `app/live/[liveId].tsx` — add to existing screen
    - `highlightedProduct` state (null by default)
    - `trpc.live.subscribeToEvents.useSubscription({ channelId })`:
      - `PRODUCT_HIGHLIGHTED` event → set `highlightedProduct`
      - `PRODUCT_UNHIGHLIGHTED` event → set `highlightedProduct` to null
    - Render `<HighlightedProduct product={highlightedProduct} />` in the overlay layer

## tRPC Procedures

- `message.list(channelId, limit)` → `{ id, content, user: { nickname }, createdAt }[]`
- `message.subscribe(channelId)` → WebSocket stream of `{ id, content, user, createdAt }`
- `message.send(channelId, content)` → void
- `live.subscribeToEvents(channelId)` → WebSocket stream of `{ type, product?, ... }`

## Manual Operations

- None — WebSocket is already handled by the tRPC WS link configured in ticket-001
