// Script di test per verificare la logica dell'activation fee
require('dotenv').config({ path: '.env.local' });

console.log('=== Test Configurazione Stripe ===');

// Test 1: Verifica che tutte le variabili siano configurate
console.log('\n1. Verifica configurazione:');
const requiredPriceIds = [
  process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_ACTIVATION_FEE_PRICE_ID
];

const isValid = requiredPriceIds.every(priceId => priceId !== undefined);
console.log('Configurazione valida:', isValid);

if (!isValid) {
  console.log('Variabili mancanti:');
  if (!process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID) console.log('- NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID');
  if (!process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID) console.log('- NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID');
  if (!process.env.NEXT_PUBLIC_STRIPE_ACTIVATION_FEE_PRICE_ID) console.log('- NEXT_PUBLIC_STRIPE_ACTIVATION_FEE_PRICE_ID');
}

// Test 2: Verifica Price IDs
console.log('\n2. Price IDs:');
console.log('Monthly Price ID:', process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID);
console.log('Yearly Price ID:', process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID);
console.log('Activation Fee Price ID:', process.env.NEXT_PUBLIC_STRIPE_ACTIVATION_FEE_PRICE_ID);

// Test 3: Simula la logica di checkout
console.log('\n3. Simulazione logica checkout:');

function simulateCheckout(isAnnual) {
  const line_items = [
    {
      price: isAnnual ? process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
      quantity: 1,
    },
  ];

  if (!isAnnual) {
    line_items.push({ 
      price: process.env.NEXT_PUBLIC_STRIPE_ACTIVATION_FEE_PRICE_ID, 
      quantity: 1 
    });
    console.log(`✅ Abbonamento mensile: SI activation fee aggiunta`);
  } else {
    console.log(`✅ Abbonamento annuale: NO activation fee aggiunta`);
  }

  return line_items;
}

console.log('\nSimulazione abbonamento mensile:');
const monthlyItems = simulateCheckout(false);
console.log('Line items:', JSON.stringify(monthlyItems, null, 2));

console.log('\nSimulazione abbonamento annuale:');
const yearlyItems = simulateCheckout(true);
console.log('Line items:', JSON.stringify(yearlyItems, null, 2));

console.log('\n=== Test completato ==='); 