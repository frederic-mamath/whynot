# Ticket 013 — Stripe hooks (usePopupCheckout + usePopupSetupIntent)

## Goal

Stripe wiring is duplicated across `app/(tabs)/orders.tsx` (order checkout) and `src/components/live/PaymentSetupSheet.tsx` (card setup). Both reference the "Popup" merchant name as a literal. The Apple Pay merchant-ID gotcha called out in `ios-app/CLAUDE.md` lives here.

Wrap both flows in dedicated hooks. The merchant identifier becomes a single constant. Errors flow through `useMutationWithToast` (from T-005).

## Acceptance Criteria

- As a buyer, the order-pay flow and the card-setup flow surface errors identically (banner)
- As a buyer, Apple Pay button behavior is unchanged
- As a developer, the merchant name "Popup" appears exactly once in the codebase (`src/lib/stripe.ts`)
- As a developer, `usePopupCheckout()` and `usePopupSetupIntent()` are the only public Stripe entry points
- As a developer, jscpd reports no near-duplication between `orders.tsx` and `PaymentSetupSheet.tsx`

## Technical Strategy

- Frontend / Hooks
  - `ios-app/src/lib/stripe.ts`
    - Exports: `MERCHANT_NAME = "Popup"`, `MERCHANT_COUNTRY = "FR"`, `MERCHANT_CURRENCY = "EUR"`
    - `usePopupCheckout()` returns `{ pay: (orderId, amount) => Promise<{ success: boolean; error?: string }> }`
      - Wraps `createPaymentIntent` (via `useMutationWithToast`) + `initPaymentSheet` + `presentPaymentSheet` + tracking events (`checkout_started`, `purchase_completed`)
    - `usePopupSetupIntent()` returns `{ saveCard: () => Promise<...>; saveWithPlatformPay: () => Promise<...> }`
      - Wraps `createSetupIntent` (via `useMutationWithToast`) + `confirmSetupIntent` / `confirmPlatformPaySetupIntent`
      - Centralizes the `Platform.OS === "ios"` Apple Pay vs Google Pay branching
- Frontend / Migration
  - `ios-app/app/(tabs)/orders.tsx`
    - Replace `handlePayNow` body with `const { success } = await pay(orderId, order.finalPrice)` — strip all inline Stripe wiring
  - `ios-app/src/components/live/PaymentSetupSheet.tsx`
    - Replace `saveWithCard` and `saveWithPlatformPay` bodies with hook calls

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run arch:test && npm run lint && npm run duplication
```

Manual: pay a pending order via Apple Pay. Save a card via the live bid sheet. Both work. Force an error (offline) → banner appears in both flows.

## Manual operations to configure services

None.
