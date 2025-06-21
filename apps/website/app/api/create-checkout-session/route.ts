import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      email,
      address,
      city,
      country,
      postalCode,
      vatNumber,
      priceId,
      activationPriceId,
      planType = 'base', // default a base se non specificato
      isAnnual = false, // default a mensile se non specificato
    } = body;

    // Gestisci l'URL di base con fallback sicuro
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.NODE_ENV === 'production' ? 'https://retap.vercel.app' : 'http://localhost:3000');
    
    // Assicurati che l'URL abbia il protocollo
    const appUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

    // Crea la sessione di checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: email,
      billing_address_collection: "required",
      line_items: [
        ...(priceId === "price_1RRGYVEC4VcVVLOnNYVe4B0K" ? [{
          price: activationPriceId,
          quantity: 1,
        }] : []),
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/dashboard/settings?success=true`,
      cancel_url: `${appUrl}/checkout?canceled=true`,
      metadata: {
        userId: session.user.id,
        planType: planType,
        isAnnual: isAnnual.toString(),
        name,
        email,
        address,
        city,
        country,
        postalCode,
        vatNumber,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Errore durante la creazione della sessione di checkout:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 