import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Evita il pre-rendering di questa route
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);
        
        // Se è una subscription, il webhook customer.subscription.created gestirà la creazione
        if (session.mode === 'subscription') {
          console.log('Subscription checkout completed, waiting for subscription creation');
        }
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        
        // Trova il merchant basandosi sull'email del customer
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const customerEmail = (customer as any).email;
        
        if (customerEmail) {
          // Trova il merchant tramite l'email
          const { data: merchant, error: merchantError } = await supabase
            .from('merchants')
            .select('id, profile_id')
            .eq('profile_id', (customer as any).metadata?.supabase_id)
            .single();

          if (merchantError) {
            console.error('Error finding merchant:', merchantError);
          } else if (merchant) {
            // Aggiorna il merchant con i dati della subscription
            const { error: updateError } = await supabase
              .from('merchants')
              .update({
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                subscription_status: subscription.status,
                subscription_start_date: new Date((subscription as any).current_period_start * 1000).toISOString(),
                subscription_end_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
                payment_status: 'active',
                last_payment_date: new Date().toISOString()
              })
              .eq('id', merchant.id);

            if (updateError) {
              console.error('Error updating merchant subscription:', updateError);
            } else {
              console.log('Merchant subscription updated successfully:', merchant.id);
            }
          }
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 