# Phase 10: Orders & Stripe Payments

## Objective

Integrate Stripe React Native SDK for payment processing, implement the payment flow (auction win → pay via PaymentSheet), and build order detail screens.

## User-Facing Changes

- Stripe PaymentSheet for checkout (card input, Apple Pay, Google Pay)
- Order detail screen (product, amount, status, delivery info)
- Payment flow triggered from auction win modal
- Order status updates in My Orders list

## Files to Update

### Frontend (mobile-app/)

- `src/providers/StripeProvider.tsx` — Stripe SDK provider wrapper
- `app/_layout.tsx` — Add StripeProvider to provider stack
- `app/order/[orderId].tsx` — Order detail screen
- `src/components/live/AuctionEndModal.tsx` — Update to trigger payment flow
- `app/(tabs)/orders.tsx` — Update with order status badges
- `app/(tabs)/shop/deliveries.tsx` — Update with mark-as-shipped action
- `package.json` — Add `@stripe/stripe-react-native`
- `app.json` — Stripe Config Plugin

## Steps

1. Install `@stripe/stripe-react-native` and configure Expo Config Plugin
2. Rebuild Dev Client with Stripe native module
3. Create StripeProvider wrapping the app
4. Implement payment flow: `order.createPaymentIntent` → `initPaymentSheet` → `presentPaymentSheet`
5. Build order detail screen
6. Update AuctionEndModal to trigger payment on "won" result
7. Update My Orders with status badges and pull-to-refresh
8. Implement mark-as-shipped for sellers in pending deliveries

## Acceptance Criteria

- [ ] Stripe PaymentSheet opens with correct amount
- [ ] Payment completes successfully
- [ ] Order status updates after payment
- [ ] Order detail screen shows correct information
- [ ] Seller can mark orders as shipped
- [ ] Failed payments show error message

## Status

📝 PLANNING
