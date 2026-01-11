import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

export class StripeService {
  /**
   * Create a payment intent for an order
   */
  async createPaymentIntent(params: {
    amount: number; // in cents (e.g., 1000 = $10.00)
    currency?: string;
    orderId: string;
    buyerEmail?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    const { amount, currency = 'usd', orderId, buyerEmail, metadata = {} } = params;

    return stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId,
        ...metadata,
      },
      ...(buyerEmail && { receipt_email: buyerEmail }),
    });
  }

  /**
   * Retrieve a payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Cancel a payment intent (if still cancelable)
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.cancel(paymentIntentId);
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number; // Optional: partial refund amount in cents
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
  }): Promise<Stripe.Refund> {
    const { paymentIntentId, amount, reason, metadata = {} } = params;

    return stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount && { amount }),
      ...(reason && { reason }),
      metadata,
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Get Stripe instance for advanced use cases
   */
  getStripeInstance(): Stripe {
    return stripe;
  }
}

export const stripeService = new StripeService();
