import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verifica se esiste un abbonamento attivo
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', session.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking subscription:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Verifica anche nella tabella merchants
    const { data: merchant } = await supabase
      .from('merchants')
      .select('stripe_subscription_id, subscription_status, subscription_end_date')
      .eq('profile_id', session.user.id)
      .single();

    const hasActiveSubscription = subscription && 
      new Date(subscription.end_date) > new Date();

    return NextResponse.json({ 
      success: true,
      hasActiveSubscription,
      subscription: subscription || null,
      merchant: merchant || null,
      message: hasActiveSubscription ? 'Active subscription found' : 'No active subscription found'
    });

  } catch (error: any) {
    console.error('Error in check subscription endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 