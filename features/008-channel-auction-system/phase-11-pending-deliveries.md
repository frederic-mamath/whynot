# Phase 11: Pending Deliveries Page (Seller)

**Status**: ✅ DONE  
**Completed**: January 10, 2026

---

## Objective

Create a "Pending Deliveries" page accessible from the NavBar dropdown menu where sellers can view orders awaiting shipment and mark them as shipped after buyers have completed payment.

---

## Requirements

From summary.md:
- Page accessible from NavBar's Avatar dropdown menu
- Lists products waiting to be shipped (payment completed)
- Shows buyer information, product details, and final price
- Includes "Mark as Shipped" button
- Updates order status to `shipped_at` timestamp

---

## Files to Update

### Backend
1. **`src/routes/orders.ts`** - Add `markAsShipped` mutation
2. **`src/db/schema.ts`** - Verify orders table has `shipped_at` column

### Frontend
3. **`client/src/components/NavBar.tsx`** - Add "Pending Deliveries" link to dropdown
4. **`client/src/pages/PendingDeliveriesPage/PendingDeliveriesPage.tsx`** - Create new page
5. **`client/src/pages/PendingDeliveriesPage/index.ts`** - Export barrel
6. **`client/src/App.tsx`** - Add route for `/pending-deliveries`

---

## Implementation Steps

### Step 1: Backend - Mark as Shipped Endpoint

**File**: `src/routes/orders.ts`

Add mutation to mark order as shipped:

```typescript
markAsShipped: protectedProcedure
  .input(z.object({ orderId: z.string().uuid() }))
  .mutation(async ({ input, ctx }) => {
    const { orderId } = input;
    const userId = ctx.user.id;

    // Get order and verify seller
    const order = await ctx.db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', orderId)
      .executeTakeFirst();

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    if (order.seller_id !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the seller can mark order as shipped',
      });
    }

    if (order.payment_status !== 'paid') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Order must be paid before shipping',
      });
    }

    if (order.shipped_at) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Order already shipped',
      });
    }

    // Mark as shipped
    const updated = await ctx.db
      .updateTable('orders')
      .set({ shipped_at: new Date() })
      .where('id', '=', orderId)
      .returningAll()
      .executeTakeFirst();

    return updated;
  }),
```

Add query to get pending deliveries:

```typescript
getPendingDeliveries: protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get paid orders that haven't been shipped yet
    const orders = await ctx.db
      .selectFrom('orders')
      .innerJoin('products', 'orders.product_id', 'products.id')
      .innerJoin('users as buyers', 'orders.buyer_id', 'buyers.id')
      .select([
        'orders.id',
        'orders.final_price',
        'orders.paid_at',
        'orders.created_at',
        'products.name as product_name',
        'products.images as product_images',
        'buyers.username as buyer_username',
      ])
      .where('orders.seller_id', '=', userId)
      .where('orders.payment_status', '=', 'paid')
      .where('orders.shipped_at', 'is', null)
      .orderBy('orders.paid_at', 'desc')
      .execute();

    return orders.map(order => ({
      ...order,
      product_images: order.product_images as string[],
    }));
  }),
```

### Step 2: Frontend - Add NavBar Link

**File**: `client/src/components/NavBar.tsx`

Add "Pending Deliveries" link to the dropdown menu (only for sellers):

```tsx
{user?.role === 'SELLER' && (
  <DropdownMenuItem asChild>
    <Link to="/pending-deliveries" className="cursor-pointer">
      <Package className="mr-2 h-4 w-4" />
      Pending Deliveries
    </Link>
  </DropdownMenuItem>
)}
```

Import Package icon from lucide-react.

### Step 3: Frontend - Create Pending Deliveries Page

**File**: `client/src/pages/PendingDeliveriesPage/PendingDeliveriesPage.tsx`

Create page component:

```tsx
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card/card';
import { Badge } from '@/components/ui/badge/badge';
import { Package, User, DollarSign, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export function PendingDeliveriesPage() {
  const { toast } = useToast();
  const utils = trpc.useContext();

  const { data: orders, isLoading } = trpc.orders.getPendingDeliveries.useQuery();

  const markAsShipped = trpc.orders.markAsShipped.useMutation({
    onSuccess: () => {
      toast({
        title: 'Order marked as shipped',
        description: 'The buyer will be notified.',
      });
      utils.orders.getPendingDeliveries.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Failed to mark as shipped',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pending Deliveries
            </CardTitle>
            <CardDescription>
              Orders waiting to be shipped
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No pending deliveries. All orders have been shipped!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pending Deliveries
          </CardTitle>
          <CardDescription>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} waiting to be shipped
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    {order.product_images?.[0] && (
                      <img
                        src={order.product_images[0]}
                        alt={order.product_name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}

                    {/* Order Details */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold">{order.product_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {order.buyer_username}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${order.final_price}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Paid {formatDistanceToNow(new Date(order.paid_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <Badge variant="secondary">Payment Received</Badge>
                    </div>

                    {/* Ship Button */}
                    <Button
                      onClick={() => markAsShipped.mutate({ orderId: order.id })}
                      disabled={markAsShipped.isLoading}
                    >
                      Mark as Shipped
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**File**: `client/src/pages/PendingDeliveriesPage/index.ts`

```tsx
export { PendingDeliveriesPage } from './PendingDeliveriesPage';
```

### Step 4: Add Route

**File**: `client/src/App.tsx`

Add route for pending deliveries page:

```tsx
import { PendingDeliveriesPage } from './pages/PendingDeliveriesPage';

// In routes:
<Route path="/pending-deliveries" element={<PendingDeliveriesPage />} />
```

---

## Acceptance Criteria

- [ ] Sellers can access "Pending Deliveries" from NavBar dropdown
- [ ] Page displays all paid orders that haven't been shipped
- [ ] Each order shows: product name, image, buyer username, final price, payment date
- [ ] "Mark as Shipped" button successfully updates order
- [ ] Page refreshes automatically after marking as shipped
- [ ] Toast notification confirms shipping action
- [ ] Empty state shows when no pending deliveries
- [ ] Only the seller who sold the product can mark it as shipped
- [ ] Cannot mark unpaid orders as shipped
- [ ] Cannot mark already-shipped orders again

---

## Status

🚧 **IN PROGRESS** - Implementing backend and frontend components
