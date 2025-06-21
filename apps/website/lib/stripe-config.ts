// Configurazione Price ID di Stripe
export const STRIPE_PRICE_IDS = {
  // Abbonamento mensile
  MONTHLY: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1RRGYVEC4VcVVLOnNYVe4B0K',
  
  // Abbonamento annuale
  ANNUAL: process.env.STRIPE_ANNUAL_PRICE_ID || 'price_1RRGZZEC4VcVVLOn6MWL9IGZ',
  
  // Tassa di attivazione (solo per abbonamenti mensili)
  ACTIVATION_FEE: process.env.STRIPE_ACTIVATION_FEE_PRICE_ID || 'price_1RRGYVEC4VcVVLOnNYVe4B0K',
} as const;

// Funzione helper per ottenere il price ID corretto
export function getStripePriceId(billingCycle: 'monthly' | 'yearly'): string {
  return billingCycle === 'monthly' ? STRIPE_PRICE_IDS.MONTHLY : STRIPE_PRICE_IDS.ANNUAL;
}

// Funzione per ottenere il price ID della tassa di attivazione
export function getActivationFeePriceId(): string {
  return STRIPE_PRICE_IDS.ACTIVATION_FEE;
} 