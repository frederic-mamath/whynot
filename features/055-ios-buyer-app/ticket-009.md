# ticket-009 — Profile

## Acceptance Criteria

- As a buyer, on the Profile tab, I should see my nickname, email, and saved payment method (card brand + last 4 digits)
- As a buyer, I should be able to edit my first and last name
- As a buyer, I should be able to remove my saved payment method
- As a buyer, when I tap "Log out", I should be returned to the welcome screen and my token should be cleared

## Technical Strategy

- Frontend
  - `app/(tabs)/profile.tsx`
    - `trpc.profile.me.useQuery()` → `{ nickname, email, firstName, lastName, avatar }`
    - `trpc.payment.getPaymentStatus.useQuery()` → `{ paymentMethods: [{ id, brand, last4, expMonth, expYear }] }`
    - Sections:
      1. **Account**: avatar + nickname + email (read-only)
      2. **Personal info**: first name + last name editable inline → `trpc.profile.update.useMutation()` on save
      3. **Payment method**: card brand + last4 display, or "No card saved" → "Remove" button → `trpc.payment.deletePaymentMethod.useMutation({ paymentMethodId })`
      4. **Log out**: button → `AuthContext.logout()` → router replaces to `/(auth)/welcome`

## tRPC Procedures

- `profile.me()` → `{ nickname, email, firstName, lastName, avatar }`
- `profile.update(firstName, lastName)` → void
- `payment.getPaymentStatus()` → `{ hasPaymentMethod, paymentMethods: [{ id, brand, last4, expMonth, expYear }] }`
- `payment.deletePaymentMethod(paymentMethodId)` → void

## Manual Operations

- None
