import Stripe from 'stripe';

// Verifica che la chiave segreta sia presente
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Verifica che la chiave sia in modalità live per produzione
const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
if (process.env.NODE_ENV === 'production' && !isLiveMode) {
  console.warn('⚠️  Using test keys in production environment');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil', // Versione più recente dell'API
  typescript: true,
});

export const formatAmountForStripe = (amount: number, currency: string): number => {
  const numberFormat = new Intl.NumberFormat(['it-IT'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
}; 