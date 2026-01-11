# Phase 12: Stripe Payment Integration (Standard)

**Status**: 📝 PLANNING  
**Estimated Time**: 4-5 hours

---

## Objective

Implement standard Stripe payment integration where buyers pay the platform directly, and sellers create payout requests to claim their 93% share. Platform retains 7% fee and processes seller payouts manually or automatically.

---

## User-Facing Changes

After this phase:
- **Buyers** can click "Pay Now" on orders to complete payment via Stripe
- **Buyers** see payment status (Pending/Paid/Failed) in My Orders
- **Sellers** can create payout requests for paid orders
- **Sellers** see payout status (Pending/Approved/Paid/Rejected) in Pending Deliveries
- **Platform** receives full payment amount (100%)
- **Platform** processes seller payouts (93%) via payout requests

---

## Architecture Overview

### Payment Flow
1. Buyer wins auction → Order created (payment_status = 'pending')
2. Buyer clicks "Pay Now" → Stripe Payment Intent created
3. Buyer completes payment → Platform receives 100% of final_price
4. Webhook confirms payment → Order marked as 'paid'
5. Seller ships product → Marks as shipped
6. Seller creates payout request → Payout request created (status = 'pending')
7. Platform reviews/approves → Status changes to 'approved'
8. Platform processes payout → Status changes to 'paid', seller receives 93%

### Money Flow
```
Buyer pays $100
  ↓
Platform receives $100
  ↓
Platform keeps $7 (7% fee)
  ↓
Seller requests payout
  ↓
Platform pays $93 to seller (93%)
```

---

## Files to Create/Update

### Backend - Database
- `migrations/017_create_payout_requests.ts` - NEW - Payout requests table

### Backend - Services
- `src/services/StripeService.ts` - NEW - Stripe SDK wrapper

### Backend - Routers
- `src/routers/order.ts` - UPDATE - Add createPaymentIntent
- `src/routers/payout.ts` - NEW - Payout request endpoints
- `src/routers/index.ts` - UPDATE - Export payout router

### Backend - Repositories
- `src/repositories/PayoutRequestRepository.ts` - NEW - Payout CRUD operations

### Backend - Server
- `src/index.ts` - UPDATE - Add Stripe webhook endpoint

### Frontend - Components
- `client/src/pages/MyOrdersPage.tsx` - UPDATE - Add Stripe Checkout
- `client/src/pages/PendingDeliveriesPage.tsx` - UPDATE - Add payout request button
- `client/src/lib/stripe.ts` - NEW - Stripe.js initialization

### Configuration
- `.env.example` - UPDATE - Already done ✅
- `service-setups/stripe.md` - UPDATE - Already done ✅
- `package.json` - UPDATE - Add Stripe dependencies

---

## Steps

### 1. Install Dependencies (5 minutes)

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

**Packages**:
- `stripe` - Backend Stripe SDK
- `@stripe/stripe-js` - Frontend Stripe.js loader
- `@stripe/react-stripe-js` - React components for Stripe

---

### 2. Database Migration - Payout Requests (30 minutes)

Create `migrations/017_create_payout_requests.ts`:

```typescript
// Create payout_status enum: 'pending', 'approved', 'paid', 'rejected'
// Create payout_requests table:
//   - id (uuid, PK)
//   - seller_id (FK to users)
//   - order_id (FK to orders, UNIQUE)
//   - amount (decimal) - The 93% seller payout
//   - status (payout_status, default: 'pending')
//   - payment_method (varchar) - e.g., "PayPal", "Bank Transfer"
//   - payment_details (text) - Email, IBAN, etc.
//   - processed_at (timestamptz)
//   - processed_by (FK to users) - Admin who approved
//   - rejection_reason (text)
//   - created_at, updated_at
```

**Constraints**:
- One payout request per order (UNIQUE on order_id)
- Amount must be positive
- Can only request payout for orders with payment_status = 'paid'

**Indexes**:
- `seller_id` - Find all requests by seller
- `status` - Find pending/approved requests

---

### 3. Stripe Service (45 minutes)

Create `src/services/StripeService.ts`:

```typescript
import Stripe from 'stripe';

export class StripeService {
  // Create payment intent
  async createPaymentIntent(params: {
    amount: number; // in cents
    orderId: string;
    buyerEmail?: string;
  }): Promise<Stripe.PaymentIntent>

  // Get payment intent by ID
  async getPaymentIntent(id: string): Promise<Stripe.PaymentIntent>

  // Cancel payment intent
  async cancelPaymentIntent(id: string): Promise<Stripe.PaymentIntent>

  // Create refund
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number; // optional partial refund
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }): Promise<Stripe.Refund>

  // Verify webhook signature
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event
}
```

**Key Points**:
- Platform receives 100% of payment
- No fee splitting (that's manual via payout requests)
- Store orderId in payment intent metadata
- Use automatic_payment_methods for flexibility

---

### 4. Payout Request Repository (30 minutes)

Create `src/repositories/PayoutRequestRepository.ts`:

```typescript
export class PayoutRequestRepository {
  // Create payout request
  async create(data: {
    seller_id: number;
    order_id: string;
    amount: string;
    payment_method: string;
    payment_details: string;
  }): Promise<PayoutRequest>

  // Find by seller
  async findBySellerId(sellerId: number): Promise<PayoutRequest[]>

  // Find by status
  async findByStatus(status: 'pending' | 'approved' | 'paid' | 'rejected'): Promise<PayoutRequest[]>

  // Find by order
  async findByOrderId(orderId: string): Promise<PayoutRequest | undefined>

  // Update status
  async updateStatus(
    id: string,
    status: 'approved' | 'paid' | 'rejected',
    processedBy: number,
    rejectionReason?: string
  ): Promise<PayoutRequest>

  // Find with order and seller details
  async findWithDetails(id: string): Promise<PayoutRequestWithDetails>
}
```

---

### 5. Update Order Router (45 minutes)

Update `src/routers/order.ts`:

Implement the `createPaymentIntent` mutation:

```typescript
createPaymentIntent: protectedProcedure
  .input(z.object({ orderId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    // 1. Verify order exists and belongs to buyer
    // 2. Check payment_status = 'pending'
    // 3. If stripe_payment_intent_id exists, return existing
    // 4. Create new payment intent with Stripe
    // 5. Save stripe_payment_intent_id to order
    // 6. Return clientSecret for frontend
  })
```

**Validation**:
- ✅ User is authenticated
- ✅ Order exists
- ✅ Order belongs to current user (buyer_id)
- ✅ Order payment_status = 'pending'
- ✅ Amount = final_price (not seller_payout)

---

### 6. Create Payout Router (1 hour)

Create `src/routers/payout.ts`:

```typescript
export const payoutRouter = router({
  // Seller: Create payout request
  createRequest: protectedProcedure
    .input(z.object({
      orderId: z.string().uuid(),
      paymentMethod: z.string().min(1),
      paymentDetails: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify order exists and user is seller
      // 2. Check order payment_status = 'paid'
      // 3. Check order shipped_at is not null
      // 4. Check no existing payout request
      // 5. Create payout request with amount = seller_payout
    })

  // Seller: Get my payout requests
  getMyRequests: protectedProcedure
    .query(async ({ ctx }) => {
      // Return all payout requests for current user
    })

  // Admin: Get all pending payout requests
  getPendingRequests: protectedProcedure
    .query(async ({ ctx }) => {
      // Require admin role
      // Return all payout requests with status = 'pending'
    })

  // Admin: Approve payout request
  approveRequest: protectedProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      // Update status to 'approved'
      // Set processed_by and processed_at
    })

  // Admin: Mark as paid
  markAsPaid: protectedProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      // Update status to 'paid'
    })

  // Admin: Reject payout request
  rejectRequest: protectedProcedure
    .input(z.object({
      requestId: z.string().uuid(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      // Update status to 'rejected'
      // Set rejection_reason
    })
})
```

---

### 7. Stripe Webhook Endpoint (45 minutes)

Update `src/index.ts` to add webhook handler:

```typescript
// IMPORTANT: Must be BEFORE express.json() middleware
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
      const event = stripeService.verifyWebhookSignature(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          // Update order payment_status to 'paid'
          // Set paid_at timestamp
          break;

        case 'payment_intent.payment_failed':
          // Update order payment_status to 'failed'
          break;

        case 'charge.refunded':
          // Update order payment_status to 'refunded'
          break;
      }

      res.json({ received: true });
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);
```

**Important**: Webhook endpoint must use `express.raw()` middleware, not `express.json()`.

---

### 8. Frontend - Stripe.js Setup (15 minutes)

Create `client/src/lib/stripe.ts`:

```typescript
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);
```

---

### 9. Frontend - My Orders Payment (1 hour)

Update `client/src/pages/MyOrdersPage.tsx`:

Add Stripe Elements integration:

```tsx
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';

function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders?payment_success=true`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
}

// In MyOrdersPage:
// When user clicks "Pay Now", call createPaymentIntent
// Show Stripe Elements with client secret
```

---

### 10. Frontend - Payout Request (1 hour)

Update `client/src/pages/PendingDeliveriesPage.tsx`:

Add payout request form:

```tsx
function PayoutRequestForm({ orderId, amount }: { orderId: string; amount: number }) {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const createPayout = trpc.payout.createRequest.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPayout.mutateAsync({
      orderId,
      paymentMethod,
      paymentDetails,
    });
    toast.success('Payout request submitted');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Label>Payment Method</Label>
      <Input 
        value={paymentMethod} 
        onChange={(e) => setPaymentMethod(e.target.value)}
        placeholder="PayPal, Bank Transfer, etc."
      />
      
      <Label>Payment Details</Label>
      <Textarea 
        value={paymentDetails}
        onChange={(e) => setPaymentDetails(e.target.value)}
        placeholder="Email, IBAN, account number, etc."
      />
      
      <p>Amount: ${amount}</p>
      <Button type="submit">Request Payout</Button>
    </form>
  );
}
```

---

## Business Rules

### Payment Requirements
- ✅ Only order buyer can create payment intent
- ✅ Order must be in 'pending' status
- ✅ Payment amount = final_price (100%)
- ✅ One payment intent per order (reuse if exists)

### Payout Request Requirements
- ✅ Only order seller can create payout request
- ✅ Order must have payment_status = 'paid'
- ✅ Order must have shipped_at set (product shipped)
- ✅ One payout request per order (UNIQUE constraint)
- ✅ Payout amount = seller_payout (93% of final_price)

### Admin Payout Processing
- ✅ Only admins can approve/reject/mark as paid
- ✅ Once approved, admin processes payment manually (bank transfer, PayPal, etc.)
- ✅ After payment sent, admin marks as 'paid'
- ✅ Rejection requires reason

---

## Validation Rules

### createPaymentIntent
```typescript
- User authenticated ✅
- Order exists ✅
- Order.buyer_id === currentUser.id ✅
- Order.payment_status === 'pending' ✅
- Order.payment_deadline > now (optional warning) ⚠️
```

### createPayoutRequest
```typescript
- User authenticated ✅
- Order exists ✅
- Order.seller_id === currentUser.id ✅
- Order.payment_status === 'paid' ✅
- Order.shipped_at IS NOT NULL ✅
- No existing payout request for order ✅
- paymentMethod not empty ✅
- paymentDetails not empty ✅
```

---

## Acceptance Criteria

### Database
- [ ] Migration 017 created and run successfully
- [ ] payout_requests table exists
- [ ] payout_status enum exists
- [ ] Indexes created

### Backend
- [ ] Stripe service created
- [ ] Payout repository created
- [ ] Order router updated with createPaymentIntent
- [ ] Payout router created with all endpoints
- [ ] Webhook endpoint handles payment events
- [ ] All endpoints have proper authorization

### Frontend
- [ ] Stripe.js loaded on My Orders page
- [ ] Payment form appears when clicking "Pay Now"
- [ ] Payment success redirects and updates UI
- [ ] Payout request form appears on Pending Deliveries
- [ ] Payout request submission shows success

### End-to-End
- [ ] Buyer can complete payment with test card
- [ ] Order marked as 'paid' after webhook
- [ ] Seller can request payout after shipping
- [ ] Payout request appears in admin panel (future)
- [ ] Payment amount correct (100% to platform)
- [ ] Payout amount correct (93% to seller)

---

## Testing Checklist

### Manual Testing - Payment Flow
- [ ] Win auction as buyer
- [ ] Click "Pay Now" on order
- [ ] Stripe checkout appears
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Payment succeeds
- [ ] Order status changes to 'paid'
- [ ] paid_at timestamp set

### Manual Testing - Payout Flow
- [ ] Mark order as shipped (seller)
- [ ] Click "Request Payout"
- [ ] Enter payment method and details
- [ ] Submit request
- [ ] Payout request created with status 'pending'
- [ ] Amount equals seller_payout (93%)

### Edge Cases
- [ ] Duplicate payment intent creation → Returns existing
- [ ] Payment after deadline → Still processes
- [ ] Payout request before shipping → Rejected
- [ ] Duplicate payout request → Rejected (UNIQUE constraint)
- [ ] Invalid webhook signature → Rejected
- [ ] Payment failure with test card `4000 0000 0000 0002`

### Test Cards (Stripe Test Mode)
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`
- 🔐 Requires Auth: `4000 0025 0000 3155`

---

## Dependencies

### NPM Packages
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### Environment Variables
```bash
# Backend
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Security Considerations

### Backend
- ✅ Webhook signature verification (prevent fake events)
- ✅ Authorization checks on all endpoints
- ✅ Payment intent metadata includes orderId (audit trail)
- ✅ One payment intent per order (prevent duplicates)
- ✅ Amount validation (prevent price manipulation)

### Frontend
- ✅ Only publishable key exposed (safe for client)
- ✅ Secret key never sent to client
- ✅ HTTPS required in production (Stripe requirement)

---

## Future Enhancements (Not in Phase 12)

### Automated Payouts
- Automatically approve payout requests (trusted sellers)
- Integrate Stripe Payouts API (send money programmatically)
- Schedule batch payouts (weekly, monthly)

### Admin Dashboard
- View all payout requests
- Filter by status, seller, date range
- Bulk approve/reject
- Export to CSV for accounting

### Notifications
- Email seller when payout approved
- Email seller when payout paid
- Email seller if payout rejected

---

## Status

✅ **DONE** - Implementation complete

---

## Notes

### Why Standard Stripe (Not Connect)?
- ✅ Simpler implementation (no seller onboarding)
- ✅ Platform has full control over payouts
- ✅ Can manually review each payout
- ✅ Easier to handle disputes/refunds
- ✅ Lower Stripe fees (no Connect overhead)
- ⚠️ Manual payout processing required
- ⚠️ Platform holds seller funds

### Payout Processing Options
1. **Manual** - Admin manually sends via bank/PayPal
2. **Semi-automated** - Admin clicks "Pay" → integrates with Stripe Payouts
3. **Fully automated** - Auto-approve trusted sellers, batch payouts

**Phase 12 uses Option 1 (Manual)** - Simplest, gives you control

### Platform Fee Collection
Platform receives **100% of payment** ($100):
- Platform keeps **$7** (7% fee)
- Platform pays seller **$93** (93% payout)
- Net margin: **$7 per transaction**

### Stripe Pricing
- **2.9% + $0.30 per successful card charge**
- Example: $100 sale → Stripe fee = $3.20
- Platform net: $7 - $3.20 = **$3.80 profit**

---

**Next Steps**:
1. ✅ Review this phase document
2. User sets up Stripe account (see `service-setups/stripe.md`)
3. User provides Stripe API keys
4. Install Stripe npm packages
5. Run migration 017
6. Implement backend (StripeService, PayoutRepository, routers)
7. Implement frontend (Stripe.js, payment form, payout form)
8. Test end-to-end with test cards
