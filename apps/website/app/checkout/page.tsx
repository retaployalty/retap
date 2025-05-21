"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, CreditCard, Shield, Zap } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const features = [
  {
    title: "Carte NFC Illimitate",
    description: "Emetti quante carte fedeltà vuoi per i tuoi clienti",
    icon: CreditCard,
  },
  {
    title: "Gestione Punti",
    description: "Personalizza i tuoi programmi fedeltà con punti e premi",
    icon: Zap,
  },
  {
    title: "Sicurezza Garantita",
    description: "I dati dei tuoi clienti sono protetti e crittografati",
    icon: Shield,
  },
];

const stripePromise = loadStripe("pk_test_51RPJZdEC4VcVVLOnvP3lEJv7sJke8cBF9qatNbaqJ7Yk6aAtEZsoADbY95wjbzCvEpsCNhT2Yn3Vynrvy4Ojlh7700sUGw3cj7"); // <-- la tua chiave reale

export default function CheckoutWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutPage />
    </Elements>
  );
}

function CheckoutPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const router = useRouter();
  const supabase = createClientComponentClient();
  const stripe = useStripe();
  const elements = useElements();

  // Aggiungo stato per i dati di fatturazione
  const [billingForm, setBillingForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    vatNumber: "",
  });

  // Gestore per il form di fatturazione
  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingForm({ ...billingForm, [e.target.name]: e.target.value });
  };

  // Salva su Supabase e passa allo step 3
  const handleBillingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ottieni utente loggato
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");
      // Calcola le date
      const startDate = new Date();
      const trialEndDate = new Date(startDate);
      trialEndDate.setDate(trialEndDate.getDate() + 30);
      const endDate = new Date(startDate);
      if (billingCycle === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      // Inserisci nella tabella subscriptions
      const { error } = await supabase.from("subscriptions").insert({
        profile_id: user.id,
        plan_type: "base",
        billing_type: billingCycle === "monthly" ? "monthly" : "annual",
        status: "pending",
        start_date: startDate.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      if (error) throw error;
      setStep(3);
    } catch (err) {
      alert("Errore nel salvataggio della sottoscrizione");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      alert("Stripe non è pronto, riprova tra qualche secondo.");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      alert("Errore nel caricamento del campo carta.");
      setLoading(false);
      return;
    }

    try {
      const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement as any,
        billing_details: {
          name: billingForm.name,
          email: billingForm.email,
        },
      });

      if (stripeError) {
        alert(stripeError.message);
        setLoading(false);
        return;
      }

      // Verifica che paymentMethod.card esista
      if (!paymentMethod.card) {
        alert("Errore nel recupero dati carta.");
        setLoading(false);
        return;
      }

      const { last4, brand, exp_month, exp_year } = paymentMethod.card;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");

      const { error } = await supabase.from('payment_methods').insert({
        profile_id: user.id,
        stripe_payment_method_id: paymentMethod.id,
        card_last4: last4,
        card_brand: brand,
        card_exp_month: exp_month,
        card_exp_year: exp_year,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert('Metodo di pagamento salvato con successo!');
      // ... eventuale redirect o step successivo

    } catch (error) {
      alert('Errore nel salvataggio del metodo di pagamento');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length > 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    setCardExpiry(value);
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Colonna sinistra - Caratteristiche */}
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">ReTap Business</h1>
            <p className="text-lg text-muted-foreground">
              La soluzione completa per la gestione della tua fedeltà clienti
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Incluso nel piano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-base">Dashboard personalizzata</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-base">Supporto tecnico dedicato</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-base">Analisi e reportistica</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-base">Integrazione POS</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonna destra - Step multipli */}
        <Card className="border-2">
          <CardHeader className="space-y-1.5">
            <CardTitle className="text-2xl">Completa il tuo abbonamento</CardTitle>
            <p className="text-sm text-muted-foreground">
              {step === 1 && "Scegli il piano e procedi"}
              {step === 2 && "Inserisci i dati di fatturazione"}
              {step === 3 && "Inserisci i dati della carta di credito"}
            </p>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-base">Piano di abbonamento</Label>
                  <RadioGroup
                    value={billingCycle}
                    onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="h-full">
                      <RadioGroupItem
                        value="monthly"
                        id="monthly"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="monthly"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-6 min-h-[200px] min-w-[220px] h-full w-full hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-colors"
                      >
                        <div className="text-lg font-semibold">Mensile</div>
                        <div className="text-3xl font-bold my-2">$49</div>
                        <div className="text-sm text-muted-foreground">/mese</div>
                      </Label>
                    </div>
                    <div className="h-full">
                      <RadioGroupItem
                        value="yearly"
                        id="yearly"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="yearly"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-6 min-h-[200px] min-w-[220px] h-full w-full hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-colors"
                      >
                        <div className="text-lg font-semibold">Annuale</div>
                        <div className="text-3xl font-bold my-2">$530</div>
                        <div className="text-sm text-muted-foreground">-10%</div>
                        <div className="text-xs text-muted-foreground mt-1">Senza fee di attivazione</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                  {billingCycle === "monthly" && (
                    <div className="flex justify-between text-sm">
                      <span>Fee di attivazione (solo il primo mese)</span>
                      <span className="font-medium">$99</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Abbonamento {billingCycle === "monthly" ? "mensile" : "annuale"}</span>
                    <span className="font-medium">${billingCycle === "monthly" ? "49" : "530"}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-base font-semibold">
                    <span>Totale</span>
                    <span>${billingCycle === "monthly" ? "148" : "530"}</span>
                  </div>
                </div>
                <Button
                  className="w-full h-12 text-base"
                  onClick={() => setStep(2)}
                >
                  Procedi al pagamento
                </Button>
              </div>
            )}
            {step === 2 && (
              <form onSubmit={handleBillingSubmit} className="space-y-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input id="name" name="name" required value={billingForm.name} onChange={handleBillingChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required value={billingForm.email} onChange={handleBillingChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input id="address" name="address" required value={billingForm.address} onChange={handleBillingChange} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Città</Label>
                      <Input id="city" name="city" required value={billingForm.city} onChange={handleBillingChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">CAP</Label>
                      <Input id="postalCode" name="postalCode" required value={billingForm.postalCode} onChange={handleBillingChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Paese</Label>
                      <Input id="country" name="country" required value={billingForm.country} onChange={handleBillingChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">Partita IVA</Label>
                    <Input id="vatNumber" name="vatNumber" required value={billingForm.vatNumber} onChange={handleBillingChange} />
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                  {billingCycle === "monthly" && (
                    <div className="flex justify-between text-sm">
                      <span>Fee di attivazione (solo il primo mese)</span>
                      <span className="font-medium">$99</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Abbonamento {billingCycle === "monthly" ? "mensile" : "annuale"}</span>
                    <span className="font-medium">${billingCycle === "monthly" ? "49" : "530"}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-base font-semibold">
                    <span>Totale</span>
                    <span>${billingCycle === "monthly" ? "148" : "530"}</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading}
                >
                  {loading ? "Salvataggio..." : "Continua"}
                </Button>
              </form>
            )}
            {step === 3 && (
              <form onSubmit={handleCheckout} className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-base">Dati carta di credito</Label>
                  <div className="space-y-2">
                    <CardElement options={{ hidePostalCode: true }} />
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                  {billingCycle === "monthly" && (
                    <div className="flex justify-between text-sm">
                      <span>Fee di attivazione (solo il primo mese)</span>
                      <span className="font-medium">$99</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Abbonamento {billingCycle === "monthly" ? "mensile" : "annuale"}</span>
                    <span className="font-medium">${billingCycle === "monthly" ? "49" : "530"}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-base font-semibold">
                    <span>Totale</span>
                    <span>${billingCycle === "monthly" ? "148" : "530"}</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading}
                >
                  {loading ? "Elaborazione..." : "Conferma e paga"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 