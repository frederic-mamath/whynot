import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set');
}

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
