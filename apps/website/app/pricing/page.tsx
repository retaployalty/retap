"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Base",
    price: "€49",
    description: "Perfect for small businesses",
    features: [
      "100 carte/mese",
      "Visibilità standard",
      "Supporto email",
      "Dashboard base"
    ],
    highlight: "€74 il primo mese (attivazione)",
    buttonText: "Start with Base",
    popular: false
  },
  {
    name: "Premium",
    price: "€69",
    description: "Best for growing businesses",
    features: [
      "Fino a 400 carte/mese",
      "Posizione più alta",
      "Supporto prioritario",
      "Dashboard avanzata",
      "Statistiche dettagliate"
    ],
    highlight: null,
    buttonText: "Get Premium",
    popular: true
  },
  {
    name: "Top",
    price: "€99",
    description: "For established businesses",
    features: [
      "Fino a 1000 carte/mese",
      "Primo nella lista nella zona",
      "Supporto dedicato",
      "Dashboard completa",
      "Statistiche avanzate",
      "API access"
    ],
    highlight: null,
    buttonText: "Go Top",
    popular: false
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Select the perfect plan for your business
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                {plan.popular && (
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Most Popular
                  </div>
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mese</span>
                </div>
                {plan.highlight && (
                  <p className="text-sm text-muted-foreground mt-2">{plan.highlight}</p>
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
                <Link href={`/checkout?plan=${plan.name.toLowerCase()}`} className="w-full">
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
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