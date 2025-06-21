import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  console.log('Webhook received:', { 
    bodyLength: body.length, 
    hasSignature: !!signature,
    timestamp: new Date().toISOString()
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Webhook event parsed successfully:', event.type);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new NextResponse('Webhook error', { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    console.log('Processing webhook event:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log('Checkout session completed:', {
          sessionId: session.id,
          subscriptionId: session.subscription,
          metadata: session.metadata,
          userId: session.metadata?.userId
        });
        
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('No user ID in session metadata');
          break;
        }

        // Determina il tipo di piano e fatturazione dai metadata
        const isAnnual = session.metadata?.isAnnual === 'true';
        const planType = session.metadata?.planType || 'base'; // default a base se non specificato

        console.log('Subscription details:', {
          userId,
          planType,
          isAnnual,
          stripeSubscriptionId: session.subscription
        });

        // Calcola le date
        const startDate = new Date();
        const endDate = isAnnual 
          ? new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 anno
          : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 mese

        // Prima cancella eventuali abbonamenti attivi esistenti
        const { error: cancelError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('profile_id', userId)
          .eq('status', 'active');

        if (cancelError) {
          console.error('Error cancelling existing subscriptions:', cancelError);
        } else {
          console.log('Existing subscriptions cancelled for user:', userId);
        }

        // Crea il nuovo abbonamento nel database
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            profile_id: userId,
            plan_type: planType,
            billing_type: isAnnual ? 'annual' : 'monthly',
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            stripe_subscription_id: session.subscription || null, // Salva l'ID dell'abbonamento Stripe
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error creating subscription:', error);
          throw error;
        }

        console.log(`Subscription created successfully for user ${userId} with Stripe ID: ${session.subscription}`);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('No user ID in subscription metadata');
          break;
        }

        // Aggiorna l'abbonamento esistente con lo stripe_subscription_id
        const { error } = await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('profile_id', userId)
          .eq('status', 'active')
          .is('stripe_subscription_id', null); // Solo se non ha già un stripe_subscription_id

        if (error) {
          console.error('Error updating subscription with Stripe ID:', error);
        } else {
          console.log(`Subscription updated with Stripe ID: ${subscription.id} for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('No user ID in subscription metadata');
          break;
        }

        // Aggiorna lo stato dell'abbonamento nel database
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_subscription_id: subscription.id, // Aggiorna anche l'ID Stripe
            updated_at: new Date().toISOString(),
          })
          .eq('profile_id', userId)
          .eq('status', 'active');

        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }

        console.log(`Subscription updated for user ${userId} with Stripe ID: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('No user ID in subscription metadata');
          break;
        }

        // Cancella l'abbonamento nel database
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('profile_id', userId)
          .eq('status', 'active');

        if (error) {
          console.error('Error cancelling subscription:', error);
          throw error;
        }

        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          // Aggiorna la data di fine dell'abbonamento quando il pagamento va a buon fine
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            const { error } = await supabase
              .from('subscriptions')
              .update({
                end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('profile_id', userId)
              .eq('status', 'active');

            if (error) {
              console.error('Error updating subscription end date:', error);
            } else {
              console.log(`Subscription end date updated for user ${userId}`);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            // Aggiorna lo stato dell'abbonamento a 'expired' se il pagamento fallisce
            const { error } = await supabase
              .from('subscriptions')
              .update({
                status: 'expired',
                updated_at: new Date().toISOString(),
              })
              .eq('profile_id', userId)
              .eq('status', 'active');

            if (error) {
              console.error('Error updating subscription status:', error);
            } else {
              console.log(`Subscription marked as expired for user ${userId}`);
            }
          }
        }
        break;
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
} 