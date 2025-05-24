"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, CreditCard, Shield, Zap, Mail, MessageCircle, ArrowLeft, Building2, MapPin, User, Banknote } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from '@supabase/supabase-js';

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

// Lazy load dei componenti non essenziali
const Dialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });
const DialogDescription = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogDescription), { ssr: false });

// Chiave per il localStorage
const FORM_STORAGE_KEY = 'retap_checkout_form';

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
    title: '', // Sig., Sig.ra, Not specified
    first_name: '',
    last_name: '',
    street_address: '',
    address_extra: '',
    address_info: '',
    zip_code: '',
    city: '',
    country: '',
    is_company: false,
    company_name: '',
    email: '',
    phone: '',
  });
  const [success, setSuccess] = useState(false);

  // Gestore per il form di fatturazione
  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingForm({ ...billingForm, [e.target.name]: e.target.value });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newForm = {
      ...form,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    };
    setForm(newForm);
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

  // Modifica handleSubmit per pulire il localStorage dopo il successo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // 1. Salva i dati su Supabase
      const { error } = await supabase.from('checkout_billing').insert([{
        ...form,
        payment_method: paymentMethod === 'card' ? 'card' : 'bank_transfer'
      }]);

      if (error) {
        setLoading(false);
        alert('Errore nel salvataggio: ' + error.message);
        return;
      }

      // 2. Se il metodo di pagamento è carta, procedi con Stripe
      if (paymentMethod === 'card') {
        try {
          const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
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

          if (url) {
            window.location.href = url;
            return;
          }
        } catch (err) {
          alert('Errore durante la creazione della sessione di pagamento');
          console.error(err);
        }
      } else {
        // 3. Se il metodo è bonifico, mostra il dialog di ringraziamento
        setShowThankYouDialog(true);
      }

      // Se tutto va bene, pulisci il localStorage
      localStorage.removeItem(FORM_STORAGE_KEY);
    } catch (error) {
      console.error('Errore durante il submit:', error);
      alert('Si è verificato un errore durante l\'elaborazione della richiesta');
    } finally {
      setLoading(false);
    }
  };

  const [showThankYouDialog, setShowThankYouDialog] = useState(false);

  // Dati per il bonifico bancario
  const bankDetails = {
    iban: 'IT60X0542811101000000123456',
    swift: 'UNCRITM1XXX',
    beneficiary: 'ReTap S.r.l.',
    amount: billingCycle === 'monthly' ? '148.00' : '530.00',
    reason: `Abbonamento ReTap Business ${billingCycle === 'monthly' ? 'Mensile' : 'Annuale'}`,
  };

  // Salvataggio e ripristino dati form in localStorage
  useEffect(() => {
    // Carica dati form da localStorage all'avvio
    const savedForm = localStorage.getItem('retap_checkout_form');
    if (savedForm) setForm(JSON.parse(savedForm));
    
    const savedBilling = localStorage.getItem('retap_checkout_billing');
    if (savedBilling) setBillingForm(JSON.parse(savedBilling));
  }, []);

  // Salva i dati del form principale ad ogni modifica
  useEffect(() => {
    localStorage.setItem('retap_checkout_form', JSON.stringify(form));
  }, [form]);

  // Salva i dati di fatturazione ad ogni modifica
  useEffect(() => {
    localStorage.setItem('retap_checkout_billing', JSON.stringify(billingForm));
  }, [billingForm]);

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
              {step === 2 && "Inserisci i dati di spedizione"}
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
                {/* Sezione Anagrafica */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="title">Titolo</Label>
                      <select
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                      >
                        <option value="">Non specificato</option>
                        <option value="Mr">Sig.</option>
                        <option value="Ms">Sig.ra</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="first_name">Nome</Label>
                      <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Cognome</Label>
                      <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required />
                    </div>
                  </div>
                </div>

                {/* Sezione Indirizzo */}
                <div className="space-y-4">
                  <Label className="font-semibold">Indirizzo</Label>
                  <Input id="street_address" name="street_address" value={form.street_address} onChange={handleChange} placeholder="Via e numero civico" required />
                  <Input id="address_extra" name="address_extra" value={form.address_extra} onChange={handleChange} placeholder="Appartamento, interno, codice accesso edificio (facoltativo)" />
                  <Input id="address_info" name="address_info" value={form.address_info} onChange={handleChange} placeholder="Altre info sull'indirizzo" />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="zip_code">CAP</Label>
                      <Input id="zip_code" name="zip_code" value={form.zip_code} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="city">Città</Label>
                      <Input id="city" name="city" value={form.city} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="country">Paese</Label>
                      <Input id="country" name="country" value={form.country} onChange={handleChange} required />
                    </div>
                  </div>
                </div>

                {/* Sezione Azienda */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_company"
                      name="is_company"
                      checked={form.is_company}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <Label htmlFor="is_company">Questo è un indirizzo aziendale</Label>
                  </div>
                  {form.is_company && (
                    <div>
                      <Label htmlFor="company_name">Nome società</Label>
                      <Input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} required={form.is_company} />
                    </div>
                  )}
                </div>

                {/* Sezione Contatti */}
                <div className="space-y-2">
                  <Label className="font-semibold">Quali sono le tue informazioni di contatto?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required />
                    </div>
                    <div>
                      <Label htmlFor="phone">Numero di cellulare</Label>
                      <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Numero di cellulare" required />
                    </div>
                  </div>
                </div>

                {/* Sezione Metodo di Pagamento */}
                {billingCycle === 'yearly' && (
                  <div className="space-y-4">
                    <Label className="font-semibold">Metodo di pagamento</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as 'card' | 'bank')}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem
                          value="card"
                          id="card"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="card"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-colors"
                        >
                          <CreditCard className="w-6 h-6 mb-2" />
                          <div className="text-sm font-medium">Carta di credito</div>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="bank"
                          id="bank"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="bank"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-colors"
                        >
                          <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" />
                          </svg>
                          <div className="text-sm font-medium">Bonifico bancario</div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {paymentMethod === 'bank' && (
                      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                        <h4 className="font-semibold">Dettagli per il bonifico bancario</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Intestatario:</span>
                            <span className="font-medium">{bankDetails.beneficiary}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">IBAN:</span>
                            <span className="font-medium">{bankDetails.iban}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SWIFT/BIC:</span>
                            <span className="font-medium">{bankDetails.swift}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Importo:</span>
                            <span className="font-medium">€{bankDetails.amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Causale:</span>
                            <span className="font-medium">{bankDetails.reason}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                          Una volta effettuato il bonifico, riceverai una email di conferma con le credenziali di accesso.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottone submit */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading}
                >
                  {loading ? "Elaborazione..." : paymentMethod === 'bank' ? "Conferma e procedi" : "Continua"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      {success && <p>Dati salvati con successo!</p>}

      {/* Dialog di ringraziamento per bonifico */}
      <Dialog open={showThankYouDialog} onOpenChange={setShowThankYouDialog}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center mb-1">Grazie per il tuo ordine!</DialogTitle>
            <DialogDescription className="text-center text-base mb-4">
              Abbiamo ricevuto la tua richiesta di abbonamento con pagamento tramite bonifico bancario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <h4 className="font-semibold text-lg mb-2">Prossimi passi</h4>
              <ol className="list-decimal list-inside space-y-1 text-base text-muted-foreground">
                <li>Effettua il bonifico bancario utilizzando i dati forniti</li>
                <li>Invia la ricevuta del bonifico a <span className='font-medium text-primary'>payments@retap.com</span> oppure su WhatsApp</li>
              </ol>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-5 flex flex-col items-center shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-7 h-7 text-green-600" />
                <span className="font-semibold text-green-700 text-lg">Configura il tuo business</span>
              </div>
              <p className="text-center text-green-900 mb-4 text-base">Prenota la call iniziale di 30 minuti su WhatsApp: ti aiutiamo a configurare e usare ReTap senza pensieri.</p>
              <a 
                href="https://wa.me/390212345678?text=Ciao,%20vorrei%20prenotare%20la%20call%20di%20setup%20per%20ReTap" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-lg font-semibold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 mb-2"
              >
                <MessageCircle className="w-6 h-6" />
                Scrivici su WhatsApp
              </a>
              <span className="text-green-700 font-bold text-base select-all mb-1">+39 02 12345678</span>
            </div>
            <div className="text-center text-sm text-muted-foreground mt-2">
              Il tuo account sarà attivato entro 24 ore lavorative dalla ricezione del pagamento.
            </div>
          </div>
          <div className="flex justify-center mt-5">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full h-12 text-base"
            >
              Vai alla Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 