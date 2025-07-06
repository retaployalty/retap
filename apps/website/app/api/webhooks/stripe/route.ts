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

// Gestisci richieste OPTIONS (preflight)
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 200 });
}

// Gestisci richieste GET (per test)
export async function GET(request: Request) {
  return NextResponse.json({ 
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
}

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
        console.log('=== CHECKOUT SESSION COMPLETED WEBHOOK ===');
        console.log('Session ID:', session.id);
        console.log('Mode:', session.mode);
        console.log('Customer ID:', session.customer);
        console.log('Metadata:', session.metadata);
        
        // Se è una subscription, il webhook customer.subscription.created gestirà la creazione
        if (session.mode === 'subscription') {
          console.log('✅ Subscription checkout completed, waiting for subscription creation');
        } else {
          console.log('⚠️ Non-subscription checkout completed');
        }
        console.log('=== END CHECKOUT SESSION COMPLETED WEBHOOK ===');
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('=== SUBSCRIPTION CREATED WEBHOOK ===');
        console.log('Subscription ID:', subscription.id);
        console.log('Customer ID:', subscription.customer);
        console.log('Status:', subscription.status);
        
        // Trova il merchant basandosi sull'email del customer
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        console.log('Customer data:', {
          id: customer.id,
          email: (customer as any).email,
          metadata: (customer as any).metadata
        });
        
        const customerEmail = (customer as any).email;
        const supabaseId = (customer as any).metadata?.supabase_id;
        
        console.log('Looking for merchant with profile_id:', supabaseId);
        
        if (supabaseId) {
          // Trova il merchant tramite il profile_id
          const { data: merchant, error: merchantError } = await supabase
            .from('merchants')
            .select('id, profile_id')
            .eq('profile_id', supabaseId)
            .single();

          if (merchantError) {
            console.error('Error finding merchant:', merchantError);
            return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
          }

          console.log('Found merchant:', merchant);

          // Determina il tipo di piano e billing
          const isAnnual = (subscription as any).metadata?.isAnnual === 'true';
          const planType = isAnnual ? 'premium' : 'base';
          const billingType = isAnnual ? 'annual' : 'monthly';

          // Calcola le date con fallback
          const now = new Date();
          const startDate = (subscription as any).current_period_start 
            ? new Date((subscription as any).current_period_start * 1000).toISOString() 
            : now.toISOString();
          
          let endDate = null;
          if ((subscription as any).current_period_end) {
            endDate = new Date((subscription as any).current_period_end * 1000).toISOString();
          } else {
            // Calcola la data di fine basandosi sul tipo di abbonamento
            const endDateCalc = new Date(now);
            if (isAnnual) {
              endDateCalc.setFullYear(endDateCalc.getFullYear() + 1);
            } else {
              endDateCalc.setMonth(endDateCalc.getMonth() + 1);
            }
            endDate = endDateCalc.toISOString();
          }

          // Crea il record nella tabella subscriptions
          const subscriptionData = {
            profile_id: merchant.profile_id,
            plan_type: planType,
            billing_type: billingType,
            status: subscription.status,
            start_date: startDate,
            end_date: endDate,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          console.log('Creating subscription record with data:', subscriptionData);

          // Verifica se esiste già un abbonamento per questo profile_id
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('profile_id', merchant.profile_id)
            .eq('status', 'active')
            .single();

          let newSubscription;
          if (existingSubscription) {
            console.log('⚠️ Subscription already exists, updating instead of creating');
            
            // Aggiorna l'abbonamento esistente
            const { data: updatedSubscription, error: updateError } = await supabase
              .from('subscriptions')
              .update({
                plan_type: planType,
                billing_type: billingType,
                status: subscription.status,
                start_date: startDate,
                end_date: endDate,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer as string,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingSubscription.id)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating existing subscription:', updateError);
              return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
            }

            newSubscription = updatedSubscription;
            console.log('✅ Existing subscription updated successfully:', newSubscription);
          } else {
            // Crea un nuovo abbonamento
            const { data: createdSubscription, error: subscriptionError } = await supabase
              .from('subscriptions')
              .insert(subscriptionData)
              .select()
              .single();

            if (subscriptionError) {
              console.error('Error creating subscription:', subscriptionError);
              return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
            }

            newSubscription = createdSubscription;
            console.log('✅ Subscription created successfully:', newSubscription);
          }

          // Aggiorna anche il merchant
          const { error: merchantUpdateError } = await supabase
            .from('merchants')
            .update({
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              subscription_start_date: startDate,
              subscription_end_date: endDate,
              payment_status: 'active',
              last_payment_date: new Date().toISOString()
            })
            .eq('id', merchant.id);

          if (merchantUpdateError) {
            console.error('Error updating merchant:', merchantUpdateError);
          }

          console.log('✅ Merchant updated successfully');
        } else {
          console.error('❌ No supabase_id found in customer metadata');
        }
        
        console.log('=== END SUBSCRIPTION CREATED WEBHOOK ===');
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', updatedSubscription.id);
        
        // Calcola la data di fine con fallback
        let updatedEndDate = null;
        if ((updatedSubscription as any).current_period_end) {
          updatedEndDate = new Date((updatedSubscription as any).current_period_end * 1000).toISOString();
        } else {
          // Se non c'è current_period_end, usa la data corrente + 1 mese come fallback
          const now = new Date();
          const endDateCalc = new Date(now);
          endDateCalc.setMonth(endDateCalc.getMonth() + 1);
          updatedEndDate = endDateCalc.toISOString();
        }
        
        // Aggiorna il record nella tabella subscriptions
        const { error: updateSubscriptionError } = await supabase
          .from('subscriptions')
          .update({
            status: updatedSubscription.status,
            end_date: updatedEndDate,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', updatedSubscription.id);

        if (updateSubscriptionError) {
          console.error('Error updating subscription record:', updateSubscriptionError);
        } else {
          console.log('Subscription record updated successfully:', updatedSubscription.id);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription.id);
        
        // Aggiorna il record nella tabella subscriptions come cancellato
        const { error: deleteSubscriptionError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', deletedSubscription.id);

        if (deleteSubscriptionError) {
          console.error('Error updating deleted subscription record:', deleteSubscriptionError);
        } else {
          console.log('Subscription record marked as cancelled:', deletedSubscription.id);
        }
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