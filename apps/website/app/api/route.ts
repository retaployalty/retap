import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getStripePriceId, getActivationFeePriceId, validateStripeConfig } from '@/lib/stripe-config'

// Verifica che la configurazione Stripe sia valida
if (!validateStripeConfig()) {
  throw new Error('Stripe configuration is incomplete. Please check your environment variables.')
}

export async function POST(req: NextRequest) {
  try {
    const { plan, billingDetails, isAnnual } = await req.json()

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
    const priceId = getStripePriceId(billingCycle);

    // Costruisco la lista degli items
    const line_items = [
      { price: priceId, quantity: 1 }
    ];

    // Aggiungi tassa di attivazione solo per abbonamenti mensili BASIC
    if (plan === 'BASIC' && !isAnnual) {
      const activationFeePriceId = getActivationFeePriceId();
      line_items.push({ price: activationFeePriceId, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`,
      automatic_tax: { enabled: true },
      customer_email: billingDetails.email,
      billing_address_collection: 'required',
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
      { error: 'Error creating payment session' },
      { status: 500 }
    )
  }
}
