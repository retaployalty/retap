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
        
        // Gestisci solo i pagamenti di merchant signup
        if (session.metadata?.type === 'merchant-signup') {
          console.log('Processing merchant signup payment:', session.id);
          
          const { firstName, lastName, companyName, userId } = session.metadata;
          
          // Aggiorna lo stato del merchant
          const { error: updateError } = await supabase
            .from('merchants')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: null, // Non è una subscription
              subscription_status: 'active',
              subscription_start_date: new Date().toISOString(),
              subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 giorni
              payment_status: 'paid',
              last_payment_date: new Date().toISOString(),
              activation_fee_paid: true
            })
            .eq('profile_id', userId);

          if (updateError) {
            console.error('Error updating merchant:', updateError);
            return NextResponse.json({ error: 'Failed to update merchant' }, { status: 500 });
          }

          console.log('Merchant activated successfully:', userId);
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