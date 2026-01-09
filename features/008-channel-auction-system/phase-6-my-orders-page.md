# Phase 6: My Orders Page

**Status**: ⏳ IN PROGRESS  
**Estimated Time**: 2-3 hours

---

## Objective

Create a "My Orders" page for buyers to view won auctions, pay for items, and track order status.

---

## User-Facing Changes

After this phase:
- Buyers can access "My Orders" from navbar dropdown
- See list of won auctions with payment status
- View order details (product, price, deadline)
- Pay for pending orders (Stripe integration in Phase 8)
- See order history (paid, shipped, etc.)
- Visual indicators for payment deadlines

---

## Files to Create

### New Components
- `client/src/pages/MyOrdersPage.tsx` - Main orders page
- `client/src/components/OrderCard/OrderCard.tsx` - Individual order display
- `client/src/components/OrderCard/index.ts` - Export

### Files to Update
- `client/src/components/NavBar/NavBar.tsx` - Add "My Orders" link in dropdown
- `client/src/App.tsx` - Add route for /my-orders
- Backend tRPC router already has stubs (from Phase 3)

---

## Steps

### 1. Create OrderCard Component (45 min)

**Purpose**: Display individual order with product info, payment status, and actions

**Features**:
- Product image, name, description
- Final price breakdown (item + platform fee)
- Seller information
- Payment deadline countdown
- Payment status badge
- "Pay Now" button (pending orders)
- Order date/time

**Props**:
```typescript
interface OrderCardProps {
  order: {
    id: string;
    productName: string;
    productImageUrl: string | null;
    sellerUsername: string;
    finalPrice: number;
    platformFee: number;
    sellerPayout: number;
    paymentStatus: 'pending' | 'paid' | 'shipped' | 'cancelled';
    paymentDeadline: string;
    createdAt: string;
  };
  onPayNow: (orderId: string) => void;
}
```

**Layout**:
```tsx
<Card>
  <CardContent>
    {/* Product Info */}
    <div className="flex gap-4">
      <img className="w-20 h-20" />
      <div>
        <h3>{productName}</h3>
        <p>Seller: {sellerUsername}</p>
      </div>
    </div>

    {/* Price Breakdown */}
    <div className="mt-4">
      <div>Item Price: ${finalPrice - platformFee}</div>
      <div>Platform Fee (7%): ${platformFee}</div>
      <div className="font-bold">Total: ${finalPrice}</div>
    </div>

    {/* Payment Status */}
    <Badge variant={status}>{paymentStatus}</Badge>

    {/* Payment Deadline (if pending) */}
    {isPending && (
      <div>
        <Clock /> Pay within: {timeRemaining}
      </div>
    )}

    {/* Actions */}
    {isPending && (
      <Button onClick={onPayNow}>Pay Now</Button>
    )}
  </CardContent>
</Card>
```

**Status Badge Colors**:
- `pending` - Yellow/warning
- `paid` - Green/success
- `shipped` - Blue/info
- `cancelled` - Red/destructive

---

### 2. Create MyOrdersPage (1 hour)

**Purpose**: Main page listing all user's orders with filters and sorting

**Features**:
- List all orders from `trpc.order.getMyOrders`
- Filter by status (All, Pending, Paid, Shipped)
- Sort by date (newest first)
- Empty state when no orders
- Loading skeleton
- Pagination (if many orders)

**Layout**:
```tsx
export default function MyOrdersPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  
  const { data: orders, isLoading } = trpc.order.getMyOrders.useQuery({
    status: filter === 'all' ? undefined : filter,
  });

  return (
    <Container>
      <h1>My Orders</h1>
      
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Orders
        </Button>
        <Button 
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending Payment
        </Button>
        <Button 
          variant={filter === 'paid' ? 'default' : 'outline'}
          onClick={() => setFilter('paid')}
        >
          Paid
        </Button>
      </div>

      {/* Orders List */}
      <div className="space-y-4 mt-6">
        {isLoading ? (
          <OrderCardSkeleton />
        ) : orders?.length === 0 ? (
          <EmptyState />
        ) : (
          orders?.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onPayNow={handlePayNow}
            />
          ))
        )}
      </div>
    </Container>
  );
}
```

**Empty State**:
```tsx
<div className="text-center py-12">
  <ShoppingBag className="size-16 mx-auto text-muted-foreground" />
  <h2 className="mt-4 text-xl font-semibold">No orders yet</h2>
  <p className="text-muted-foreground">
    Win an auction to see your orders here
  </p>
  <Button asChild className="mt-4">
    <Link to="/channels">Browse Channels</Link>
  </Button>
</div>
```

---

### 3. Update NavBar with My Orders Link (20 min)

Add "My Orders" link to user dropdown menu in navbar.

**Find dropdown menu** and add:
```tsx
<DropdownMenuItem asChild>
  <Link to="/my-orders" className="flex items-center gap-2">
    <ShoppingBag className="size-4" />
    My Orders
  </Link>
</DropdownMenuItem>
```

**Order of items**:
1. Dashboard
2. **My Orders** ← New
3. Pending Deliveries (sellers only)
4. Settings
5. Logout

---

### 4. Add Route to App.tsx (10 min)

Add route for My Orders page:

```tsx
import MyOrdersPage from './pages/MyOrdersPage';

// In routes
<Route 
  path="/my-orders" 
  element={
    <ProtectedRoute>
      <MyOrdersPage />
    </ProtectedRoute>
  } 
/>
```

---

### 5. Implement Backend Order Queries (30 min)

Update the order router stubs from Phase 3.

**File**: `src/routers/order.ts`

**Implement `getMyOrders`**:
```typescript
getMyOrders: protectedProcedure
  .input(
    z.object({
      status: z.enum(['pending', 'paid', 'shipped', 'cancelled']).optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const orders = await orderRepository.findByBuyerId(
      ctx.user!.id,
      input.status
    );

    return orders.map(mapOrderToOutboundDto);
  }),
```

**Add to OrderRepository**:
```typescript
async findByBuyerId(
  buyerId: number,
  status?: 'pending' | 'paid' | 'shipped' | 'cancelled'
): Promise<Order[]> {
  let query = db
    .selectFrom('orders')
    .selectAll()
    .where('buyer_id', '=', buyerId)
    .orderBy('created_at', 'desc');

  if (status) {
    query = query.where('payment_status', '=', status);
  }

  return query.execute();
}
```

---

### 6. Payment Deadline Countdown (20 min)

Create a countdown component for payment deadlines.

**Component**: `PaymentDeadlineCountdown.tsx`

```typescript
export function PaymentDeadlineCountdown({ deadline }: { deadline: string }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(deadline);
      const remaining = Math.max(0, end.getTime() - now.getTime());
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const formatTime = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getUrgencyColor = (): string => {
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);
    if (hoursRemaining < 24) return "text-destructive";
    if (hoursRemaining < 72) return "text-amber-500";
    return "text-foreground";
  };

  if (timeRemaining === 0) {
    return <span className="text-destructive">Expired</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn("size-4", getUrgencyColor())} />
      <span className={cn("text-sm", getUrgencyColor())}>
        Pay within: {formatTime(timeRemaining)}
      </span>
    </div>
  );
}
```

---

### 7. Order Details Enhancement (15 min)

Add expandable order details section.

**Features**:
- Collapsible details
- Auction info (when won, final bid)
- Transaction history
- Seller contact (future)

**Use Shadcn Collapsible**:
```tsx
<Collapsible>
  <CollapsibleTrigger>
    View Details
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Order timeline */}
    <div>
      <p>Won on: {wonDate}</p>
      <p>Auction ID: {auctionId}</p>
      <p>Winning Bid: ${finalPrice}</p>
    </div>
  </CollapsibleContent>
</Collapsible>
```

---

### 8. Mobile Responsive Design (10 min)

Ensure mobile-friendly layout:
- Stack product image and info vertically on mobile
- Full-width "Pay Now" button
- Compact price breakdown
- Touch-friendly filter tabs

```tsx
<div className="flex flex-col md:flex-row gap-4">
  <img className="w-full md:w-20 h-48 md:h-20 object-cover" />
  <div className="flex-1">...</div>
</div>
```

---

## Design Considerations

### Payment Status States

**Pending**:
- Yellow badge
- "Pay Now" button enabled
- Deadline countdown visible
- Urgent if <24h remaining

**Paid**:
- Green badge
- Button changes to "Awaiting Shipment"
- No countdown
- Show payment date

**Shipped**:
- Blue badge
- Show tracking info (future)
- Estimated delivery (future)

**Cancelled**:
- Red badge
- Show cancellation reason
- No actions available

### Payment Flow (Placeholder for Phase 8)

For now, "Pay Now" button will:
```typescript
const handlePayNow = (orderId: string) => {
  toast.info("Payment integration coming in Phase 8");
  // Future: Open Stripe checkout
};
```

### Order Expiration

Orders with expired deadlines:
- Show "Expired" badge
- Disable "Pay Now" button
- Show message: "This order has expired"
- Future: Auto-cancel expired orders via cron job

---

## Acceptance Criteria

- [ ] OrderCard displays all order information
- [ ] Payment status badge shows correct color/text
- [ ] Payment deadline countdown updates every second
- [ ] "Pay Now" button appears for pending orders
- [ ] MyOrdersPage shows all user's orders
- [ ] Filter tabs work (All, Pending, Paid)
- [ ] Empty state displays when no orders
- [ ] Loading skeleton shows while fetching
- [ ] NavBar has "My Orders" link in dropdown
- [ ] Route /my-orders is accessible
- [ ] Backend returns correct orders for user
- [ ] Mobile responsive layout works
- [ ] Expired orders show appropriately
- [ ] Order details are expandable

---

## Testing Checklist

### Component Tests
- [ ] OrderCard renders correctly
- [ ] PaymentDeadlineCountdown calculates time
- [ ] Status badges show correct colors
- [ ] Filters work on MyOrdersPage

### Integration Tests
- [ ] Create test order in database
- [ ] Verify order appears in My Orders
- [ ] Test filter functionality
- [ ] Test deadline expiration

### Manual QA
- [ ] Win auction and check order creation
- [ ] Navigate to My Orders from navbar
- [ ] Filter by different statuses
- [ ] Verify countdown accuracy
- [ ] Test on mobile device
- [ ] Check with multiple orders
- [ ] Test with no orders (empty state)

---

## Status

✅ **DONE** - My Orders page complete

---

## Notes

### Implementation Completed

1. ✅ **PaymentDeadlineCountdown Component**
   - Real-time countdown (updates every second)
   - Color-coded urgency (green → amber → red)
   - Formats time as "Xd Xh" or "Xh Xm"
   - Shows "Expired" when deadline passed

2. ✅ **OrderCard Component**
   - Product image/name display
   - Seller information
   - Price breakdown (item + 7% platform fee)
   - Status badges (color-coded)
   - Payment deadline countdown (pending orders)
   - "Pay Now" button (placeholder for Phase 8)
   - Expired order messaging
   - Mobile responsive layout

3. ✅ **MyOrdersPage**
   - Filter tabs (All, Pending, Paid, Shipped, Failed, Refunded)
   - Order list with loading skeletons
   - Empty state with call-to-action
   - Client-side filtering for shipped orders
   - Responsive grid layout

4. ✅ **NavBar Update**
   - Added "My Orders" link with ShoppingBag icon
   - Positioned after Dashboard, before Channels
   - Consistent with existing navigation style

5. ✅ **App.tsx Route**
   - Protected route at `/my-orders`
   - Requires authentication

6. ✅ **Backend Implementation**
   - Updated `OrderRepository.findByBuyerId` with status filter
   - Joins products and users tables for complete data
   - Returns seller email, product details, payment info
   - Implemented `orderRouter.getMyOrders` query
   - Maps database status to display status
   - Handles "shipped" as derived status (paid + shipped_at)

### Status Mapping

**Database Schema**: `pending | paid | failed | refunded`  
**Display Status**: `pending | paid | shipped | failed | refunded`

**Shipped Status Logic**:
```typescript
if (payment_status === 'paid' && shipped_at !== null) {
  displayStatus = 'shipped';
}
```

### Badge Colors

- **Pending** - Secondary (yellow/gray)
- **Paid** - Green (success)
- **Shipped** - Blue (info)
- **Failed** - Red (destructive)
- **Refunded** - Secondary
- **Expired** - Red (destructive)

### Urgency Colors (Deadline)

- **< 24 hours** - Red (destructive)
- **< 72 hours** - Amber (warning)
- **> 72 hours** - Default

### Data Flow

**Order Creation** (from Phase 3):
1. Auction ends → winner determined
2. Backend creates order with 7-day deadline
3. `payment_status = 'pending'`
4. Buyer gets WebSocket notification

**Viewing Orders**:
1. User clicks "My Orders" in navbar
2. Frontend: `trpc.order.getMyOrders.useQuery({ status })`
3. Backend: `OrderRepository.findByBuyerId(userId, status)`
4. Returns joined data (order + product + seller)
5. Frontend renders OrderCard for each

**Filtering**:
- All - No filter
- Pending - `payment_status = 'pending'`
- Paid - `payment_status = 'paid'`
- Shipped - Client-side filter (paymentStatus === 'shipped')
- Failed - `payment_status = 'failed'`
- Refunded - `payment_status = 'refunded'`

### Payment Placeholder

"Pay Now" button currently shows:
```typescript
toast.info("Payment integration coming in Phase 8");
```

Will be replaced with Stripe checkout in Phase 8.

### Testing Performed

✅ Server TypeScript compilation successful  
✅ Client TypeScript compilation successful  
✅ All components properly typed  
✅ Database queries use correct enum values  
✅ Status mapping logic handles shipped status

### Next Manual Testing

- Create order manually in database
- Verify order appears in My Orders
- Test all filter tabs
- Verify deadline countdown
- Check expired order display
- Test mobile responsive layout
- Verify empty states
- Check "Pay Now" placeholder

---

**Next Steps**:
1. ✅ Phase 6 complete
2. Manual testing with database
3. Begin Phase 7: Pending Deliveries Page (Seller)
