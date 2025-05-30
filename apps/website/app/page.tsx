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
      <section className="scroll-mt-24 flex items-center justify-center min-h-screen pt-24 pb-12 px-4 bg-background border-b border-border relative overflow-hidden" id="home">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center h-full max-w-7xl gap-16 relative z-10">
          {/* Colonna sinistra: testo e bottoni */}
          <div className="w-full md:w-1/2 flex flex-col items-start justify-center text-left md:pr-8">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 text-textPrimary leading-tight" style={{lineHeight: '1.1'}}>
              Your universal<br />
              <span className="bg-[#f8494c] text-white px-4 rounded-lg">loyalty card</span>
            </h1>
            <p className="text-2xl md:text-3xl text-textSecondary mb-10 max-w-xl leading-snug">
              One NFC card for all your favorite shops. Earn points everywhere you go with ReTap.
            </p>
            <a 
              href="/auth" 
              className="bg-[#1A1A1A] text-white h-16 px-10 rounded-xl font-bold text-xl shadow hover:bg-[#FF3131] transition-colors flex items-center justify-center mt-2"
              style={{ minWidth: 0 }}
            >
              Get Started
            </a>
          </div>
          {/* Colonna destra: immagine carta */}
          <div className="w-full md:w-1/2 flex justify-center items-center mt-12 md:mt-0">
            <img src="/retapG1.png" alt="ReTap Card" className="w-full max-w-3xl h-auto drop-shadow-xl" />
          </div>
        </div>
      </section>

      {/* Titolo e descrizione sopra il video */}
      <section className="w-full flex flex-col items-center justify-center py-24 bg-gray-50">
        <h2 className="text-4xl md:text-6xl font-bold mb-4 text-textPrimary text-center">What is ReTap?</h2>
        <p className="text-xl md:text-2xl text-textSecondary mb-12 max-w-3xl text-center">
          Find out how ReTap works and why it is the simplest and most universal loyalty solution for your customers.
        </p>
        <div className="w-full max-w-7xl flex flex-col md:flex-row items-stretch justify-center gap-8 mt-8">
          {/* Colonna 1 */}
          <div className="flex flex-col items-center w-full md:w-1/3 px-4">
            <div className="h-48 flex items-center justify-center mb-6">
              <img src="/retap-card-stack.png" alt="Your Loyalty Card" className="w-48 h-auto" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-textPrimary mb-3 text-center whitespace-nowrap">Universal Loyalty Card</h3>
            <p className="text-lg text-textSecondary text-center h-16">One NFC card for all your stores—no app needed, just tap and earn.</p>
          </div>
          {/* Freccia 1 */}
          <div className="hidden md:flex items-center justify-center w-16">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 36H60M48 24L60 36L48 48" stroke="#FF3131" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Colonna 2 */}
          <div className="flex flex-col items-center w-full md:w-1/3 px-4">
            <div className="h-48 flex items-center justify-center mb-6">
              <img src="/retapG4.png" alt="Custom Offers in Clicks" className="w-48 h-auto" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-textPrimary mb-3 text-center whitespace-nowrap">Instant Promotions</h3>
            <p className="text-lg text-textSecondary text-center h-16">Create tailored promotions in minutes, no tech skills required.</p>
          </div>
          {/* Freccia 2 */}
          <div className="hidden md:flex items-center justify-center w-16">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 36H60M48 24L60 36L48 48" stroke="#FF3131" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Colonna 3 */}
          <div className="flex flex-col items-center w-full md:w-1/3 px-4">
            <div className="h-48 flex items-center justify-center mb-6">
              <img src="/retapG5.png" alt="More Returning Customers" className="w-48 h-auto" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-textPrimary mb-3 text-center whitespace-nowrap">Customer Retention</h3>
            <p className="text-lg text-textSecondary text-center h-16">Retain your clients and attract new ones through the ReTap network.</p>
          </div>
        </div>
      </section>

      <hr className="border-t border-border w-full" />

      {/* Features Section (nuova, dopo le metriche) */}
      <section id="features" className="scroll-mt-24 bg-background px-4 py-32">
        <div className="max-w-7xl mx-auto flex flex-col gap-24">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-textPrimary text-center">Why choose ReTap?</h2>
          {/* Block 1: image left, text right */}
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2 flex justify-center items-center">
              <img 
                src="/retapG1.png" 
                alt="ReTap card" 
                className="w-full max-w-xl" 
                style={{background: 'none', boxShadow: 'none'}} 
              />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start justify-center md:pl-12">
              <h3 className="text-3xl md:text-4xl font-bold text-textPrimary leading-tight mb-6">Boost retention and increase revenue</h3>
              <p className="text-xl md:text-2xl text-textSecondary leading-relaxed">ReTap helps your business bring customers back more often, increasing average basket size and lifetime value. Our universal loyalty card works across all your locations—no app required, no barriers for your clients.</p>
            </div>
          </div>
          {/* Block 2: text left, image right */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="w-full md:w-1/2 flex justify-center items-center">
              <img 
                src="/retapG2.png" 
                alt="ReTap dashboard" 
                className="w-full max-w-xl" 
                style={{background: 'none', boxShadow: 'none'}} 
              />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start justify-center md:pr-12">
              <h3 className="text-3xl md:text-4xl font-bold text-textPrimary leading-tight mb-6">Data-driven decisions, full control</h3>
              <p className="text-xl md:text-2xl text-textSecondary leading-relaxed">Access real-time analytics and aggregated customer data to understand buying habits, optimize campaigns, and measure ROI. Manage everything from a single, intuitive dashboard designed for business needs.</p>
            </div>
          </div>
          {/* Block 3: image left, text right */}
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2 flex justify-center items-center">
              <img 
                src="/retapG3.png" 
                alt="ReTap analytics" 
                className="w-full max-w-xl" 
                style={{background: 'none', boxShadow: 'none'}} 
              />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start justify-center md:pl-12">
              <h3 className="text-3xl md:text-4xl font-bold text-textPrimary leading-tight mb-6">Fully customizable offers for your customers</h3>
              <p className="text-xl md:text-2xl text-textSecondary leading-relaxed">Create and manage personalized promotions, rewards, and loyalty campaigns tailored to your business goals. With ReTap, you have the flexibility to engage every customer segment with the right offer at the right time—no technical skills required.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-t border-border w-full" />

      {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-24 flex items-center justify-center min-h-screen bg-gray-50 px-4 py-20 border-b border-border relative overflow-hidden">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-10 text-textPrimary text-center">
              Pricing
            </h2>
            <p className="text-xl text-textSecondary mb-8 text-center">
              One simple, transparent subscription
            </p>
            <div className="flex items-center justify-center gap-4 relative">
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
                <div className={`absolute top-8 left-1/2 -translate-x-1/2 transition-all duration-300 ${isAnnual ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                  <div className="bg-[#1A1A1A]/5 text-[#1A1A1A] px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 border border-[#1A1A1A]/10 whitespace-nowrap">
                    <span className="font-medium tracking-tight text-[#1A1A1A]/70">Save {(SUBSCRIPTION.monthlyPrice * 12 * SUBSCRIPTION.annualDiscount + SUBSCRIPTION.activationFee).toFixed(0)}€ first year</span>
                  </div>
                </div>
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
            <a href="https://wa.me/393331234567" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">WhatsApp: +39 333 1234567</a>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="text-xs text-textDisabled">ReTap - Loyalty made simple for business</span>
          </div>
          </div>
        </footer>

        {/* Bottone WhatsApp fisso in basso a destra */}
        <a
          href="https://wa.me/393331234567"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#1ebe5d] rounded-full shadow-lg w-16 h-16 flex items-center justify-center transition-colors"
          aria-label="Contact us on WhatsApp"
        >
          <img src="/WhatsApp.webp" alt="WhatsApp" className="w-10 h-10" />
        </a>
      </main>
  );
}
