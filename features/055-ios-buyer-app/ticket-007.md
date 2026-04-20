# ticket-007 — Auction Bidding ⭐

**This ticket closes the primary success metric: buyer watches a live → places a bid → receives confirmation.**

## Acceptance Criteria

- As a buyer in a live with an active auction, I should see the product name, current bid amount, highest bidder, and a countdown timer
- As a buyer placing my first bid, if I haven't saved my full name, I should be prompted to enter it first
- As a buyer placing my first bid, if I haven't saved a payment method, I should be prompted to add a card first
- As a buyer once requirements are met, when I tap "Place Bid", the bid should be submitted and the current bid should update
- As a buyer who wins the auction, I should see a "You won!" modal with a "Pay now" button that takes me to Orders
- As a buyer who loses the auction, I should see a "Sold to [username]" modal

## Technical Strategy

- Frontend
  - `package.json`: add `@stripe/stripe-react-native`
  - `app.config.ts`: add `@stripe/stripe-react-native` to `plugins` array
  - `src/providers/StripeProvider.tsx`: wrap app with `<StripeProvider publishableKey={STRIPE_KEY} />`
  - `app/_layout.tsx`: add `StripeProvider` wrapper
  - `src/components/live/AuctionWidget.tsx`
    - `trpc.auction.getActive.useQuery({ channelId }, { refetchInterval: 3000 })`
    - Shows: product name, current bid (formatted €), highest bidder username, `AuctionCountdown`
    - "Place Bid" button → opens `BidRequirementsSheet`
    - Hidden when no active auction
  - `src/components/live/AuctionCountdown.tsx`
    - Props: `endsAt: Date`
    - Local `setInterval` countdown (MM:SS), turns red under 30s
  - `src/components/live/BidRequirementsSheet.tsx` (bottom sheet modal)
    - On open: check `trpc.profile.me()` for `firstName` + `lastName`
    - On open: check `trpc.payment.getPaymentStatus()` for `hasPaymentMethod`
    - Checklist UI: ✓ Name saved / ✗ Add name → show `PersonalInfoForm`
    - Checklist UI: ✓ Card saved / ✗ Add card → show `PaymentSetupSheet`
    - Once both ✓: "Confirm Bid" button → `trpc.auction.placeBid.useMutation({ auctionId, amount })`
    - `amount` = `currentBid + minimumIncrement` (use current bid + 1 as safe default)
  - `src/components/live/PersonalInfoForm.tsx`
    - First name + last name inputs → `trpc.profile.update.useMutation({ firstName, lastName })`
    - On success: mark name requirement as satisfied
  - `src/components/live/PaymentSetupSheet.tsx`
    - `trpc.payment.createSetupIntent.useMutation()` → `{ clientSecret }`
    - `CardField` from `@stripe/stripe-react-native`
    - `confirmSetupIntent(clientSecret, { paymentMethodType: "Card" })` from Stripe SDK
    - On success: mark payment requirement as satisfied
  - `src/components/live/AuctionEndModal.tsx`
    - Props: `isWinner`, `productName`, `finalPrice`, `winnerUsername`
    - Winner: "You won [product] for €[price]! Pay before your deadline." + "Pay now" → `/(tabs)/orders`
    - Loser: "Sold to [username] for €[price]"
  - `app/live/[liveId].tsx`
    - `trpc.live.subscribeToEvents`: add handler for `auction:ended` → set `auctionEndInfo` state → show `AuctionEndModal`
    - Render `<AuctionWidget channelId={channelIdNum} />` in overlay layer

## tRPC Procedures

- `auction.getActive(channelId)` → `{ id, productName, currentBid, highestBidderUsername, endsAt, status }`
- `auction.placeBid(auctionId, amount)` → void (throws if bid too low or requirements missing)
- `profile.me()` → `{ firstName, lastName, ... }`
- `profile.update(firstName, lastName)` → void
- `payment.getPaymentStatus()` → `{ hasPaymentMethod: boolean, paymentMethods: [...] }`
- `payment.createSetupIntent()` → `{ clientSecret: string }`

## Manual Operations

- **Stripe publishable key**: copy `STRIPE_PUBLISHABLE_KEY` from `app/.env` → add to `ios-app/.env` as `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Read in `app.config.ts` and pass to `StripeProvider`
