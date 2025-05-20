"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Inizializza Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Crea la sessione di checkout
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: 9.99, // Prezzo mensile in euro
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const { sessionId } = await response.json();

      // Reindirizza a Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe non inizializzato");

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Errore durante il checkout:", error);
      alert("Si è verificato un errore durante il checkout. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Completa il tuo abbonamento
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Scegli il piano più adatto alle tue esigenze
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900">Piano Mensile</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">€9.99</p>
            <p className="mt-2 text-sm text-gray-600">
              /mese
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center text-sm text-gray-600">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Accesso a tutti i negozi affiliati
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Gestione punti fedeltà
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Supporto clienti 24/7
              </li>
            </ul>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Caricamento..." : "Procedi al pagamento"}
          </Button>
        </div>
      </div>
    </div>
  );
} 