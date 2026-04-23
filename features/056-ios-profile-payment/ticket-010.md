# ticket-010 — Add Card from Profile

## Acceptance Criteria

- As a buyer on the Profile page, when no payment method is saved, I should see an "Ajouter une carte" button
- As a buyer, when I tap "Ajouter une carte", a sheet should open with a Stripe card input
- As a buyer, after successfully saving a card, the profile should show the card details (brand + last 4) without any app reload
- As a buyer, when a card is already saved, I should only see the card details and the delete button (no "Add" button)

## Technical Strategy

- Frontend
  - `app/(tabs)/profile.tsx`
    - Import and reuse `PaymentSetupSheet` from `src/components/live/PaymentSetupSheet.tsx` (already exists)
    - Add `showCardSetup` boolean state (default `false`)
    - In the payment section: when `paymentMethods.length === 0`, render an "Ajouter une carte" `Pressable` button
    - Tapping it sets `showCardSetup = true`
    - Render `<PaymentSetupSheet onSuccess={() => { setShowCardSetup(false) }} />` inside a `Modal` when `showCardSetup` is true
    - On `onSuccess`: `utils.payment.getPaymentStatus.invalidate()` to refresh the card display

## tRPC Procedures

- `payment.createSetupIntent()` → `{ clientSecret }` — already exists, used by `PaymentSetupSheet`
- `payment.getPaymentStatus()` → `{ hasPaymentMethod, paymentMethods }` — already exists

## Manual Operations

- None — Stripe is already configured from ticket-007
