import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    // Get current user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session: authSession } } = await supabase.auth.getSession();

    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's active subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', authSession.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // If there's a Stripe subscription_id, cancel it too
    if (subscription.stripe_subscription_id) {
      try {
        // Cancel the subscription at the end of the current period
        // This means the user will not be charged for future periods
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        });
        
        console.log(`Stripe subscription ${subscription.stripe_subscription_id} cancelled successfully`);
      } catch (stripeError) {
        console.error('Error cancelling on Stripe:', stripeError);
        // Continue anyway with database cancellation
      }
    }

    // Update subscription status in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription cancelled successfully. You will not be charged for future periods.' 
    });

  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 