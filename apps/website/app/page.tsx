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
  {
    q: "Can I use ReTap in multiple stores?",
    a: "Yes! Your ReTap card works in all affiliated stores. Earn and redeem points everywhere.",
  },
  {
    q: "How much does it cost for customers?",
    a: "ReTap is always free for end customers. Only merchants pay a subscription.",
  },
  {
    q: "Can I use ReTap with my phone?",
    a: "Yes, you can use the digital pass on your phone or the physical NFC card.",
  },
  {
    q: "How do I contact support?",
    a: "You can contact us anytime at info@retap.com or via WhatsApp.",
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
    <main className={fredoka.className + " antialiased bg-background min-h-screen"}>
        <Navbar />
        {/* Hero Section */}
      <section className="scroll-mt-24 flex items-center justify-center min-h-screen pt-24 pb-12 px-4 bg-background border-b border-border relative" id="home">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between h-full max-w-6xl gap-12 relative z-10">
          {/* Colonna sinistra: testo e bottoni */}
          <div className="w-full md:w-1/2 flex flex-col items-start justify-center text-left">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-textPrimary">
              Your universal loyalty card
            </h1>
            <p className="text-xl text-textSecondary mb-10 max-w-xl">
              One NFC card for all your favorite shops. Earn points everywhere you go with ReTap.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <a 
                href="/auth" 
                className="bg-[#1A1A1A] text-white h-12 px-6 rounded-lg font-medium text-base shadow hover:bg-[#FF3131] transition-colors flex items-center justify-center"
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
                  <path d="M23.472 19.339c-.355-.177-2.104-1.037-2.43-1.155-.326-.118-.563-.177-.8.177-.237.355-.91 1.155-1.117 1.392-.207.237-.414.266-.769.089-.355-.178-1.5-.553-2.86-1.763-1.057-.943-1.771-2.104-1.98-2.459-.207-.355-.022-.546.155-.723.159-.158.355-.414.533-.621.178-.237.237-.355.355-.592.118-.237.06-.444-.03-.621-.089-.177-.8-1.92-1.096-2.63-.289-.695-.583-.601-.8-.612-.207-.009-.444-.011-.681-.011-.237 0-.621.089-.946.444-.325.355-1.24 1.211-1.24 2.955 0 1.744 1.268 3.428 1.445 3.666.178.237 2.5 3.82 6.063 5.215.849.292 1.51.466 2.027.596.851.204 1.627.175 2.24.106.683-.077 2.104-.861 2.402-1.693.296-.832.296-1.544.207-1.693-.089-.148-.325-.237-.68-.414z" fill="currentColor"/>
                </svg>
                Contact us on WhatsApp
              </a>
            </div>
          </div>
          {/* Colonna destra: immagine carta */}
          <div className="w-full md:w-1/2 flex justify-center items-center mt-12 md:mt-0">
            <img src="/retap-card-stack.png" alt="ReTap Card" className="w-full max-w-md h-auto" />
          </div>
        </div>
      </section>

      {/* Titolo e descrizione sopra il video */}
      <section className="w-full flex flex-col items-center justify-center py-12 bg-background">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-textPrimary text-center">What is ReTap?</h2>
        <p className="text-lg text-textSecondary mb-8 max-w-2xl text-center">
          Scopri come funziona ReTap e perché è la soluzione di fidelizzazione più semplice e universale per i tuoi clienti.
        </p>
        <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-lg mb-8">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
        <a 
          href="/auth" 
          className="flex items-center justify-center bg-[#1A1A1A] text-white h-12 px-6 rounded-lg font-medium text-base shadow hover:bg-[#FF3131] transition-colors"
        >
          Try it for free
        </a>
      </section>

      <hr className="border-t border-border w-full" />

      {/* Metrics Bar */}
      <section className="w-full bg-primary py-12 px-2 flex items-center justify-center">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-1">+18%</div>
            <div className="text-xl md:text-2xl font-bold text-white">higher basket size</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-1">3×</div>
            <div className="text-xl md:text-2xl font-bold text-white">faster repeat purchase</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-1">74%</div>
            <div className="text-xl md:text-2xl font-bold text-white">return within 10 days</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-1">96%</div>
            <div className="text-xl md:text-2xl font-bold text-white">coupon redemption</div>
          </div>
        </div>
      </section>

      <hr className="border-t border-border w-full" />

      {/* Features Section (nuova, dopo le metriche) */}
      <section id="features" className="scroll-mt-24 bg-background px-4 py-20">
        <div className="max-w-5xl mx-auto flex flex-col gap-32">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-textPrimary text-center">Why choose ReTap?</h2>
          {/* Blocco 1: immagine sinistra, testo destra */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 flex justify-center">
              <img src="/retapBella.png" alt="ReTap" className="w-full max-w-md rounded-xl shadow-xl" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start justify-center md:pl-8">
              <h3 className="text-2xl md:text-3xl font-bold text-textPrimary mb-4 leading-tight">Old-school loyalty, reimagined for the digital age</h3>
              <p className="text-lg md:text-xl text-textSecondary leading-relaxed">ReTap trasforma la classica card fedeltà in una soluzione digitale universale, semplice e senza app, per fidelizzare i clienti in modo moderno e smart.</p>
            </div>
          </div>
          {/* Blocco 2: testo sinistra, immagine destra */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="w-full md:w-1/2 flex justify-center">
              <img src="/retapBella.png" alt="ReTap dashboard" className="w-full max-w-md rounded-xl shadow-xl" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start justify-center md:pr-8">
              <h3 className="text-2xl md:text-3xl font-bold text-textPrimary mb-4 leading-tight">Full access to customer data & engagement features</h3>
              <p className="text-lg md:text-xl text-textSecondary leading-relaxed">Con ReTap puoi monitorare le attività dei clienti, analizzare i dati aggregati e comunicare in modo diretto, tutto da una dashboard intuitiva.</p>
            </div>
          </div>
          {/* Blocco 3: immagine sinistra, testo destra */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 flex justify-center">
              <img src="/retapBella.png" alt="ReTap analytics" className="w-full max-w-md rounded-xl shadow-xl" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start justify-center md:pl-8">
              <h3 className="text-2xl md:text-3xl font-bold text-textPrimary mb-4 leading-tight">Analytics e risultati in tempo reale</h3>
              <p className="text-lg md:text-xl text-textSecondary leading-relaxed">Visualizza in tempo reale le performance delle tue campagne, scopri quali promozioni funzionano meglio e ottimizza la fidelizzazione dei tuoi clienti.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-t border-border w-full" />

      {/* How it works Section */}
      <section
        id="how-it-works"
        className="scroll-mt-24 flex flex-col items-center justify-center bg-background px-4 py-20 min-h-screen border-b border-border"
      >
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-textPrimary text-center">How it works</h2>
          {/* Carosello stile 3 box visibili come esempio allegato */}
          {(() => {
            const steps = [
              {
                number: 1,
                img: "/retapBella.png",
                title: "Create personalized promotions",
                desc: "Easily create custom promotions in just a few clicks, activating them in real time to engage the right customers at the right moment."
              },
              {
                number: 2,
                img: "/retapBella.png",
                title: "Distribute ReTap cards in-store",
                desc: "Hand out ReTap cards directly in your shop: no app download required for your customers."
              },
              {
                number: 3,
                img: "/retapBella.png",
                title: "Manage points and offers with a tap",
                desc: "Easily credit points and activate offers with a simple tap using the ReTap POS."
              },
              {
                number: 4,
                img: "/retapBella.png",
                title: "Monitor everything from your dashboard",
                desc: "Analyze customer habits, offer redemptions, and customer return rates with a smart dashboard."
              }
            ];
            const [current, setCurrent] = useState(0);
            const prev = (current - 1 + steps.length) % steps.length;
            const next = (current + 1) % steps.length;
            return (
              <div className="relative w-full max-w-7xl flex flex-col items-center justify-center mx-auto" style={{height: 'min(70vw, 440px)'}}>
                {/* Indicatori di progresso */}
                <div className="flex gap-2 mb-8">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrent(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        current === index 
                          ? 'bg-primary w-8' 
                          : 'bg-border hover:bg-textSecondary'
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="relative w-full flex items-center justify-center">
                  {/* Box precedente */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-full sm:w-2/3 lg:w-1/3 px-2 sm:px-4">
                    <div className="bg-background rounded-3xl border border-border overflow-hidden flex flex-col h-[min(55vw,370px)] sm:h-[min(45vw,400px)] lg:h-[380px] opacity-60 transition-all duration-500">
                      <div className="w-full aspect-[16/9] bg-surface overflow-hidden flex items-center justify-center relative">
                        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm">
                          {steps[prev].number}
                        </div>
                        <img src={steps[prev].img} alt={steps[prev].title} className="w-full h-full object-cover rounded-t-3xl" />
                      </div>
                      <div className="flex flex-col items-center px-4 sm:px-6 pb-6 pt-4 flex-1 justify-center">
                        <div className="font-bold text-base sm:text-lg text-textPrimary mb-3 text-center border-b border-border pb-3 w-full">{steps[prev].title}</div>
                        <div className="text-textSecondary text-sm sm:text-base leading-normal text-center max-w-sm">{steps[prev].desc}</div>
                      </div>
                    </div>
                  </div>

                  {/* Box centrale */}
                  <div className="relative z-20 w-full sm:w-2/3 lg:w-1/3 px-2 sm:px-4 flex justify-center">
                    <div className="bg-background rounded-3xl border border-border overflow-hidden flex flex-col h-[min(65vw,440px)] sm:h-[min(55vw,480px)] lg:h-[440px] scale-105 transition-all duration-500 shadow-xl">
                      <div className="w-full aspect-[16/9] bg-surface overflow-hidden flex items-center justify-center relative">
                        <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-lg">
                          {steps[current].number}
                        </div>
                        <img src={steps[current].img} alt={steps[current].title} className="w-full h-full object-cover rounded-t-3xl" />
                      </div>
                      <div className="flex flex-col items-center px-6 sm:px-8 pb-8 pt-6 flex-1 justify-center">
                        <div className="font-bold text-lg sm:text-xl text-textPrimary mb-4 text-center border-b border-border pb-4 w-full">{steps[current].title}</div>
                        <div className="text-textSecondary text-base sm:text-lg leading-normal text-center max-w-md sm:max-w-lg">{steps[current].desc}</div>
                      </div>
                    </div>

                    {/* Frecce floating con hover effect migliorato */}
                    <button
                      onClick={() => setCurrent((prev) => (prev === 0 ? steps.length - 1 : prev - 1))}
                      className="absolute left-[-40px] sm:left-[-48px] top-1/2 -translate-y-1/2 w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-background border-2 border-[#1A1A1A] flex items-center justify-center transition-all duration-300 hover:bg-[#1A1A1A] hover:text-white hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#1A1A1A]/30 z-30 shadow-lg active:outline-none"
                      aria-label="Previous"
                    >
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button
                      onClick={() => setCurrent((prev) => (prev === steps.length - 1 ? 0 : prev + 1))}
                      className="absolute right-[-40px] sm:right-[-48px] top-1/2 -translate-y-1/2 w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-background border-2 border-[#1A1A1A] flex items-center justify-center transition-all duration-300 hover:bg-[#1A1A1A] hover:text-white hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#1A1A1A]/30 z-30 shadow-lg active:outline-none"
                      aria-label="Next"
                    >
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>

                  {/* Box successivo */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-full sm:w-2/3 lg:w-1/3 px-2 sm:px-4">
                    <div className="bg-background rounded-3xl border border-border overflow-hidden flex flex-col h-[min(55vw,370px)] sm:h-[min(45vw,400px)] lg:h-[380px] opacity-60 transition-all duration-500">
                      <div className="w-full aspect-[16/9] bg-surface overflow-hidden flex items-center justify-center relative">
                        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm">
                          {steps[next].number}
                        </div>
                        <img src={steps[next].img} alt={steps[next].title} className="w-full h-full object-cover rounded-t-3xl" />
                      </div>
                      <div className="flex flex-col items-center px-4 sm:px-6 pb-6 pt-4 flex-1 justify-center">
                        <div className="font-bold text-base sm:text-lg text-textPrimary mb-3 text-center border-b border-border pb-3 w-full">{steps[next].title}</div>
                        <div className="text-textSecondary text-sm sm:text-base leading-normal text-center max-w-sm">{steps[next].desc}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      <hr className="border-t border-border w-full" />

      {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-24 flex items-center justify-center min-h-screen bg-surface px-4 py-20 border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-10 text-textPrimary text-center">
              Pricing
            </h2>
            <p className="text-xl text-textSecondary mb-8 text-center">
              One simple, transparent subscription
            </p>
            <div className="flex items-center justify-center gap-4">
              <Label htmlFor="billing-toggle" className="text-lg font-normal text-textPrimary">Monthly</Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="scale-125"
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="billing-toggle" className="text-lg font-normal text-textPrimary">
                  Annual
                </Label>
                {isAnnual && (
                  <div className="bg-[#1A1A1A]/5 text-[#1A1A1A] px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 border border-[#1A1A1A]/10">
                    <span className="font-medium tracking-tight text-[#1A1A1A]/70">Save {(SUBSCRIPTION.monthlyPrice * 12 * SUBSCRIPTION.annualDiscount + SUBSCRIPTION.activationFee).toFixed(0)}€ first year</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Card className="max-w-md w-full border-[#1A1A1A] shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-textPrimary">{SUBSCRIPTION.name}</CardTitle>
                <CardDescription className="text-center text-textSecondary">For all businesses, big and small</CardDescription>
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-5xl font-bold mb-1 text-textPrimary">
                    {isAnnual ? `${annualPrice}€` : `${SUBSCRIPTION.monthlyPrice}€`}
                  </span>
                  <span className="text-textSecondary text-lg">
                    /{isAnnual ? "year" : "month"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {SUBSCRIPTION.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#FF3131]" />
                      <span className="text-sm text-textSecondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-center">
                  <div className="bg-[#28A745]/10 text-[#28A745] text-sm rounded-lg px-4 py-2 mb-4 shadow-sm border border-[#28A745]/20">
                    30-day money-back guarantee. No questions asked.
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/auth" className="w-full">
                  <Button className="w-full h-12 text-base mt-2 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white" variant="default">
                    Activate now
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <div className="text-center mt-8 text-textSecondary">
            <p>ReTap is always free for end customers.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
      <section id="faq" className="scroll-mt-24 flex items-center justify-center min-h-screen px-4 py-20 bg-background">
          <div className="container mx-auto text-center flex flex-col justify-center items-center h-full">
          <h2 className="text-4xl md:text-5xl font-bold mb-10 text-textPrimary text-center">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto w-full">
              {FAQS.map((item, idx) => (
                <div key={idx} className="mb-4 border-b border-border">
                  <button
                    className={`w-full flex justify-between items-center py-4 text-left font-medium text-lg transition-colors ${open === idx ? 'text-primary' : 'text-textPrimary'}`}
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
                    <p className="text-textSecondary pb-4 px-2">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
      <footer className="py-10 bg-surface text-center text-textSecondary text-sm border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-bold text-primary text-lg">ReTap S.r.l.</span>
            <span>VAT IT12345678901</span>
            <span className="text-xs text-textDisabled">&copy; {new Date().getFullYear()} ReTap. All rights reserved.</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-textPrimary">Contacts</span>
            <a href="mailto:info@retap.com" className="hover:text-primary transition-colors">info@retap.com</a>
            <a href="https://wa.me/393331234567" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">
              WhatsApp: +39 333 1234567
            </a>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="text-xs text-textDisabled">ReTap - Loyalty made simple for business</span>
          </div>
          </div>
        </footer>
      </main>
  );
}
