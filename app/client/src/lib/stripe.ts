import { loadStripe } from '@stripe/stripe-js';
import { debugLog } from './debug';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

debugLog('🔑 Stripe publishable key:', publishableKey ? 'SET' : 'NOT SET');

if (!publishableKey) {
  console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY is not set');
}

export const stripePromise = publishableKey 
  ? loadStripe(publishableKey).catch(err => {
      console.error('❌ Failed to load Stripe.js:', err);
      return null;
    })
  : null;
