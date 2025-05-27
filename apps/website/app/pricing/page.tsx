"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const plans = {
  BASIC: {
    name: "BASIC",
    monthlyPrice: "€49",
    annualPrice: "€470",
    description: "Perfetto per piccole attività",
    features: [
      "100 carte/mese",
      "Visibilità standard",
      "Supporto email",
      "Dashboard base"
    ],
    highlight: "€74 il primo mese (attivazione)",
    buttonText: "Scegli BASIC",
    popular: false
  },
  INTERMEDIATE: {
    name: "INTERMEDIATE",
    monthlyPrice: "€69",
    annualPrice: "€662",
    description: "Ideale per attività in crescita",
    features: [
      "Fino a 400 carte/mese",
      "Posizione più alta",
      "Supporto prioritario",
      "Dashboard avanzata",
      "Statistiche dettagliate"
    ],
    highlight: null,
    buttonText: "Scegli INTERMEDIATE",
    popular: true
  },
  PRO: {
    name: "PRO",
    monthlyPrice: "€99",
    annualPrice: "€950",
    description: "Per attività consolidate",
    features: [
      "Fino a 1000 carte/mese",
      "Primo nella lista nella zona",
      "Supporto dedicato",
      "Dashboard completa",
      "Statistiche avanzate",
      "API access"
    ],
    highlight: null,
    buttonText: "Scegli PRO",
    popular: false
  }
};

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Select the perfect plan for your business
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Label htmlFor="billing-toggle" className="text-sm font-medium">Monthly</Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="billing-toggle" className="text-sm font-medium">
              Annual
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </Label>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {Object.entries(plans).map(([key, plan]) => (
            <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                {plan.popular && (
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Più Popolare
                  </div>
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">
                    /{isAnnual ? "anno" : "mese"}
                  </span>
                </div>
                {plan.highlight && !isAnnual && (
                  <p className="text-sm text-muted-foreground mt-2">{plan.highlight}</p>
                )}
                {isAnnual && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {Math.round(parseFloat(plan.monthlyPrice.replace('€', '')) * 12 * 0.8)}€/anno (20% sconto)
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={`/checkout?plan=${key}&billing=${isAnnual ? 'annual' : 'monthly'}`} className="w-full">
                  <Button className="w-full hover:bg-[#FF3131]" variant={plan.popular ? "default" : "outline"}>
                    {plan.buttonText}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 