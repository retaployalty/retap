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
            <div className="w-full max-w-2xl mx-auto">
              <Card className="shadow-xl border-0">
                <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="sm" className="px-2 py-1 text-gray-600 flex items-center gap-1" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                  </div>
                  <div className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 sm:gap-3 text-xl sm:text-2xl mb-2">
                      <User className="h-5 w-5 sm:h-6 sm:w-6" />
                      Complete Your Subscription
                    </CardTitle>
                    <p className="text-gray-600">Enter your billing and shipping details</p>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
                  <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                    {/* Personal Information */}
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-200">
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                        Personal Information
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title</Label>
                          <select
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            className="w-full h-11 sm:h-12 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white px-3 pr-10 text-gray-900 appearance-none"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 12px center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '16px 12px'
                            }}
                            required
                          >
                            <option value="">Not specified</option>
                            <option value="Mr">Mr</option>
                            <option value="Ms">Ms</option>
                          </select>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">First name *</Label>
                          <Input 
                            id="first_name" 
                            name="first_name" 
                            value={form.first_name} 
                            onChange={handleChange} 
                            required 
                            placeholder="Enter your first name" 
                            className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">Last name *</Label>
                          <Input 
                            id="last_name" 
                            name="last_name" 
                            value={form.last_name} 
                            onChange={handleChange} 
                            required 
                            placeholder="Enter your last name" 
                            className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-200">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                        Address Information
                      </h3>
                      
                      <div className="space-y-4 sm:space-y-6">
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="street_address" className="text-sm font-medium text-gray-700">Street and number *</Label>
                          <Input 
                            id="street_address" 
                            name="street_address" 
                            value={form.street_address} 
                            onChange={handleChange} 
                            placeholder="Enter street and number" 
                            required 
                            className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          />
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="address_extra" className="text-sm font-medium text-gray-700">Apartment, suite, building code</Label>
                          <Input 
                            id="address_extra" 
                            name="address_extra" 
                            value={form.address_extra} 
                            onChange={handleChange} 
                            placeholder="Apartment, suite, building code (optional)" 
                            className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          />
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="address_info" className="text-sm font-medium text-gray-700">Other address info</Label>
                          <Input 
                            id="address_info" 
                            name="address_info" 
                            value={form.address_info} 
                            onChange={handleChange} 
                            placeholder="Other address info" 
                            className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                          <div className="space-y-2 sm:space-y-3">
                            <Label htmlFor="zip_code" className="text-sm font-medium text-gray-700">ZIP code *</Label>
                            <Input 
                              id="zip_code" 
                              name="zip_code" 
                              value={form.zip_code} 
                              onChange={handleChange} 
                              required 
                              placeholder="Enter ZIP code" 
                              className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            />
                          </div>
                          <div className="space-y-2 sm:space-y-3">
                            <Label htmlFor="city" className="text-sm font-medium text-gray-700">City *</Label>
                            <Input 
                              id="city" 
                              name="city" 
                              value={form.city} 
                              onChange={handleChange} 
                              required 
                              placeholder="Enter city" 
                              className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            />
                          </div>
                          <div className="space-y-2 sm:space-y-3">
                            <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country *</Label>
                            <Input 
                              id="country" 
                              name="country" 
                              value={form.country} 
                              onChange={handleChange} 
                              required 
                              placeholder="Enter country" 
                              className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company Information */}
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-200">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        Company Information
                      </h3>
                      
                      <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="is_company"
                            name="is_company"
                            checked={form.is_company}
                            onChange={handleChange}
                            className="accent-blue-500 w-5 h-5 rounded"
                          />
                          <Label htmlFor="is_company" className="text-base font-medium text-gray-700">This is a company address</Label>
                        </div>
                        
                        {form.is_company && (
                          <div className="space-y-2 sm:space-y-3">
                            <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">Company name *</Label>
                            <Input 
                              id="company_name" 
                              name="company_name" 
                              value={form.company_name} 
                              onChange={handleChange} 
                              required={form.is_company} 
                              placeholder="Enter company name" 
                              className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-200">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                        Contact Information
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
                          <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            value={form.email} 
                            onChange={handleChange} 
                            placeholder="Enter your email address" 
                            required 
                            className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone number *</Label>
                          <Input 
                            id="phone" 
                            name="phone" 
                            type="tel" 
                            value={form.phone} 
                            onChange={handleChange} 
                            placeholder="Enter your phone number" 
                            required 
                            className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 sm:h-14 bg-[#1A1A1A] hover:bg-[#FF3131] text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 group text-base sm:text-lg font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Complete Subscription</span>
                          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1 rotate-180" />
                        </>
                      )}
                    </Button>
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