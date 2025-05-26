"use client";
import { Navbar } from "./components/Navbar";
import { useState } from "react";
import { Fredoka } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-fredoka",
  display: "swap"
});

const FAQS = [
  {
    q: "Do I need to download an app?",
    a: "No app needed. Just use your NFC card or digital pass.",
  },
  {
    q: "What if I lose my card?",
    a: "You can get a new card at any partner store and transfer your points.",
  },
  {
    q: "How do I check my points?",
    a: "Scan your card online or in-store to see your balance and rewards.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Your data is protected and only visible to you and the store where you use your card.",
  },
];

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

export default function Home() {
  const [open, setOpen] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const annualPrice = Math.round(SUBSCRIPTION.monthlyPrice * 12 * (1 - SUBSCRIPTION.annualDiscount));
  return (
    <main className={fredoka.className + " antialiased bg-gray-50 min-h-screen"}>
      <Navbar />
      {/* Hero Section */}
      <section className="flex items-center justify-center min-h-screen pt-24 pb-12 px-4 bg-white border-b border-gray-200" id="home">
        <div className="container mx-auto text-center flex flex-col justify-center items-center h-full max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
            Your universal loyalty card
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            One NFC card for all your favorite shops. Earn points everywhere you go with ReTap.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto">
            <a 
              href="/auth" 
              className="bg-primary text-white h-12 px-6 rounded-lg font-medium text-base shadow hover:bg-primary/90 transition-colors flex items-center justify-center"
              style={{ minWidth: 0 }}
            >
              Get Started
            </a>
            <a 
              href="https://wa.me/393331234567" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-12 px-6 rounded-lg font-medium text-base bg-[#25D366] text-white shadow hover:bg-[#1ebe5d] transition-colors"
              style={{ minWidth: 0 }}
            >
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#25D366"/>
                <path d="M23.472 19.339c-.355-.177-2.104-1.037-2.43-1.155-.326-.118-.563-.177-.8.177-.237.355-.91 1.155-1.117 1.392-.207.237-.414.266-.769.089-.355-.178-1.5-.553-2.86-1.763-1.057-.943-1.771-2.104-1.98-2.459-.207-.355-.022-.546.155-.723.159-.158.355-.414.533-.621.178-.237.237-.355.355-.592.118-.237.06-.444-.03-.621-.089-.177-.8-1.92-1.096-2.63-.289-.695-.583-.601-.8-.612-.207-.009-.444-.011-.681-.011-.237 0-.621.089-.946.444-.325.355-1.24 1.211-1.24 2.955 0 1.744 1.268 3.428 1.445 3.666.178.237 2.5 3.82 6.063 5.215.849.292 1.51.466 2.027.596.851.204 1.627.175 2.24.106.683-.077 2.104-.861 2.402-1.693.296-.832.296-1.544.207-1.693-.089-.148-.325-.237-.68-.414z" fill="white"/>
              </svg>
              Contact us on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-16 border-b border-gray-200">
        <div className="container mx-auto text-center flex flex-col justify-center items-center h-full">
          <h2 className="text-3xl font-bold mb-12 text-gray-900">Why choose ReTap?</h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl shadow-md p-10 flex flex-col items-center border border-gray-100 hover:shadow-lg transition-transform hover:scale-[1.03]">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-gray-100">
                <img src="/globe.svg" alt="All stores" className="w-12 h-12" />
              </div>
              <h3 className="font-bold text-2xl mb-2 text-gray-900">One card, all stores</h3>
              <p className="text-lg mb-2 text-gray-700">
                No more dozens of loyalty cards. Use ReTap everywhere and keep all your points in one place.
              </p>
              <ul className="text-gray-500 text-base mt-2 space-y-1 text-left">
                <li>• Works in every partner shop</li>
                <li>• No registration needed</li>
                <li>• Always with you, physical or digital</li>
              </ul>
            </div>
            {/* Feature 2 */}
            <div className="bg-white rounded-2xl shadow-md p-10 flex flex-col items-center border border-gray-100 hover:shadow-lg transition-transform hover:scale-[1.03]">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-gray-100">
                <img src="/window.svg" alt="NFC & Wallet" className="w-12 h-12" />
              </div>
              <h3 className="font-bold text-2xl mb-2 text-gray-900">NFC & Wallet ready</h3>
              <p className="text-lg mb-2 text-gray-700">
                Use a physical NFC card or add ReTap to your smartphone wallet. Tap and earn points instantly.
              </p>
              <ul className="text-gray-500 text-base mt-2 space-y-1 text-left">
                <li>• Tap to collect points</li>
                <li>• Apple Wallet & Google Wallet</li>
                <li>• Fast, secure, contactless</li>
              </ul>
            </div>
            {/* Feature 3 */}
            <div className="bg-white rounded-2xl shadow-md p-10 flex flex-col items-center border border-gray-100 hover:shadow-lg transition-transform hover:scale-[1.03]">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-gray-100">
                <img src="/file.svg" alt="Privacy" className="w-12 h-12" />
              </div>
              <h3 className="font-bold text-2xl mb-2 text-gray-900">Privacy first</h3>
              <p className="text-lg mb-2 text-gray-700">
                No app required. Your data is safe and only you can see your points and rewards.
              </p>
              <ul className="text-gray-500 text-base mt-2 space-y-1 text-left">
                <li>• No tracking, no spam</li>
                <li>• You control your data</li>
                <li>• GDPR compliant</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="flex items-center justify-center min-h-screen px-4 py-16 bg-white border-b border-gray-200">
        <div className="container mx-auto text-center flex flex-col justify-center items-center h-full">
          <h2 className="text-3xl font-bold mb-12 text-gray-900">How it works</h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="bg-gray-50 rounded-2xl shadow p-10 flex flex-col items-center border border-gray-100 hover:shadow-md transition-transform hover:scale-[1.02]">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-white border border-gray-200">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#FF6565"/></svg>
              </div>
              <h4 className="font-bold text-2xl mb-2 text-gray-900">Get your ReTap card</h4>
              <p className="text-lg mb-2 text-gray-700">
                Pick up your NFC card or digital pass at any partner store.
              </p>
              <ul className="text-gray-500 text-base mt-2 space-y-1 text-left">
                <li>• Physical or digital</li>
                <li>• Instantly ready to use</li>
                <li>• No paperwork</li>
              </ul>
            </div>
            {/* Step 2 */}
            <div className="bg-gray-50 rounded-2xl shadow p-10 flex flex-col items-center border border-gray-100 hover:shadow-md transition-transform hover:scale-[1.02]">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-white border border-gray-200">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 20H7V3h10v18zm-5-3c-1.1 0-2-.9-2-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8c0 1.1-.9 2-2 2v-2h2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" fill="#FF6565"/></svg>
              </div>
              <h4 className="font-bold text-2xl mb-2 text-gray-900">Tap & collect points</h4>
              <p className="text-lg mb-2 text-gray-700">
                Tap your card at checkout and earn points instantly.
              </p>
              <ul className="text-gray-500 text-base mt-2 space-y-1 text-left">
                <li>• Contactless NFC</li>
                <li>• Earn points in seconds</li>
                <li>• Works in every partner shop</li>
              </ul>
            </div>
            {/* Step 3 */}
            <div className="bg-gray-50 rounded-2xl shadow p-10 flex flex-col items-center border border-gray-100 hover:shadow-md transition-transform hover:scale-[1.02]">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-white border border-gray-200">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6zm8-3c0-4.42-3.58-8-8-8S4 7.58 4 12s3.58 8 8 8 8-3.58 8-8zm-2 0c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6 6 2.69 6 6z" fill="#FF6565"/></svg>
              </div>
              <h4 className="font-bold text-2xl mb-2 text-gray-900">Check your rewards</h4>
              <p className="text-lg mb-2 text-gray-700">
                See your points and rewards online or in-store, anytime.
              </p>
              <ul className="text-gray-500 text-base mt-2 space-y-1 text-left">
                <li>• Scan your card</li>
                <li>• Check balance in real time</li>
                <li>• Redeem rewards easily</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="flex items-center justify-center min-h-screen bg-white px-4 py-20 border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 text-gray-900">
              Pricing
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              One simple, transparent subscription
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
              </Label>
            </div>
          </div>
          <div className="flex justify-center">
            <Card className="max-w-md w-full border-primary shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center">{SUBSCRIPTION.name}</CardTitle>
                <CardDescription className="text-center">For all businesses, big and small</CardDescription>
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-5xl font-bold mb-1">
                    {isAnnual ? `${annualPrice}€` : `${SUBSCRIPTION.monthlyPrice}€`}
                  </span>
                  <span className="text-muted-foreground text-lg">
                    /{isAnnual ? "year" : "month"}
                  </span>
                </div>
                {!isAnnual && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    + {SUBSCRIPTION.activationFee}€ one-time activation fee
                  </p>
                )}
                {isAnnual && (
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
                  <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-2 mb-4 shadow-sm border border-green-200">
                    30-day money-back guarantee. No questions asked.
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/auth" className="w-full">
                  <Button className="w-full h-12 text-base mt-2" variant="default">
                    Activate now
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <div className="text-center mt-8 text-muted-foreground">
            <p>ReTap is always free for end customers.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="flex items-center justify-center min-h-screen px-4 py-20 bg-gray-50">
        <div className="container mx-auto text-center flex flex-col justify-center items-center h-full">
          <h2 className="text-3xl font-bold mb-10 text-gray-900">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto w-full">
            {FAQS.map((item, idx) => (
              <div key={idx} className="mb-4 border-b border-gray-200">
                <button
                  className={`w-full flex justify-between items-center py-4 text-left font-medium text-lg transition-colors ${open === idx ? 'text-primary' : 'text-gray-800'}`}
                  onClick={() => setOpen(open === idx ? null : idx)}
                  aria-expanded={open === idx}
                  aria-controls={`faq-content-${idx}`}
                >
                  <span>{item.q}</span>
                  <svg className={`w-5 h-5 ml-2 transition-transform ${open === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div
                  id={`faq-content-${idx}`}
                  className={`overflow-hidden transition-all duration-300 ${open === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-gray-600 pb-4 px-2">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white text-center text-gray-500 text-sm border-t border-gray-200">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-bold text-primary text-lg">ReTap S.r.l.</span>
            <span>VAT IT12345678901</span>
            <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()} ReTap. All rights reserved.</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold">Contacts</span>
            <a href="mailto:info@retap.com" className="hover:underline text-gray-700">info@retap.com</a>
            <a href="https://wa.me/393331234567" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#25D366]">
              WhatsApp: +39 333 1234567
            </a>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <a href="#" className="hover:underline text-gray-700">Privacy Policy</a>
            <span className="text-xs text-gray-400">ReTap - Loyalty made simple for business</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
