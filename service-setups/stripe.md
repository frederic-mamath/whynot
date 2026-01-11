# Stripe Payment Integration Setup

## Prerequisites

- Stripe account created at https://dashboard.stripe.com

## 1. Get Your Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Click **Developers** in the left sidebar
3. Click **API keys**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` for test mode)
   - **Secret key** (starts with `sk_test_` for test mode) - Click "Reveal test key"

## 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  # We'll get this in step 3
```

Also add them to `.env.example` (with placeholder values):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 3. Set Up Webhook Endpoint (for Production)

Webhooks allow Stripe to notify your server about payment events (success, failure, etc.).

### For Local Development (Using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Log in to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   
4. Copy the webhook signing secret (starts with `whsec_`) and add it to your `.env` file

### For Production (Heroku or VPS)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Click **Add endpoint**
6. Copy the **Signing secret** and add it to your production environment variables

## 4. Production Deployment (Heroku)

Set environment variables in Heroku:

```bash
heroku config:set STRIPE_SECRET_KEY=sk_live_your_live_secret_key
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 5. Switch to Live Mode (When Ready)

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode**
2. Complete your Stripe account activation (provide business details, bank account)
3. Get your **Live** API keys from Developers → API keys
4. Update production environment variables with live keys
5. Update webhook endpoint with live webhook secret

## Testing

### Test Card Numbers

Use these in test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Security Notes

- ⚠️ **Never commit your secret keys to Git**
- ⚠️ **Never expose secret keys in client-side code**
- ✅ Only use the publishable key on the frontend
- ✅ Always verify webhook signatures
- ✅ Use HTTPS in production

## Implementation Overview

The integration includes:

1. **Backend**:
   - `src/services/StripeService.ts` - Stripe SDK wrapper
   - `src/routers/order.ts` - Updated with payment intent creation
   - `src/index.ts` - Webhook endpoint for payment events

2. **Frontend**:
   - Stripe Checkout integration on order payment page
   - Environment variable for publishable key

## Support

- Stripe Documentation: https://stripe.com/docs
- Test your integration: https://stripe.com/docs/testing
- Webhook testing: https://stripe.com/docs/webhooks/test
