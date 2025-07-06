import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simula l'evento customer.subscription.created
    const mockEvent = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_' + Date.now(),
          customer: 'cus_test_' + Date.now(),
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
          metadata: {
            isAnnual: 'false'
          }
        }
      }
    };

    // Trova il merchant dell'utente corrente
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, profile_id, name')
      .eq('profile_id', session.user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ 
        error: 'No merchant found for current user',
        details: merchantError 
      }, { status: 404 });
    }

    console.log('Testing webhook for merchant:', merchant);

    // Simula la creazione del record subscription
    const subscriptionData = {
      profile_id: merchant.profile_id,
      plan_type: 'base',
      billing_type: 'monthly',
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating test subscription:', subscriptionError);
      return NextResponse.json({ 
        error: 'Failed to create test subscription',
        details: subscriptionError 
      }, { status: 500 });
    }

    // Aggiorna anche il merchant
    const { error: merchantUpdateError } = await supabase
      .from('merchants')
      .update({
        stripe_customer_id: mockEvent.data.object.customer,
        stripe_subscription_id: mockEvent.data.object.id,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_status: 'active',
        last_payment_date: new Date().toISOString()
      })
      .eq('id', merchant.id);

    if (merchantUpdateError) {
      console.error('Error updating merchant:', merchantUpdateError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Test webhook executed successfully',
      subscription: subscription,
      merchant: merchant,
      mockEvent: mockEvent
    });

  } catch (error: any) {
    console.error('Error in test webhook endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 