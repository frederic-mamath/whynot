# ticket-008 — Orders + Stripe Payment

## Acceptance Criteria

- As a buyer, on the Orders tab, I should see all my orders with their status (pending payment, paid, shipped)
- As a buyer, on the Orders tab, when I tap a pending order, I should be able to pay via the Stripe payment sheet
- As a buyer, after paying successfully, the order status in the list should update to "paid"

## Technical Strategy

- Frontend
  - `src/components/OrderCard.tsx`
    - Props: `order: { id, productName, finalPrice, paymentStatus, paymentDeadline, shippedAt }`
    - Shows: product name, price (€), status badge (color-coded: orange=pending, green=paid, blue=shipped)
    - If status is "pending": shows payment deadline + "Pay now" button
    - If status is "paid" and `shippedAt` is null: "Awaiting shipment"
    - If `shippedAt`: "Shipped on [date]"
  - `app/(tabs)/orders.tsx`
    - Status filter tabs: All | Pending | Paid | Shipped
    - `trpc.order.getMyOrders.useQuery({ status: selectedStatus })` with refetch on focus
    - `FlatList` of `OrderCard` components
    - Empty state: "No orders yet — join a live to start bidding!"
    - On "Pay now" tap:
      1. `trpc.order.createPaymentIntent.useMutation({ orderId })` → `{ clientSecret }`
      2. `initPaymentSheet({ paymentIntentClientSecret: clientSecret, merchantDisplayName: "Popup" })`
      3. `presentPaymentSheet()` → Stripe native payment UI
      4. On success: invalidate `order.getMyOrders` query to refresh list

## tRPC Procedures

- `order.getMyOrders(status?)` → `{ id, productName, finalPrice, paymentStatus, paymentDeadline, shippedAt }[]`
- `order.createPaymentIntent(orderId)` → `{ clientSecret: string }`

## Manual Operations

- Stripe already configured from ticket-007 — no new setup needed
