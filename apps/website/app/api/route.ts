import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getStripePriceId, getActivationFeePriceId, validateStripeConfig } from '@/lib/stripe-config'

// Evita il pre-rendering di questa route
export const dynamic = 'force-dynamic';

// Verifica che la configurazione Stripe sia valida solo in produzione
if (process.env.NODE_ENV === 'production' && !validateStripeConfig()) {
  throw new Error('Stripe configuration is incomplete. Please check your environment variables.')
}

export async function POST(req: NextRequest) {
  try {
    // Verifica che Stripe sia configurato
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured');
      
      // In modalità sviluppo, fornisci un fallback per il test
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: providing test fallback');
        return NextResponse.json({
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true&test_mode=true`
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Stripe is not configured. Please create a .env.local file with the following variables:\n' +
                 'STRIPE_SECRET_KEY=sk_test_your_key\n' +
                 'STRIPE_MONTHLY_PRICE_ID=price_your_monthly_id\n' +
                 'STRIPE_ANNUAL_PRICE_ID=price_your_annual_id\n' +
                 'STRIPE_ACTIVATION_FEE_PRICE_ID=price_your_activation_fee_id\n\n' +
                 'See ENV_SETUP.md for detailed instructions.'
        },
        { status: 500 }
      );
    }

    const { plan, billingDetails, isAnnual, successUrl, cancelUrl } = await req.json()

    // Validazione del piano
    const validPlans = ['BASIC', 'INTERMEDIATE', 'PRO'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Ottieni il price ID corretto
    const billingCycle = isAnnual ? 'yearly' : 'monthly';
    
    let priceId: string;
    try {
      priceId = getStripePriceId(billingCycle);
    } catch (error) {
      console.error('Error getting Stripe price ID:', error);
      return NextResponse.json(
        { 
          error: 'Stripe price configuration is incomplete. Please create a .env.local file with:\n' +
                 'STRIPE_MONTHLY_PRICE_ID=price_your_monthly_id\n' +
                 'STRIPE_ANNUAL_PRICE_ID=price_your_annual_id\n' +
                 'STRIPE_ACTIVATION_FEE_PRICE_ID=price_your_activation_fee_id\n\n' +
                 'See ENV_SETUP.md for detailed instructions.'
        },
        { status: 500 }
      );
    }

    // Costruisco la lista degli items
    const line_items = [
      { price: priceId, quantity: 1 }
    ];

    // Aggiungi tassa di attivazione solo per abbonamenti mensili BASIC
    if (plan === 'BASIC' && !isAnnual) {
      try {
        const activationFeePriceId = getActivationFeePriceId();
        line_items.push({ price: activationFeePriceId, quantity: 1 });
      } catch (error) {
        console.error('Error getting activation fee price ID:', error);
        return NextResponse.json(
          { error: 'Stripe activation fee configuration is incomplete. Please check environment variables.' },
          { status: 500 }
        );
      }
    }

    // Usa gli URL personalizzati se forniti, altrimenti usa quelli di default
    const finalSuccessUrl = successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/success`;
    const finalCancelUrl = cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`;

    // Crea o recupera il customer Stripe
    let customerId: string;
    const existingCustomer = await stripe.customers.list({
      email: billingDetails.email,
      limit: 1
    });

    if (existingCustomer.data.length > 0) {
      customerId = existingCustomer.data[0].id;
      // Aggiorna i metadata se necessario
      await stripe.customers.update(customerId, {
        metadata: {
          ...existingCustomer.data[0].metadata,
          supabase_id: billingDetails.supabase_id || existingCustomer.data[0].metadata?.supabase_id
        }
      });
    } else {
      const customer = await stripe.customers.create({
        email: billingDetails.email,
        metadata: {
          supabase_id: billingDetails.supabase_id
        }
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      automatic_tax: { enabled: true },
      customer: customerId,
      billing_address_collection: 'required',
      customer_update: { address: 'auto', shipping: 'auto' },
      allow_promotion_codes: true,
      metadata: {
        plan: plan,
        firstName: billingDetails.firstName,
        lastName: billingDetails.lastName,
        company: billingDetails.company,
        isAnnual: isAnnual.toString()
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { 
        error: 'Error creating payment session',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
