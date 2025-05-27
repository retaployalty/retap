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
      <section className="scroll-mt-24 flex items-center justify-center min-h-screen pt-24 pb-12 px-4 bg-white border-b border-gray-200" id="home">
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
              className="bg-primary text-white h-12 px-6 rounded-lg font-medium text-base shadow hover:bg-[#FF3131] transition-colors flex items-center justify-center"
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
      <section
        id="features"
        className="scroll-mt-24 flex flex-col items-center justify-center bg-gray-50 px-4 pb-20 min-h-screen border-b border-gray-200"
      >
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
              <img src="/retapBella.png" alt="ReTap" className="max-w-full h-auto rounded-lg shadow-lg" />
            </div>
            <div className="w-full md:w-1/2 text-left">
              <h2 className="text-4xl font-bold mb-10 text-gray-900 leading-tight">Why choose ReTap for your business?</h2>
              <div className="flex flex-col gap-8">
                {/* Point 1 */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#ffeaea] rounded-full flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill="#FF3131"/><path d="M7 11.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <div className="font-bold text-xl text-gray-900 mb-2 leading-snug">It's easier to bring back a loyal customer than to acquire a new one</div>
                    <div className="text-gray-700 text-lg leading-normal">ReTap helps you get your customers to return more often.</div>
                  </div>
                </div>
                {/* Point 2 */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#ffeaea] rounded-full flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill="#FF3131"/><path d="M7 11.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <div className="font-bold text-xl text-gray-900 mb-2 leading-snug">Access to aggregated data</div>
                    <div className="text-gray-700 text-lg leading-normal">Understand your customers' behavior with clear, actionable insights.</div>
                  </div>
                </div>
                {/* Point 3 */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#ffeaea] rounded-full flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill="#FF3131"/><path d="M7 11.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <div className="font-bold text-xl text-gray-900 mb-2 leading-snug">Increase average spend</div>
                    <div className="text-gray-700 text-lg leading-normal">Customers come back more often and spend more at each visit.</div>
              </div>
                </div>
                {/* Point 4 */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#ffeaea] rounded-full flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill="#FF3131"/><path d="M7 11.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <div className="font-bold text-xl text-gray-900 mb-2 leading-snug">ReTap ecosystem</div>
                    <div className="text-gray-700 text-lg leading-normal">Customers discover your store and your offers through the web app.</div>
              </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works Section */}
      <section
        id="how-it-works"
        className="scroll-mt-24 flex flex-col items-center justify-center bg-white px-4 py-20 min-h-screen border-b border-gray-200"
      >
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-16 text-gray-900 text-center">How it works</h2>
          {/* Carosello stile 3 box visibili come esempio allegato */}
          {(() => {
            const steps = [
              {
                img: "/retapBella.png",
                title: "Create personalized promotions",
                desc: "Easily create custom promotions in just a few clicks, activating them in real time to engage the right customers at the right moment."
              },
              {
                img: "/retapBella.png",
                title: "Distribute ReTap cards in-store",
                desc: "Hand out ReTap cards directly in your shop: no app download required for your customers."
              },
              {
                img: "/retapBella.png",
                title: "Manage points and offers with a tap",
                desc: "Easily credit points and activate offers with a simple tap using the ReTap POS."
              },
              {
                img: "/retapBella.png",
                title: "Monitor everything from your dashboard",
                desc: "Analyze customer habits, offer redemptions, and customer return rates with a smart dashboard."
              }
            ];
            const [current, setCurrent] = useState(0);
            const prev = (current - 1 + steps.length) % steps.length;
            const next = (current + 1) % steps.length;
            return (
              <div className="relative w-full max-w-7xl flex items-center justify-center mx-auto" style={{height: 'min(70vw, 440px)'}}>
                {/* Box precedente */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-full sm:w-2/3 lg:w-1/3 px-2 sm:px-4">
                  <div className="bg-white rounded-3xl border border-gray-300 overflow-hidden flex flex-col h-[min(55vw,370px)] sm:h-[min(45vw,400px)] lg:h-[380px] opacity-60 transition-all duration-500">
                    <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden flex items-center justify-center">
                      <img src={steps[prev].img} alt={steps[prev].title} className="w-full h-full object-cover rounded-t-3xl" />
                    </div>
                    <div className="flex flex-col items-center px-4 sm:px-6 pb-6 pt-4 flex-1 justify-center">
                      <div className="font-bold text-base sm:text-lg text-gray-900 mb-1 text-center">{steps[prev].title}</div>
                      <div className="text-gray-700 text-sm sm:text-base leading-normal text-center max-w-sm">{steps[prev].desc}</div>
                    </div>
                  </div>
                </div>
                {/* Box centrale */}
                <div className="relative z-20 w-full sm:w-2/3 lg:w-1/3 px-2 sm:px-4 flex justify-center">
                  <div className="bg-white rounded-3xl border border-gray-300 overflow-hidden flex flex-col h-[min(65vw,440px)] sm:h-[min(55vw,480px)] lg:h-[440px] scale-105 transition-all duration-500">
                    <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden flex items-center justify-center">
                      <img src={steps[current].img} alt={steps[current].title} className="w-full h-full object-cover rounded-t-3xl" />
                    </div>
                    <div className="flex flex-col items-center px-6 sm:px-8 pb-8 pt-6 flex-1 justify-center">
                      <div className="font-bold text-lg sm:text-xl text-gray-900 mb-2 sm:mb-3 text-center">{steps[current].title}</div>
                      <div className="text-gray-700 text-base sm:text-lg leading-normal text-center max-w-md sm:max-w-lg">{steps[current].desc}</div>
                    </div>
                  </div>
                  {/* Frecce floating */}
                  <button
                    onClick={() => setCurrent((prev) => (prev === 0 ? steps.length - 1 : prev - 1))}
                    className="absolute left-[-40px] sm:left-[-48px] top-1/2 -translate-y-1/2 w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-white border-2 border-primary flex items-center justify-center transition hover:bg-primary hover:text-white focus:outline-none focus:ring-4 focus:ring-primary/30 z-30"
                    aria-label="Previous"
                  >
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button
                    onClick={() => setCurrent((prev) => (prev === steps.length - 1 ? 0 : prev + 1))}
                    className="absolute right-[-40px] sm:right-[-48px] top-1/2 -translate-y-1/2 w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-white border-2 border-primary flex items-center justify-center transition hover:bg-primary hover:text-white focus:outline-none focus:ring-4 focus:ring-primary/30 z-30"
                    aria-label="Next"
                  >
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                {/* Box successivo */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-full sm:w-2/3 lg:w-1/3 px-2 sm:px-4">
                  <div className="bg-white rounded-3xl border border-gray-300 overflow-hidden flex flex-col h-[min(55vw,370px)] sm:h-[min(45vw,400px)] lg:h-[380px] opacity-60 transition-all duration-500">
                    <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden flex items-center justify-center">
                      <img src={steps[next].img} alt={steps[next].title} className="w-full h-full object-cover rounded-t-3xl" />
                    </div>
                    <div className="flex flex-col items-center px-4 sm:px-6 pb-6 pt-4 flex-1 justify-center">
                      <div className="font-bold text-base sm:text-lg text-gray-900 mb-1 text-center">{steps[next].title}</div>
                      <div className="text-gray-700 text-sm sm:text-base leading-normal text-center max-w-sm">{steps[next].desc}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

        {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-24 flex items-center justify-center min-h-screen bg-white px-4 py-20 border-b border-gray-200">
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
      <section id="faq" className="scroll-mt-24 flex items-center justify-center min-h-screen px-4 py-20 bg-gray-50">
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
