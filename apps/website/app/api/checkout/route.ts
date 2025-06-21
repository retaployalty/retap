// apps/website/app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { priceId, successUrl, cancelUrl, customerEmail, subscription_type } = await request.json();

    // Ottieni l'utente corrente
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session: authSession } } = await supabase.auth.getSession();

    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determina il tipo di piano e fatturazione
    const isAnnual = subscription_type === 'annuale' || subscription_type === 'yearly';
    const planType = 'base'; // default a base per ora

    // Usa gli URL passati dal frontend, con fallback sicuro
    const finalSuccessUrl = successUrl || 
      (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/dashboard/settings?success=true';
    
    const finalCancelUrl = cancelUrl || 
      (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/checkout';

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        userId: authSession.user.id,
        planType: planType,
        isAnnual: isAnnual.toString(),
        subscription_type: subscription_type || 'mensile',
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// apps/website/pages/api/checkout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { full_name, email, address, city, zip_code, country, vat_number } = req.body;

  const { error } = await supabase.from('checkout_billing').insert([
    { full_name, email, address, city, zip_code, country, vat_number }
  ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}