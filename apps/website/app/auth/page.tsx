"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { getStripePriceId } from "@/lib/stripe-config";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [billingForm, setBillingForm] = useState({ email: '' });
  const [paymentMethod, setPaymentMethod] = useState({ id: '' });
  const [stripeCustomerId, setStripeCustomerId] = useState('');
  const [authData, setAuthData] = useState({ user: { id: '' } });
  const router = useRouter();
  
  useEffect(() => {
    // Check if environment variables are loaded
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Supabase environment variables are not properly configured");
    }
  }, []);

  // Initialize Supabase client with environment variables
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
        console.error("Supabase error:", error);
        alert("Supabase error: " + JSON.stringify(error, null, 2));
        setLoading(false);
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      setMessage("Login successful!");
      router.push('/dashboard/tutorial');
      router.refresh(); // Force page refresh to update state
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error during login");
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

    console.log('Registration data:', { email, firstName, lastName, phone });

    try {
      // 1. Register user
      console.log('1. Starting user registration...');
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
        console.error('Registration error:', authError);
        throw authError;
      }
      if (!authData.user) {
        console.error('No user returned from registration');
        throw new Error("Error during registration");
      }

      console.log('User registered:', authData.user);

      // 2. Create user profile
      console.log('3. Creating profile...');
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
        console.error('Profile creation error:', profileError);
        throw new Error('Error during profile creation: ' + profileError.message);
      }

      setMessage("Registration completed! Now set up your store.");
      router.push('/onboarding');
    } catch (err) {
      console.error('Detailed error:', err);
      if (err instanceof Error && err.message.includes('rate limit')) {
        setError('Too many registration attempts. Please wait a few minutes before trying again.');
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
      // Get user's "pending" subscription
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("profile_id", authData.user.id)
        .eq("status", "pending")
        .single();

      if (subError || !subscription) throw subError || new Error("Subscription not found");

      // Calculate new end date
      const newEndDate = new Date();
      if (billingCycle === "monthly") {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      // Update subscription
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          end_date: newEndDate.toISOString(),
          stripe_subscription_id: stripeSubscriptionId,
        })
        .eq("id", subscription.id);

      if (updateError) throw updateError;

      setMessage("Subscription activated successfully!");
      router.push('/dashboard/tutorial');

      // Update payments table
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          subscription_id: subscription.id,
          amount: billingCycle === "monthly" ? 148 : 530, // total
          currency: "EUR",
          status: "paid",
          stripe_customer_id: stripeCustomerId, // <-- from Stripe
          stripe_subscription_id: stripeSubscriptionId, // <-- from Stripe
          payment_method_id: paymentMethod.id, // <-- from Stripe
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (paymentError) throw paymentError;
    } catch (err) {
      console.error('Detailed error:', err);
      if (err instanceof Error && err.message.includes('rate limit')) {
        setError('Too many activation attempts. Please wait a few minutes before trying again.');
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
          priceId: getStripePriceId(billingCycle),
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-border">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">
            {isLogin ? "Accedi al tuo account" : "Crea il tuo account"}
          </h2>
          <p className="mt-2 text-sm text-textSecondary">
            {isLogin ? "Non hai un account?" : "Hai già un account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-[#1A1A1A] hover:text-[#1A1A1A]/80 transition-colors"
            >
              {isLogin ? "Registrati" : "Accedi"}
            </button>
          </p>
        </div>

        {error && (
          <div className="bg-[#FF3131]/10 text-[#FF3131] text-sm p-4 rounded-lg flex items-center gap-2 border border-[#FF3131]/20">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500/10 text-green-500 text-sm p-4 rounded-lg flex items-center gap-2 border border-green-500/20">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-6">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-medium text-[#1A1A1A]">
                    Nome
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textSecondary" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="pl-10 mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-medium text-[#1A1A1A]">
                    Cognome
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textSecondary" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="pl-10 mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-[#1A1A1A]">
                  Numero di telefono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="pl-10 mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A]">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textSecondary" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="pl-10 mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textSecondary" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                className="pl-10 mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[#1A1A1A] hover:bg-[#FF3131] text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group"
            disabled={loading}
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "Accedi" : "Registrati"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link 
            href="/" 
            className="text-[#1A1A1A] hover:text-[#FF3131] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
} 