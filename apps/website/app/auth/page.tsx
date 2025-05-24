"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    // Verifica che le variabili d'ambiente siano state caricate
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Le variabili d'ambiente di Supabase non sono state configurate correttamente");
    }
  }, []);

  // Inizializza il client Supabase con le variabili d'ambiente
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard/tutorial');
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Errore Supabase:", error);
        alert("Errore Supabase: " + JSON.stringify(error, null, 2));
        setLoading(false);
        return;
      }

      // Recupera il profilo dell'utente
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      setMessage("Login effettuato con successo!");
      router.push('/dashboard/tutorial');
      router.refresh(); // Forza il refresh della pagina per aggiornare lo stato
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;

    console.log('Dati registrazione:', { email, firstName, lastName, phone });

    try {
      // 1. Registra l'utente
      console.log('1. Inizio registrazione utente...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phone
          },
          emailRedirectTo: undefined
        }
      });

      if (authError) {
        console.error('Errore registrazione:', authError);
        throw authError;
      }
      if (!authData.user) {
        console.error('Nessun utente restituito dalla registrazione');
        throw new Error("Errore durante la registrazione");
      }

      console.log('Utente registrato:', authData.user);

      // 2. Crea il profilo dell'utente
      console.log('3. Creazione profilo...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([
          {
            id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            phone_number: phone,
            email: email
          }
        ]);

      if (profileError) {
        console.error('Errore creazione profilo:', profileError);
        throw new Error('Errore durante la creazione del profilo: ' + profileError.message);
      }

      setMessage("Registrazione completata! Ora registra il tuo negozio.");
      router.push('/onboarding');
    } catch (err) {
      console.error('Errore dettagliato:', err);
      if (err instanceof Error && err.message.includes('rate limit')) {
        setError('Troppi tentativi di registrazione. Attendi qualche minuto prima di riprovare.');
      } else {
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const stripeSubscriptionId = formData.get("stripeSubscriptionId") as string;
    const billingCycle = formData.get("billingCycle") as string;

    try {
      // Recupera la subscription "pending" dell'utente
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("profile_id", authData.user.id)
        .eq("status", "pending")
        .single();

      if (subError || !subscription) throw subError || new Error("Subscription non trovata");

      // Calcola la nuova data di fine
      const newEndDate = new Date();
      if (billingCycle === "monthly") {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      // Aggiorna la subscription
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          end_date: newEndDate.toISOString(),
          stripe_subscription_id: stripeSubscriptionId,
        })
        .eq("id", subscription.id);

      if (updateError) throw updateError;

      setMessage("Abbonamento attivato con successo!");
      router.push('/dashboard/tutorial');

      // Aggiorna la tabella payments
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          subscription_id: subscription.id,
          amount: billingCycle === "monthly" ? 148 : 530, // totale
          currency: "EUR",
          status: "paid",
          stripe_customer_id: stripeCustomerId, // <-- da Stripe
          stripe_subscription_id: stripeSubscriptionId, // <-- da Stripe
          payment_method_id: paymentMethod.id, // <-- da Stripe
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (paymentError) throw paymentError;
    } catch (err) {
      console.error('Errore dettagliato:', err);
      if (err instanceof Error && err.message.includes('rate limit')) {
        setError('Troppi tentativi di attivazione. Attendi qualche minuto prima di riprovare.');
      } else {
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Chiamata API per creare la sessione Stripe Checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: billingCycle === 'monthly'
            ? 'price_1RRGYVEC4VcVVLOnNYVe4B0K'
            : 'price_1RRGZZEC4VcVVLOn6MWL9IGZ',
          customerEmail: billingForm.email, // oppure user.email se preferisci
          successUrl: window.location.origin + '/success',
          cancelUrl: window.location.origin + '/checkout',
        }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);

      // Redirect a Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Errore:', error);
      alert(error instanceof Error ? error.message : 'Errore nel processare il pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {isLogin ? "Accedi" : "Registrati"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? "Non hai un account? " : "Hai già un account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary hover:text-primary/80"
            >
              {isLogin ? "Registrati" : "Accedi"}
            </button>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
            {message}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                  Password dimenticata?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Caricamento..." : "Accedi"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Cognome
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Numero di telefono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Caricamento..." : "Crea account"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
} 