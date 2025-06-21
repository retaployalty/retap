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

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription.default_payment_method) {
      return NextResponse.json({ error: 'No payment method found' }, { status: 404 });
    }

    // Get the payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(
      subscription.default_payment_method as string
    );

    return NextResponse.json({ 
      success: true, 
      paymentMethod: {
        id: paymentMethod.id,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        } : null
      }
    });

  } catch (error: any) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 