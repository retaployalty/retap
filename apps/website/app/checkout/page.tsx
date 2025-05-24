"use client";

import { useState } from "react";
=======
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CreditCard, Building2, MapPin, Mail, User, Banknote } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from '@supabase/supabase-js';

const plans = {
  BASIC: {
    name: "BASIC",
    monthlyPrice: "€49",
    monthlyPriceAfter: "€49",
    annualPrice: "€470",
    description: "First month (activation), then €49/month",
    annualDescription: "Annual subscription with 20% discount",
    features: ["100 carte/mese", "Visibilità standard"]
  },
  INTERMEDIATE: {
    name: "INTERMEDIATE",
    monthlyPrice: "€69",
    annualPrice: "€662",
    description: "Monthly subscription",
    annualDescription: "Annual subscription with 20% discount",
    features: ["Fino a 400 carte/mese", "Posizione più alta"]
  },
  PRO: {
    name: "PRO",
    monthlyPrice: "€99",
    annualPrice: "€950",
    description: "Monthly subscription",
    annualDescription: "Annual subscription with 20% discount",
    features: ["Fino a 1000 carte/mese", "Primo nella lista nella zona"]
  }
} as const;

type PlanType = keyof typeof plans;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const countries = [
  { code: 'it', name: 'Italy', flag: '🇮🇹' },
  { code: 'nl', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'ch', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'at', name: 'Austria', flag: '🇦🇹' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'es', name: 'Spain', flag: '🇪🇸' },
  { code: 'be', name: 'Belgium', flag: '🇧🇪' },
  { code: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'pl', name: 'Poland', flag: '🇵🇱' },
  { code: 'cz', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'pt', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ie', name: 'Ireland', flag: '🇮🇪' },
  { code: 'se', name: 'Sweden', flag: '🇸🇪' },
  { code: 'fi', name: 'Finland', flag: '🇫🇮' },
  { code: 'no', name: 'Norway', flag: '🇳🇴' },
  { code: 'dk', name: 'Denmark', flag: '🇩🇰' },
  { code: 'gr', name: 'Greece', flag: '🇬🇷' },
  { code: 'hu', name: 'Hungary', flag: '🇭🇺' },
  { code: 'ro', name: 'Romania', flag: '🇷🇴' },
  { code: 'bg', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'sk', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'si', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'hr', name: 'Croatia', flag: '🇭🇷' },
  { code: 'ee', name: 'Estonia', flag: '🇪🇪' },
  { code: 'lv', name: 'Latvia', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'lu', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'mt', name: 'Malta', flag: '🇲🇹' },
  { code: 'cy', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'tr', name: 'Turkey', flag: '🇹🇷' },
  { code: 'ua', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'ru', name: 'Russia', flag: '🇷🇺' },
  { code: 'md', name: 'Moldova', flag: '🇲🇩' },
  { code: 'al', name: 'Albania', flag: '🇦🇱' },
  { code: 'rs', name: 'Serbia', flag: '🇷🇸' },
  { code: 'ba', name: 'Bosnia & Herzegovina', flag: '🇧🇦' },
  { code: 'me', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'mk', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'li', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'is', name: 'Iceland', flag: '🇮🇸' },
  { code: 'mc', name: 'Monaco', flag: '🇲🇨' },
  { code: 'sm', name: 'San Marino', flag: '🇸🇲' },
  { code: 'va', name: 'Vatican City', flag: '🇻🇦' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan")?.toUpperCase() || "BASIC";
  const billing = searchParams.get("billing") || "monthly";
  
  // Verifica che il piano sia valido
  const isValidPlan = planParam in plans;
  const plan = isValidPlan ? planParam as PlanType : "BASIC";
  const selectedPlan = plans[plan];
  
  const isAnnual = billing === "annual";
  const [isLoading, setIsLoading] = useState(false);

  // Reindirizza se il piano non è valido
  useEffect(() => {
    if (!isValidPlan) {
      toast.error("Piano non valido, reindirizzamento al piano BASIC");
      router.replace(`/checkout?plan=BASIC&billing=${billing}`);
    }
  }, [isValidPlan, billing, router]);

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    address: "",
    city: "",
    postalCode: "",
    country: "it",
    vatId: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validazione VAT
    if (!validateVat()) {
      toast.error("VAT non valido");
      setIsLoading(false);
      return;
    }

    // Salva su Supabase
    const { error } = await supabase
      .from('checkout_leads')
      .insert([{
        ...formData,
        plan,
        billing: isAnnual ? "annual" : "monthly"
      }]);
    if (error) {
      toast.error("Errore nel salvataggio dati");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          billingDetails: formData,
          isAnnual
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il pagamento');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Si è verificato un errore durante il pagamento');
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  // Gestore per il form di fatturazione
  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingForm({ ...billingForm, [e.target.name]: e.target.value });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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

                {/* Bottone submit */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading}
                >
                  {loading ? "Elaborazione..." : "Continua"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
  const showActivationFee = plan === 'BASIC' && !isAnnual;
  const activationFee = 25;

  const getVatLabel = () => {
    if (formData.country === "nl") return "BTW Number";
    if (formData.country === "it") return "Partita IVA";
    return "VAT ID";
  };

  const getVatPlaceholder = () => {
    if (formData.country === "nl") return "NL123456789B01";
    if (formData.country === "it") return "IT12345678901";
    return "";
  };

  const validateVat = () => {
    const { vatId, country } = formData;
    if (!vatId || vatId.length < 8) return false;
    if (!/^[a-zA-Z0-9]+$/.test(vatId)) return false;
    if (country === "nl" && vatId) {
      return /^NL[0-9]{9}B[0-9]{2}$/.test(vatId);
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/pricing" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna ai prezzi
        </Link>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Completa il tuo abbonamento
            </h1>
            <p className="text-xl text-muted-foreground">
              Sei a pochi passi dal piano {selectedPlan.name}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Billing Details */}
                <Card className="border-none shadow-lg">
                  <CardHeader className="border-b bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <CardTitle>Dettagli Fatturazione</CardTitle>
                    </div>
                    <CardDescription>Inserisci i dati della tua azienda</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">Nome</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input 
                            id="firstName" 
                            className="pl-10" 
                            required 
                            value={formData.firstName}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium">Cognome</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input 
                            id="lastName" 
                            className="pl-10" 
                            required 
                            value={formData.lastName}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email" 
                          className="pl-10" 
                          required 
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-medium">Nome Azienda</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="company" 
                          className="pl-10" 
                          required 
                          value={formData.company}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">Indirizzo</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="address" 
                          className="pl-10" 
                          required 
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">Città</Label>
                        <Input 
                          id="city" 
                          required 
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-sm font-medium">CAP</Label>
                        <Input 
                          id="postalCode" 
                          required 
                          value={formData.postalCode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-medium">Paese</Label>
                        <Select 
                          value={formData.country}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona un paese" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(c => (
                              <SelectItem key={c.code} value={c.code}>
                                <span className="mr-2">{c.flag}</span>{c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vatId" className="text-sm font-medium">{getVatLabel()}</Label>
                        <Input
                          id="vatId"
                          placeholder={getVatPlaceholder()}
                          value={formData.vatId}
                          onChange={e => setFormData(prev => ({ ...prev, vatId: e.target.value.toUpperCase() }))}
                          className="pl-4"
                          required
                        />
                        {formData.vatId && !validateVat() && (
                          <p className="text-xs text-red-500">Inserisci un VAT valido ({getVatLabel()})</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="border-none shadow-lg sticky top-8">
                  <CardHeader className="border-b bg-muted/50">
                    <CardTitle>Riepilogo Ordine</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Piano {selectedPlan.name}</p>
                          <p className="text-sm text-muted-foreground">{getDescription()}</p>
                        </div>
                        <p className="font-bold text-lg">{getPrice()}</p>
                      </div>
                      <div className="space-y-2">
                        {selectedPlan.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                    {showActivationFee && (
                      <div className="flex justify-between items-center text-sm border-t pt-4">
                        <p className="text-muted-foreground">Fee di attivazione</p>
                        <p>€{activationFee}</p>
                      </div>
                    )}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <p>Totale</p>
                        <p>
                          {showActivationFee
                            ? `€${(
                                parseFloat(getPrice().replace('€', '')) + activationFee
                              ).toFixed(2)}`
                            : getPrice()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg" 
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? "Elaborazione..." : "Completa il Pagamento"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Completando l'acquisto accetti i nostri Termini di Servizio
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
      {success && <p>Dati salvati con successo!</p>}
    </div>
  );
} 