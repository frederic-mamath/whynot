# Ticket 002 — iOS: snap-scroll layout + read-only product lineup

## Goal

Transform the live screen into a two-page snap-scroll. Page 1 = existing video + overlays (untouched). Page 2 = product lineup with read-only cards and interest counts (no toggle yet — that's ticket 003). Empty state when no products are linked.

## Acceptance Criteria

- As a buyer, the live screen looks and behaves exactly as before when on page 1
- As a buyer, when I swipe down, the screen snaps to a full-height product list
- As a buyer, when I swipe back up, I return to the video
- As a buyer, when the live has products linked, I see each product's image, name, price, and interest count
- As a buyer, when no products are linked, I see a placeholder message
- The video stays full screen on page 1 — it does NOT shrink or crop

## Technical Strategy

- Screen (modify) — `ios-app/app/live/[liveId].tsx`
  - Import `ScrollView`, `Dimensions` from `react-native`
  - Define `const SCREEN_HEIGHT = Dimensions.get("window").height`
  - Replace the root `<View style={styles.container}>` with a `<ScrollView>` configured as:
    ```tsx
    <ScrollView
      pagingEnabled
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      bounces={false}
    >
    ```
  - Wrap all existing JSX (video layer + overlays + widgets) in `<View style={{ height: SCREEN_HEIGHT, overflow: "hidden" }}>` — this is page 1. The `overflow: "hidden"` prevents absolute-positioned children from bleeding into page 2.
  - Add a subtle swipe-down cue at the bottom of page 1 (inside the page 1 wrapper, absolute positioned at bottom): a small chevron down icon + "Produits du live" label in white with low opacity. Only show when `liveStatus === "active"` and products exist.
  - Add `<View style={{ height: SCREEN_HEIGHT }}>` immediately after — this is page 2, rendered by the new `LiveProductList` component
  - Fetch products in this screen: `trpc.product.listByChannel.useQuery({ channelId }, { enabled: liveStatus === "active" })`

- Component (create) — `ios-app/src/components/live/LiveProductList.tsx`
  - Props: `products: Array<{ id, name, imageUrl, price, wishedPrice, interestedCount, isInterestedByCurrentUser }>`, `isLoading: boolean`, `isSellerView: boolean`
  - Renders a vertical `FlatList` inside the full-height page 2 view
  - Header: "Produits du live" title + product count
  - Each item: `LiveProductCard` component (see below)
  - Empty state: centered placeholder with a subtle message "Aucun produit n'a encore été ajouté à ce live"
  - Loading state: `ActivityIndicator`

- Component (create) — `ios-app/src/components/live/LiveProductCard.tsx`
  - Props: `id`, `name`, `imageUrl`, `price`, `wishedPrice`, `interestedCount`, `isInterested`, `isSellerView`, `onToggleInterest` (optional, for ticket 003)
  - Layout: horizontal card (image left, name + price right, interest area far right)
  - Image: 64×64 rounded square, placeholder icon if no URL
  - Name: bold, 1 line truncated
  - Price: `wishedPrice` formatted as `X €`, muted color
  - Interest area: interest count + ✋ button stub (disabled, no handler yet — wired in ticket 003)
  - Colors and spacing from `Colors.*` and `Spacing.*` tokens — no hex

## Verification

```bash
cd ios-app && npx tsc --noEmit   # zero TypeScript errors
```

Manual checklist:
1. Open a live → page 1 looks identical to before
2. Swipe down → page 2 snaps in showing product cards
3. Swipe up → returns to video
4. Live with no products → placeholder text visible on page 2

## Manual operations to configure services

None.
