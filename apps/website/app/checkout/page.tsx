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
import { supabase } from '../lib/supabaseClient';

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

// Inizializza Stripe con la tua chiave pubblica
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');

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

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    address: '',
    city: '',
    zip_code: '',
    country: '',
    vat_number: '',
  });
  const [success, setSuccess] = useState(false);

  // Gestore per il form di fatturazione
  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingForm({ ...billingForm, [e.target.name]: e.target.value });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Salva su Supabase e passa allo step 3
  const handleBillingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
          customerEmail: billingForm.email,
          successUrl: window.location.origin + '/success',
          cancelUrl: window.location.origin + '/checkout',
        }),
      });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) {
        window.location.href = url;
        return;
      }
    } catch (err) {
      alert('Errore durante la creazione della sessione di pagamento');
      console.error(err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // 1. Salva i dati su Supabase
    const { error } = await supabase.from('checkout_billing').insert([form]);

    if (error) {
      setLoading(false);
      alert('Errore nel salvataggio: ' + error.message);
      return;
    }

    // 2. Crea la sessione di pagamento Stripe tramite la tua API
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Qui puoi passare eventuali dati necessari per Stripe
          priceId: billingCycle === 'monthly'
            ? 'price_1RRGYVEC4VcVVLOnNYVe4B0K'
            : 'price_1RRGZZEC4VcVVLOn6MWL9IGZ',
          customerEmail: form.email,
          successUrl: window.location.origin + '/success',
          cancelUrl: window.location.origin + '/checkout',
        }),
      });
      const { url, error: stripeError } = await response.json();
      if (stripeError) throw new Error(stripeError);

      // 3. Reindirizza a Stripe
      if (url) {
        window.location.href = url;
        return;
      }
    } catch (err) {
      alert('Errore durante la creazione della sessione di pagamento');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome completo</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        placeholder="Mario Rossi"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="mariorossi@gmail.com"/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input id="address" name="address" required value={form.address} onChange={handleChange} placeholder="Via Nuova 123"/>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Città</Label>
                      <Input id="city" name="city" required value={form.city} onChange={handleChange} placeholder="Milano"/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">CAP</Label>
                      <Input id="postalCode" name="zip_code" required value={form.zip_code} onChange={handleChange} placeholder="303454"/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Paese</Label>
                      <Input id="country" name="country" required value={form.country} onChange={handleChange} placeholder="Italy"/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">Partita IVA</Label>
                    <Input id="vatNumber" name="vat_number" required value={form.vat_number} onChange={handleChange} placeholder="IT12345678901"/>
                  </div>
                </div>
                {/* Metodo di pagamento solo per annuale */}
                {billingCycle === 'yearly' && (
                  <div className="space-y-4">
                    <Label className="text-base">Metodo di pagamento</Label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                        />
                        <span>Carta</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank"
                          checked={paymentMethod === 'bank'}
                          onChange={() => setPaymentMethod('bank')}
                        />
                        <span>Bonifico</span>
                      </label>
                    </div>
                  </div>
                )}
                {/* Se bonifico, mostra dati beneficiario */}
                {billingCycle === 'yearly' && paymentMethod === 'bank' && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <div className="font-semibold">Dati per bonifico bancario</div>
                    <div><span className="font-medium">Beneficiario:</span> ReTap Srl</div>
                    <div><span className="font-medium">IBAN:</span> IT00A0000000000000000000000</div>
                    <div><span className="font-medium">Banca:</span> Nome Banca</div>
                    <div><span className="font-medium">Causale:</span> Abbonamento annuale ReTap - [Tua email]</div>
                    <div className="text-xs text-muted-foreground mt-2">Dopo aver effettuato il bonifico, invia la ricevuta a <a href="mailto:info@retap.it" className="underline">info@retap.it</a> per attivare l'abbonamento.</div>
                  </div>
                )}
                {/* Bottone continua solo se carta o mensile */}
                {(billingCycle === 'monthly' || paymentMethod === 'card') && (
                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={loading}
                  >
                    {loading ? "Elaborazione..." : "Continua"}
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      {success && <p>Dati salvati con successo!</p>}
    </div>
  );
} 