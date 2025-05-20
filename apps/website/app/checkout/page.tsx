"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CreditCard, Building2, MapPin, Mail, User, Banknote } from "lucide-react";
import Link from "next/link";

const plans = {
  base: {
    name: "Base",
    price: "€74",
    description: "First month (activation), then €49/month",
    features: ["100 carte/mese", "Visibilità standard"]
  },
  premium: {
    name: "Premium",
    price: "€69",
    description: "Monthly subscription",
    features: ["Fino a 400 carte/mese", "Posizione più alta"]
  },
  top: {
    name: "Top",
    price: "€99",
    description: "Monthly subscription",
    features: ["Fino a 1000 carte/mese", "Primo nella lista nella zona"]
  }
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "base";
  const selectedPlan = plans[plan as keyof typeof plans];

  const [paymentMethod, setPaymentMethod] = useState("card");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/pricing" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to pricing
        </Link>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Complete Your Subscription
            </h1>
            <p className="text-xl text-muted-foreground">
              You're just a few steps away from {selectedPlan.name}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Billing Details */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <CardTitle>Billing Details</CardTitle>
                  </div>
                  <CardDescription>Enter your business information</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input id="firstName" className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input id="lastName" className="pl-10" required />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input id="email" type="email" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input id="company" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input id="address" className="pl-10" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input id="city" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
                      <Input id="postalCode" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">Italy</SelectItem>
                        <SelectItem value="ch">Switzerland</SelectItem>
                        <SelectItem value="at">Austria</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="es">Spain</SelectItem>
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
                    <CardTitle>Payment Method</CardTitle>
                  </div>
                  <CardDescription>Choose how you want to pay</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-4">
                    <div className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="card" id="card" />
                      <div className="flex-1">
                        <Label htmlFor="card" className="text-base font-medium">Credit Card</Label>
                        <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard, or American Express</p>
                      </div>
                      <CreditCard className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="bank" id="bank" />
                      <div className="flex-1">
                        <Label htmlFor="bank" className="text-base font-medium">Bank Transfer</Label>
                        <p className="text-sm text-muted-foreground">Pay via bank transfer</p>
                      </div>
                      <Banknote className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </RadioGroup>

                  {paymentMethod === "card" && (
                    <div className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber" className="text-sm font-medium">Card Number</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input id="cardNumber" className="pl-10" placeholder="1234 5678 9012 3456" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="expiry" className="text-sm font-medium">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc" className="text-sm font-medium">CVC</Label>
                          <Input id="cvc" placeholder="123" required />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "bank" && (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground">
                        You will receive our bank details after confirming your order.
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
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{selectedPlan.name} Plan</p>
                        <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                      </div>
                      <p className="font-bold text-lg">{selectedPlan.price}</p>
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
                      <p className="text-muted-foreground">Subtotal</p>
                      <p>{selectedPlan.price}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-muted-foreground">VAT (22%)</p>
                      <p>{(parseFloat(selectedPlan.price.replace('€', '')) * 0.22).toFixed(2)}€</p>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg pt-2 border-t">
                      <p>Total</p>
                      <p>{(parseFloat(selectedPlan.price.replace('€', '')) * 1.22).toFixed(2)}€</p>
                    </div>
                  </div>
                  <Button className="w-full" size="lg">
                    Complete Payment
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    By completing your purchase you agree to our Terms of Service
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 