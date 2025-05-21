"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CreditCard, Building2, MapPin, Mail, User, Banknote } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const plans = {
  BASIC: {
    name: "BASIC",
    monthlyPrice: "€74",
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
    country: "it"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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

  const getPrice = () => {
    if (isAnnual) {
      return selectedPlan.annualPrice;
    }
    return selectedPlan.monthlyPrice;
  };

  const getDescription = () => {
    if (isAnnual) {
      return selectedPlan.annualDescription;
    }
    return selectedPlan.description;
  };

  const calculateVAT = (price: string) => {
    return (parseFloat(price.replace('€', '')) * 0.22).toFixed(2);
  };

  const getTotal = (price: string) => {
    return (parseFloat(price.replace('€', '')) * 1.22).toFixed(2);
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
                          <SelectItem value="it">Italia</SelectItem>
                          <SelectItem value="ch">Svizzera</SelectItem>
                          <SelectItem value="at">Austria</SelectItem>
                          <SelectItem value="fr">Francia</SelectItem>
                          <SelectItem value="de">Germania</SelectItem>
                          <SelectItem value="es">Spagna</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="border-none shadow-lg">
                  <CardHeader className="border-b bg-muted/50">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <CardTitle>Metodo di Pagamento</CardTitle>
                    </div>
                    <CardDescription>Scegli come vuoi pagare</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-4">
                      <div className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="card" id="card" />
                        <div className="flex-1">
                          <Label htmlFor="card" className="text-base font-medium">Carta di Credito</Label>
                          <p className="text-sm text-muted-foreground">Paga con Visa, Mastercard o American Express</p>
                        </div>
                        <CreditCard className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="bank" id="bank" />
                        <div className="flex-1">
                          <Label htmlFor="bank" className="text-base font-medium">Bonifico Bancario</Label>
                          <p className="text-sm text-muted-foreground">Paga tramite bonifico bancario</p>
                        </div>
                        <Banknote className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </RadioGroup>

                    {paymentMethod === "bank" && (
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">
                          Riceverai i nostri dati bancari dopo la conferma dell'ordine.
                        </p>
                      </div>
                    )}
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
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Subtotale</p>
                        <p>{getPrice()}</p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">IVA (22%)</p>
                        <p>{calculateVAT(getPrice())}€</p>
                      </div>
                      <div className="flex justify-between items-center font-bold text-lg pt-2 border-t">
                        <p>Totale</p>
                        <p>{getTotal(getPrice())}€</p>
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
    </div>
  );
} 