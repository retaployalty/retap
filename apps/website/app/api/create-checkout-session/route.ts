import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verifica che l'utente sia autenticato
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { price, successUrl, cancelUrl } = body;

    if (!price || !successUrl || !cancelUrl) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Crea la sessione di checkout
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abbonamento ReTap',
              description: 'Abbonamento mensile a ReTap',
            },
            unit_amount: price * 100, // Stripe usa i centesimi
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ sessionId: stripeSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 