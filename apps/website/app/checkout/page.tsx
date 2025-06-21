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
  monthlyPrice: 49,
  activationFee: 99,
  annualDiscount: 0.10, // 10%
  features: [
    "Up to 1000 cards/month",
    "Full dashboard",
    "Advanced statistics",
    "Priority support",
    "API access"
  ]
};

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
          priceId: getStripePriceId(billingCycle),
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
              priceId: getStripePriceId(billingCycle),
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

  // Sincronizza la scelta del piano con il campo subscription_type
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      subscription_type: billingCycle === "monthly" ? "mensile" : "annuale",
    }));
  }, [billingCycle]);

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Colonna sinistra - Caratteristiche */}
        <div className="space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">ReTap Business</h1>
            <p className="text-lg text-muted-foreground">
              The complete solution for managing your customer loyalty
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 p-5 rounded-2xl border bg-card shadow-sm">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-base">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Card className="border-2 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Included in the plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-base">Custom dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-base">Dedicated technical support</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-base">Analytics and reporting</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-base">POS integration</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonna destra - Step multipli */}
        <Card className="border-2 rounded-2xl shadow-lg">
          <CardHeader className="space-y-1.5 pb-2">
            <CardTitle className="text-2xl text-center">Complete your subscription</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              {step === 1 && "Choose your plan and continue"}
              {step === 2 && "Enter your billing and shipping details"}
            </p>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    Pricing
                  </h2>
                  <p className="text-base text-muted-foreground mb-4">
                    One simple, transparent subscription
                  </p>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Label htmlFor="billing-toggle" className="text-sm font-medium">Monthly</Label>
                    <Switch
                      id="billing-toggle"
                      checked={billingCycle === 'yearly'}
                      onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                    />
                    <Label htmlFor="billing-toggle" className="text-sm font-medium">
                      Annual
                      </Label>
                    </div>
                </div>
                <div className="flex justify-center">
                  <Card className="max-w-md w-full border-primary shadow-md rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-2xl text-center">{SUBSCRIPTION.name}</CardTitle>
                      <CardDescription className="text-center">For all businesses, big and small</CardDescription>
                      <div className="mt-4 flex flex-col items-center">
                        <span className="text-5xl font-bold mb-1">
                          {billingCycle === 'yearly' ? `${Math.round(SUBSCRIPTION.monthlyPrice * 12 * (1 - SUBSCRIPTION.annualDiscount))}€` : `${SUBSCRIPTION.monthlyPrice}€`}
                        </span>
                        <span className="text-muted-foreground text-lg">
                          /{billingCycle === 'yearly' ? "year" : "month"}
                        </span>
                    </div>
                      {billingCycle === 'monthly' && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          + {SUBSCRIPTION.activationFee}€ one-time activation fee
                        </p>
                      )}
                      {billingCycle === 'yearly' && (
                        <p className="text-sm text-primary mt-2 text-center">
                          10% discount and no activation fee
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-4">
                        {SUBSCRIPTION.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-center">
                        <div className="bg-green-50 text-green-700 text-sm font-bold rounded-lg px-4 py-2 mb-4 shadow-sm border border-green-200">
                          30-day money-back guarantee. No questions asked.
                        </div>
                  </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full h-12 text-base mt-2" variant="default" onClick={() => setStep(2)}>
                        Continue
                      </Button>
                    </CardFooter>
                  </Card>
                  </div>
                <div className="text-center mt-8 text-muted-foreground">
                  <p>ReTap is always free for end customers.</p>
                </div>
              </div>
            )}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Info Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <select
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                      >
                        <option value="">Not specified</option>
                        <option value="Mr">Mr</option>
                        <option value="Ms">Ms</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="first_name">First name</Label>
                      <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last name</Label>
                      <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required />
                    </div>
                  </div>
                </div>
                {/* Address Section */}
                <div className="space-y-4">
                  <Label className="font-semibold">Address</Label>
                  <Input id="street_address" name="street_address" value={form.street_address} onChange={handleChange} placeholder="Street and number" required />
                  <Input id="address_extra" name="address_extra" value={form.address_extra} onChange={handleChange} placeholder="Apartment, suite, building code (optional)" />
                  <Input id="address_info" name="address_info" value={form.address_info} onChange={handleChange} placeholder="Other address info" />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="zip_code">ZIP code</Label>
                      <Input id="zip_code" name="zip_code" value={form.zip_code} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" value={form.city} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" name="country" value={form.country} onChange={handleChange} required />
                    </div>
                  </div>
                </div>
                {/* Company Section */}
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
                    <Label htmlFor="is_company">This is a company address</Label>
                  </div>
                  {form.is_company && (
                    <div>
                      <Label htmlFor="company_name">Company name</Label>
                      <Input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} required={form.is_company} />
                    </div>
                  )}
                </div>
                {/* Contact Section */}
                <div className="space-y-2">
                  <Label className="font-semibold">Contact information</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone number</Label>
                      <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Phone number" required />
                    </div>
                  </div>
                </div>
                {/* Payment Method Section */}
                {billingCycle === 'yearly' && (
                  <div className="space-y-4">
                    <Label className="font-semibold">Payment method</Label>
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
                          <div className="text-sm font-medium">Credit card</div>
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
                          <div className="text-sm font-medium">Bank transfer</div>
                        </Label>
                      </div>
                    </RadioGroup>
                    {paymentMethod === 'bank' && (
                      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                        <h4 className="font-semibold">Bank transfer details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Beneficiary:</span>
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
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium">€{bankDetails.amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reason:</span>
                            <span className="font-medium">{bankDetails.reason}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                          Once the transfer is complete, you will receive a confirmation email with your access credentials.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading}
                >
                  {loading ? "Processing..." : paymentMethod === 'bank' ? "Confirm and proceed" : "Continue"}
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
            <DialogTitle className="text-3xl font-bold text-center mb-1">Thank you for your order!</DialogTitle>
            <DialogDescription className="text-center text-base mb-4">
              We have received your subscription request with bank transfer payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <h4 className="font-semibold text-lg mb-2">Next steps</h4>
              <ol className="list-decimal list-inside space-y-1 text-base text-muted-foreground">
                <li>Make the bank transfer using the details provided</li>
                <li>Send the payment receipt to <span className='font-medium text-primary'>payments@retap.com</span> or via WhatsApp</li>
              </ol>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-5 flex flex-col items-center shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-7 h-7 text-green-600" />
                <span className="font-semibold text-green-700 text-lg">Set up your business</span>
              </div>
              <p className="text-center text-green-900 mb-4 text-base">Book your 30-minute onboarding call on WhatsApp: we'll help you configure and use ReTap with ease.</p>
              <a 
                href="https://wa.me/390212345678?text=Hi,%20I%20would%20like%20to%20book%20the%20setup%20call%20for%20ReTap" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-lg font-semibold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 mb-2"
              >
                <MessageCircle className="w-6 h-6" />
                Chat with us on WhatsApp
              </a>
              <span className="text-green-700 font-bold text-base select-all mb-1">+39 02 12345678</span>
            </div>
            <div className="text-center text-sm text-muted-foreground mt-2">
              Your account will be activated within 24 business hours after payment is received.
            </div>
          </div>
          <div className="flex justify-center mt-5">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full h-12 text-base"
            >
              Go to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 