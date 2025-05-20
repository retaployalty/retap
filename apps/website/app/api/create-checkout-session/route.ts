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
    const { price, productId, successUrl, cancelUrl } = body;

    if (!productId || !successUrl || !cancelUrl) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Mappa productId a priceId (da configurare secondo Stripe Dashboard)
    const priceMap: Record<string, string> = {
      'prod_SJxYELX99AEp5I': 'price_49', // Sostituisci con il vero priceId
      'prod_SJxZrZBJ9DXkb0': 'price_69', // Sostituisci con il vero priceId
      'prod_SJxZH6Ejfd8myY': 'price_99', // Sostituisci con il vero priceId
    };
    const priceId = priceMap[productId];
    if (!priceId) {
      return new NextResponse('Invalid productId', { status: 400 });
    }

    // Crea la sessione di checkout
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      billing_address_collection: 'required',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({ sessionId: stripeSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 