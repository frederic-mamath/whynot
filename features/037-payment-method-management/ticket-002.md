# Ticket 002 — Frontend: Card input in PaymentSetupDialog

## Acceptance Criteria

- As a buyer, in the profile page, when I open the payment setup dialog, I should see a card input form below Google/Apple Pay (always visible).
- As a buyer, when I fill in my card details (number, expiry, CVC) and click submit, my card should be saved and the dialog should close with a success state.

## Technical Strategy

- Frontend
  - Component
    - `app/client/src/components/PaymentSetupDialog/PaymentSetupDialog.tsx`
      - Add `PaymentElement`, `useElements` to `@stripe/react-stripe-js` imports.
      - Add new `CardSetupForm` component: uses `useStripe` + `useElements`, renders `<PaymentElement>`, on submit calls `stripe.confirmSetup({ elements, redirect: 'if_required' })`.
      - Update `<Elements>` wrapper to pass `options={{ clientSecret }}` so `PaymentElement` receives the SetupIntent context.
      - Render `CardSetupForm` below `WalletSetupForm` with an "ou" separator.

## Manual operations to configure services

- None required.

## Status: completed
