import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Verifica che la chiave API sia presente
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY non è configurata nelle variabili d\'ambiente')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
})

// Price IDs per gli abbonamenti
const STRIPE_SUBSCRIPTIONS = {
  PRO: 'price_1RPJeJEC4VcVVLOnDOdFbrxK',
  INTERMEDIATE: 'price_1RPJe6EC4VcVVLOndEYQSEQu',
  BASIC: 'price_1RPJdaEC4VcVVLOnFYvpxWQY'
} as const

export async function POST(req: NextRequest) {
  try {
    const { plan, billingDetails, isAnnual } = await req.json()

    // Validazione del piano
    if (!Object.keys(STRIPE_SUBSCRIPTIONS).includes(plan)) {
      return NextResponse.json(
        { error: 'Piano non valido' },
        { status: 400 }
      )
    }

    const priceId = STRIPE_SUBSCRIPTIONS[plan as keyof typeof STRIPE_SUBSCRIPTIONS]

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?canceled=true`,
      automatic_tax: { enabled: true },
      customer_email: billingDetails.email,
      billing_address_collection: 'required',
      metadata: {
        firstName: billingDetails.firstName,
        lastName: billingDetails.lastName,
        company: billingDetails.company,
        isAnnual: isAnnual.toString()
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Errore Stripe:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione della sessione di pagamento' },
      { status: 500 }
    )
  }
}
