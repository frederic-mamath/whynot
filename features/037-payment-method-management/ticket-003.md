# Ticket 003 — Frontend: Edit/Delete UI in ProfilePage

## Acceptance Criteria

- As a buyer, in the profile page, when I have a saved payment method, I should see a trash icon button next to it.
- As a buyer, when I click the trash icon, the payment method is deleted and the list refreshes.
- As a buyer, when I click "Modifier", the PaymentSetupDialog opens so I can add a new payment method.

## Technical Strategy

- Frontend
  - Page
    - `app/client/src/pages/ProfilePage.tsx`
      - Add `trpc.payment.deletePaymentMethod.useMutation` hook with `onSuccess` → invalidate `getPaymentStatus` + `toast.success`.
      - In the payment methods map, add a `<Button variant="ghost" size="icon">` with `<Trash2>` that calls `deletePaymentMethod.mutate({ paymentMethodId: pm.id })`.

## Manual operations to configure services

- None required.

## Status: completed
