// Configurazione Price ID di Stripe
export const STRIPE_PRICE_IDS = {
  // Abbonamento mensile
  MONTHLY: process.env.STRIPE_MONTHLY_PRICE_ID,
  
  // Abbonamento annuale
  ANNUAL: process.env.STRIPE_ANNUAL_PRICE_ID,
  
  // Tassa di attivazione (solo per abbonamenti mensili)
  ACTIVATION_FEE: process.env.STRIPE_ACTIVATION_FEE_PRICE_ID,
} as const;

// Funzione helper per ottenere il price ID corretto
export function getStripePriceId(billingCycle: 'monthly' | 'yearly'): string {
  const priceId = billingCycle === 'monthly' ? STRIPE_PRICE_IDS.MONTHLY : STRIPE_PRICE_IDS.ANNUAL;
  
  if (!priceId) {
    throw new Error(`STRIPE_${billingCycle.toUpperCase()}_PRICE_ID is not configured`);
  }
  
  console.log('DEBUG ENV STRIPE_MONTHLY_PRICE_ID:', process.env.STRIPE_MONTHLY_PRICE_ID);
  
  return priceId;
}

// Funzione per ottenere il price ID della tassa di attivazione
export function getActivationFeePriceId(): string {
  if (!STRIPE_PRICE_IDS.ACTIVATION_FEE) {
    throw new Error('STRIPE_ACTIVATION_FEE_PRICE_ID is not configured');
  }
  
  return STRIPE_PRICE_IDS.ACTIVATION_FEE;
}

// Funzione per verificare che tutti i Price IDs siano configurati
export function validateStripeConfig(): boolean {
  const requiredPriceIds = [
    STRIPE_PRICE_IDS.MONTHLY,
    STRIPE_PRICE_IDS.ANNUAL,
    STRIPE_PRICE_IDS.ACTIVATION_FEE
  ];
  
  return requiredPriceIds.every(priceId => priceId !== undefined);
} 