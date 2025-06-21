import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    // Get current user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session: authSession } } = await supabase.auth.getSession();

    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, returnUrl } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Get the subscription from Stripe to get the customer ID
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription.customer) {
      return NextResponse.json({ error: 'No customer found for this subscription' }, { status: 404 });
    }

    // Create a customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.customer as string,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return NextResponse.json({ 
      success: true, 
      url: session.url 
    });

  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 