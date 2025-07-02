import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Evita il pre-rendering di questa route
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, companyName, successUrl, cancelUrl } = await request.json();
    const firstMonthPriceId = process.env.STRIPE_FIRST_MONTH_PRICE_ID;

    if (!firstMonthPriceId) {
      console.error('STRIPE_FIRST_MONTH_PRICE_ID not configured');
      return NextResponse.json({ error: 'Stripe price ID not configured' }, { status: 500 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 });
    }

    // Usa gli URL passati dal frontend, con fallback sicuro
    const finalSuccessUrl = successUrl || 
      (process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://retapcard.com' : 'http://localhost:3000')) + '/dashboard?success=true';
    
    const finalCancelUrl = cancelUrl || 
      (process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://retapcard.com' : 'http://localhost:3000')) + '/merchant-signup?error=payment_cancelled';

    console.log('Creating one-time payment checkout session with:', {
      firstMonthPriceId,
      email,
      finalSuccessUrl,
      finalCancelUrl
    });

    // Crea un pagamento una tantum di 1 euro
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: firstMonthPriceId, // 1 euro per il primo mese
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        firstName,
        lastName,
        companyName,
        type: 'merchant-signup',
        userId: email,
        paymentType: 'first-month-activation'
      },
    });

    console.log('Payment checkout session created:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 