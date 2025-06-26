"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { getStripePriceId } from "@/lib/stripe-config";

const features = [
  {
    title: "Unlimited NFC Cards",
    description: "Issue as many loyalty cards as you want for your customers",
    icon: CreditCard,
  },
  {
    title: "Points Management",
    description: "Customize your loyalty programs with points and rewards",
    icon: Zap,
  },
  {
    title: "Guaranteed Security",
    description: "Your customers' data is protected and encrypted",
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

// Inserisco la costante per il piano unico in inglese
const SUBSCRIPTION = {
  name: "SINGLE SUBSCRIPTION",
  subtitle: "For all businesses, big and small",
  monthlyPrice: 49,
  annualPrice: 529,
  activationFee: 99,
  features: [
    "POS device included",
    "Up to 100 physical cards/month",
    "Full dashboard",
    "Advanced statistics"
  ],
  guarantee: "30-day money-back guarantee. No questions asked."
};

export default function CheckoutWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutPage />
    </Elements>
  );
}

function CheckoutPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
    subscription_type: 'mensile',
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
          priceId: getStripePriceId(isAnnual ? "yearly" : "monthly"),
          customerEmail: billingForm.email,
          successUrl: window.location.origin + '/success',
          cancelUrl: window.location.origin + '/checkout',
          subscription_type: form.subscription_type,
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
        payment_method: paymentMethod === 'card' ? 'card' : 'bank_transfer',
        subscription_type: form.subscription_type,
        payment_successful: false
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
              priceId: getStripePriceId(isAnnual ? "yearly" : "monthly"),
              customerEmail: form.email,
              successUrl: window.location.origin + '/dashboard/settings?success=true',
              cancelUrl: window.location.origin + '/checkout',
              subscription_type: form.subscription_type,
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
    amount: isAnnual ? '470.00' : '148.00',
    reason: `Abbonamento ReTap Business ${isAnnual ? 'Annuale' : 'Mensile'}`,
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

  // Sincronizza la scelta del piano con il campo subscription_type
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      subscription_type: isAnnual ? "annuale" : "mensile",
    }));
  }, [isAnnual]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              ReTap Business
            </h1>
            <p className="text-xl text-muted-foreground mt-2 max-w-2xl mx-auto">
              The complete solution to manage your customer loyalty with NFC cards
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          {step === 1 && (
            <>
              {/* Toggle Monthly/Annual */}
              <div className="flex items-center justify-center gap-4 mb-2 w-full max-w-md">
                <span className="text-lg sm:text-xl">Monthly</span>
                <Switch id="billing-toggle" checked={isAnnual} onCheckedChange={setIsAnnual} className="scale-110 sm:scale-125" />
                <span className="text-lg sm:text-xl">Annual</span>
              </div>
              {/* Banner annuale stile pricing, spazio sempre riservato */}
              <div className="flex justify-center w-full max-w-md mb-6" style={{minHeight: '32px'}}>
                {isAnnual ? (
                  <div className="bg-[#1A1A1A]/5 text-[#1A1A1A] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-[#1A1A1A]/10 whitespace-nowrap">
                    No activation fee + 10% off first year (Save 84€)
                  </div>
                ) : (
                  <div className="px-2 sm:px-3 py-1 sm:py-1.5" style={{visibility: 'hidden'}}>&nbsp;</div>
                )}
              </div>
              {/* Subscription Box - stile identico a pricing */}
              <Card className="max-w-sm sm:max-w-md w-full border-[#1A1A1A] shadow-xl rounded-2xl">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-2xl text-center text-[#1A1A1A]">{SUBSCRIPTION.name}</CardTitle>
                  <CardDescription className="text-center text-muted-foreground text-sm sm:text-base">{SUBSCRIPTION.subtitle}</CardDescription>
                  <div className="mt-4 flex flex-col items-center">
                    <span className="text-4xl sm:text-5xl font-bold mb-1 text-[#1A1A1A]">
                      {isAnnual ? `${SUBSCRIPTION.annualPrice}€` : `${SUBSCRIPTION.monthlyPrice}€`}
                    </span>
                    <span className="text-muted-foreground text-base sm:text-lg">
                      /{isAnnual ? "year" : "month"}
                    </span>
                    {!isAnnual && (
                      <span className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">
                        + {SUBSCRIPTION.activationFee}€ one-time activation fee
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <ul className="space-y-2 mb-4">
                    {SUBSCRIPTION.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#FF3131] flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-center">
                    <div className="bg-[#28A745]/10 text-[#28A745] text-xs sm:text-sm rounded-lg px-3 sm:px-4 py-2 mb-4 shadow-sm border border-[#28A745]/20 text-center">
                      {SUBSCRIPTION.guarantee}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-4 sm:px-6">
                  <Button 
                    className="w-full h-14 text-lg sm:text-xl px-8 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white" 
                    style={{boxShadow: 'none'}}
                    type="button"
                    onClick={() => setStep(2)}
                  >
                    Activate now
                  </Button>
                </CardFooter>
              </Card>
              <div className="text-center text-lg text-black/70 mt-2">
                ReTap is always free for end customers.
              </div>
            </>
          )}
          {step === 2 && (
            <div className="w-full max-w-xl mx-auto mt-6">
              <Card className="shadow-xl rounded-2xl border border-[#E6E6E6] px-0 sm:px-2">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Button variant="ghost" size="sm" className="px-2 py-1 text-muted-foreground flex items-center gap-1" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <div className="flex-1 text-center">
                      <CardTitle className="text-2xl font-bold font-sans" style={{fontFamily: 'Fredoka, sans-serif'}}>Complete your subscription</CardTitle>
                      <CardDescription className="text-muted-foreground text-base">Enter your billing and shipping details</CardDescription>
                    </div>
                    <div className="w-16"></div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-4">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Info Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="title" className="text-sm text-muted-foreground">Title</Label>
                        <select
                          id="title"
                          name="title"
                          value={form.title}
                          onChange={handleChange}
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                          required
                        >
                          <option value="">Not specified</option>
                          <option value="Mr">Mr</option>
                          <option value="Ms">Ms</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="first_name" className="text-sm text-muted-foreground">First name</Label>
                        <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required placeholder="First name" className="rounded-lg" />
                      </div>
                      <div>
                        <Label htmlFor="last_name" className="text-sm text-muted-foreground">Last name</Label>
                        <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required placeholder="Last name" className="rounded-lg" />
                      </div>
                    </div>
                    {/* Address Section */}
                    <div className="space-y-3">
                      <Label className="font-semibold text-base">Address</Label>
                      <Input id="street_address" name="street_address" value={form.street_address} onChange={handleChange} placeholder="Street and number" required className="rounded-lg" />
                      <Input id="address_extra" name="address_extra" value={form.address_extra} onChange={handleChange} placeholder="Apartment, suite, building code (optional)" className="rounded-lg" />
                      <Input id="address_info" name="address_info" value={form.address_info} onChange={handleChange} placeholder="Other address info" className="rounded-lg" />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="zip_code" className="text-sm text-muted-foreground">ZIP code</Label>
                          <Input id="zip_code" name="zip_code" value={form.zip_code} onChange={handleChange} required placeholder="ZIP code" className="rounded-lg" />
                        </div>
                        <div>
                          <Label htmlFor="city" className="text-sm text-muted-foreground">City</Label>
                          <Input id="city" name="city" value={form.city} onChange={handleChange} required placeholder="City" className="rounded-lg" />
                        </div>
                        <div>
                          <Label htmlFor="country" className="text-sm text-muted-foreground">Country</Label>
                          <Input id="country" name="country" value={form.country} onChange={handleChange} required placeholder="Country" className="rounded-lg" />
                        </div>
                      </div>
                    </div>
                    {/* Company Section */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_company"
                          name="is_company"
                          checked={form.is_company}
                          onChange={handleChange}
                          className="accent-primary w-5 h-5 rounded"
                        />
                        <Label htmlFor="is_company" className="text-base">This is a company address</Label>
                      </div>
                      {form.is_company && (
                        <div className="pt-1">
                          <Label htmlFor="company_name" className="text-sm text-muted-foreground">Company name</Label>
                          <Input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} required={form.is_company} placeholder="Company name" className="rounded-lg" />
                        </div>
                      )}
                    </div>
                    {/* Contact Section */}
                    <div className="space-y-2 pt-1">
                      <Label className="font-semibold text-base">Contact information</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required className="rounded-lg" />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm text-muted-foreground">Phone number</Label>
                          <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Phone number" required className="rounded-lg" />
                        </div>
                      </div>
                    </div>
                    {/* Submit Button */}
                    <CardFooter className="px-0 pt-3">
                      <Button
                        type="submit"
                        className="w-full h-14 text-lg sm:text-xl px-8 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white rounded-lg transition-colors mt-2"
                        style={{boxShadow: 'none'}}
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Continue"}
                      </Button>
                    </CardFooter>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 