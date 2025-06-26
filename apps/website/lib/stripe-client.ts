import { loadStripe } from '@stripe/stripe-js';

// Verifica che la chiave pubblica sia presente
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}

// Verifica che la chiave sia in modalità live per produzione
const isLiveMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_');
if (process.env.NODE_ENV === 'production' && !isLiveMode) {
  console.warn('⚠️  Using test keys in production environment');
}

// Carica Stripe per il client-side
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Funzione helper per ottenere l'istanza di Stripe
export async function getStripeClient() {
  const stripe = await stripePromise;
  if (!stripe) {
    throw new Error('Failed to load Stripe');
  }
  return stripe;
} 