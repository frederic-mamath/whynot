# Ticket 03 — Frontend: Bid Guard & Payment Required Dialog

## Acceptance Criteria

- As a buyer, in the channel page, when I click "Place Bid" without a payment method, I see a blocking dialog explaining I need to add one
- As a buyer, in the channel page, when I click "Buyout" without a payment method, I see the same blocking dialog
- As a buyer, the blocking dialog suggests Apple Pay (iOS/macOS) or Google Pay (other) based on OS detection
- As a buyer, in the blocking dialog, I can tap "Set up payment method" to open the setup form inline
- As a buyer, after completing payment setup in the blocking dialog, I can immediately proceed with bidding

## Technical Strategy

- Frontend
  - Component
    - `app/client/src/components/PaymentRequiredDialog/PaymentRequiredDialog.tsx` _(new file)_
      - Detects OS via `navigator.userAgent` to show "Apple Pay" or "Google Pay" in copy
      - Embeds `<PaymentSetupDialog blocking>` inline when user clicks "Set up payment method"
      - `onSuccess` callback refreshes payment status and closes the dialog
    - `app/client/src/components/PaymentRequiredDialog/index.ts` _(new file)_
      - Re-export `PaymentRequiredDialog`
    - `app/client/src/components/BidInput/BidInput.tsx`
      - Add `hasPaymentMethod?: boolean` prop (default `true` to avoid breaking existing usage)
      - Add `onPaymentRequired?: () => void` prop
      - On form submit: if `!hasPaymentMethod`, call `onPaymentRequired()` instead of submitting
    - `app/client/src/components/AuctionWidget/AuctionWidget.tsx`
      - Add `hasPaymentMethod?` and `onPaymentRequired?` props
      - Wire props to `<BidInput>`
      - Intercept buyout button: if `!hasPaymentMethod`, call `onPaymentRequired()` and return early
  - Page / Container
    - `app/client/src/components/ChatPanel/ChatPanel.tsx`
      - Call `trpc.payment.getPaymentStatus.useQuery()` to get `hasPaymentMethod`
      - Add `paymentDialogOpen` local state
      - Pass `hasPaymentMethod` and `onPaymentRequired={() => setPaymentDialogOpen(true)}` to `<AuctionWidget>`
      - Render `<PaymentRequiredDialog>` controlled by `paymentDialogOpen`

## Manual operations to configure services

_(none — all guards are purely client-side + existing backend guard from ticket-01)_
