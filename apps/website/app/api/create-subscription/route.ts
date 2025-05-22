// apps/website/app/api/create-subscription/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { paymentMethodId, billingCycle } = await request.json();

    // 1. Recupera il profilo utente da Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    let customerId = profile?.stripe_customer_id;

    // 2. Se non esiste, crea il customer su Stripe e salvalo su Supabase
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        metadata: { supabase_id: user.id }
      });
      customerId = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // 2b. Associa il payment method al customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

    // 2c. Imposta il payment method come default
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // 3. Crea la subscription SOLO con il prezzo mensile/annuale
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: billingCycle === 'monthly'
          ? 'price_1RRGYVEC4VcVVLOnNYVe4B0K'
          : 'price_1RRGZZEC4VcVVLOn6MWL9IGZ'
      }],
      default_payment_method: paymentMethodId,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice'],
    });

    // Controllo robusto per payment_intent
    const latestInvoice = subscription.latest_invoice as any;
    const paymentIntent = latestInvoice && latestInvoice.payment_intent;

    if (!paymentIntent) {
      return NextResponse.json({
        error: "Nessun payment_intent trovato nella latest_invoice. Controlla che il prezzo sia ricorrente e con pagamento automatico."
      }, { status: 500 });
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Errore API create-subscription:', error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}