"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Inizializza Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PLANS = [
  {
    name: "Piano Base",
    price: 49,
    productId: "prod_SJxYELX99AEp5I",
    description: "Per chi vuole iniziare",
  },
  {
    name: "Piano Pro",
    price: 69,
    productId: "prod_SJxZrZBJ9DXkb0",
    description: "Per chi vuole di più",
  },
  {
    name: "Piano Premium",
    price: 99,
    productId: "prod_SJxZH6Ejfd8myY",
    description: "Per chi vuole il massimo",
  },
];

export default function CheckoutPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async (plan: typeof PLANS[0]) => {
    try {
      setLoading(plan.productId);
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: plan.price,
          productId: plan.productId,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });
      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe non inizializzato");
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Errore durante il checkout:", error);
      alert("Si è verificato un errore durante il checkout. Riprova più tardi.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Scegli il tuo abbonamento
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Seleziona il piano più adatto alle tue esigenze
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {PLANS.map((plan) => (
            <div
              key={plan.productId}
              className={`bg-gray-50 p-6 rounded-lg cursor-pointer hover:bg-gray-100 transition border ${loading === plan.productId ? 'opacity-60 pointer-events-none' : ''}`}
              onClick={() => handleCheckout(plan)}
              aria-disabled={!!loading}
            >
              <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">€{plan.price}</p>
              <p className="mt-2 text-sm text-gray-600">/mese</p>
              <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              {loading === plan.productId && (
                <div className="mt-4 text-center text-gray-500">Caricamento...</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 