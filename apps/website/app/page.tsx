"use client";
import { Navbar } from "./components/Navbar";
import { useState } from "react";
import { Fredoka } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, ArrowDown } from "lucide-react";
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
    a: "No, there's no need to download anything. ReTap works through a web app—accessible instantly via your browser.",
  },
  {
    q: "What if I lose my card?",
    a: "You can get a new card at any partner store and transfer your points.",
  },
  {
    q: "How do I check my points?",
    a: "You can check your points anytime through the ReTap web app—no installation needed.",
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
    a: "You can contact us anytime at info@retapcard.com or via WhatsApp.",
  },
  {
    q: "Can I use the points earned in one store at another?",
    a: "No, points can only be redeemed at the store where they were earned. Each business has its own rewards system within ReTap.",
  },
];

const SUBSCRIPTION = {
  name: "SINGLE SUBSCRIPTION",
  monthlyPrice: 49,
  activationFee: 99, // Fee di attivazione solo per abbonamento mensile
  annualDiscount: 0.10, // 10%
  features: [
    "POS device included",
    "Up to 100 physical cards/month",
    "Full dashboard",
    "Advanced statistics",
    "Early access to new features"
  ]
};

export default function Home() {
  const [open, setOpen] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const annualPrice = Math.round(SUBSCRIPTION.monthlyPrice * 12 * (1 - SUBSCRIPTION.annualDiscount));

  const scrollToWhatIsRetap = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const whatIsRetapSection = document.querySelector('section:nth-of-type(2)');
    if (whatIsRetapSection) {
      const navbarHeight = 80; // altezza approssimativa della navbar
      const sectionPosition = whatIsRetapSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
      
      window.scrollTo({
        top: sectionPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <main className={fredoka.className + " antialiased bg-background min-h-screen"}>
        <Navbar />
        {/* Hero Section */}
      <section className="scroll-mt-24 flex items-center justify-center min-h-screen pt-24 sm:pt-28 pb-8 sm:pb-12 px-4 bg-background border-b border-border relative overflow-hidden" id="home">
        <div className="container mx-auto flex flex-col lg:flex-row items-center justify-center h-full max-w-7xl gap-8 lg:gap-16 relative z-10">
          {/* Colonna sinistra: testo e bottoni */}
          <div className="w-full lg:w-1/2 flex flex-col items-start justify-center text-left lg:pr-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-4 sm:mb-6 text-textPrimary leading-tight text-left" style={{lineHeight: '1.1'}}>
              The only<br />
              <span className="bg-[#f8494c] text-white px-2 sm:px-4 rounded-lg inline-block whitespace-nowrap" style={{display:'inline'}}>loyalty card</span><br />
              <span className="whitespace-nowrap">your business needs</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-textSecondary mb-6 sm:mb-8 max-w-xl leading-snug">
              Attract new customers and retain current ones through promotions. Full refund if you change your mind.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-10 w-full">
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-bold text-[#f8494c]">50+</span>
                <span className="text-xs sm:text-sm text-textSecondary">Businesses onboard</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-bold text-[#f8494c]">50,000+</span>
                <span className="text-xs sm:text-sm text-textSecondary">Happy customers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-bold text-[#f8494c]">1M+</span>
                <span className="text-xs sm:text-sm text-textSecondary">Rewards redeemed</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <a 
                href="/auth" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1A1A1A] text-white h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-10 rounded-xl font-bold text-base sm:text-lg lg:text-xl shadow hover:bg-[#FF3131] transition-colors flex items-center justify-center gap-2 group"
                style={{ minWidth: 0 }}
              >
                Start Now
              </a>
              <a 
                href="#what-is-retap" 
                onClick={scrollToWhatIsRetap}
                className="h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-10 rounded-xl font-bold text-base sm:text-lg lg:text-xl border-2 border-[#1A1A1A] hover:border-[#FF3131] hover:text-[#FF3131] transition-colors flex items-center justify-center gap-2 group"
                style={{ minWidth: 0 }}
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Colonna destra: immagine carta con animazione */}
          <div className="w-full lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
            <div className="relative">
              <img 
                src="/retapG1.png" 
                alt="ReTap Card" 
                className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-3xl h-auto drop-shadow-xl relative" 
              />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-textSecondary" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>

      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>

      {/* Titolo e descrizione sopra il video */}
      <section className="w-full flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 bg-white px-4" id="how-it-works">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 text-textPrimary text-center">How ReTap works</h2>
        <p className="text-lg sm:text-xl md:text-2xl text-textSecondary mb-8 sm:mb-12 max-w-3xl text-center px-4">
          Discover how ReTap helps you increase customer retention and boost sales with one universal, hassle-free loyalty system.
        </p>
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-stretch justify-center gap-8 lg:gap-8 mt-8 px-4">
          {/* Colonna 1 */}
          <div className="flex flex-col items-center w-full lg:w-1/3 px-2 sm:px-4">
            <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center mb-4 sm:mb-6">
              <img src="/retapG5.png" alt="More Returning Customers" className="w-48 sm:w-56 lg:w-64 h-auto" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-textPrimary mb-2 sm:mb-3 text-center">Launch Promotions</h3>
            <p className="text-base sm:text-lg text-textSecondary text-center min-h-[4rem] sm:min-h-[4.5rem] lg:min-h-[4rem]">Launch personalized offers in minutes.</p>
          </div>
          {/* Freccia 1 */}
          <div className="hidden lg:flex items-center justify-center w-16">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 36H60M48 24L60 36L48 48" stroke="#FF3131" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Colonna 2 */}
          <div className="flex flex-col items-center w-full lg:w-1/3 px-2 sm:px-4">
            <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center mb-4 sm:mb-6">
              <img src="/retap-card-stack.png" alt="Your Loyalty Card" className="w-48 sm:w-56 lg:w-64 h-auto" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-textPrimary mb-2 sm:mb-3 text-center">Give Loyalty Card to Your Customers</h3>
            <p className="text-base sm:text-lg text-textSecondary text-center min-h-[4rem] sm:min-h-[4.5rem] lg:min-h-[4rem]">No app needed, no friction. They can use it in your store and others.</p>
          </div>
          {/* Freccia 2 */}
          <div className="hidden lg:flex items-center justify-center w-16">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 36H60M48 24L60 36L48 48" stroke="#FF3131" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Colonna 3 */}
          <div className="flex flex-col items-center w-full lg:w-1/3 px-2 sm:px-4">
            <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center mb-4 sm:mb-6">
              <img src="/retapG4.png" alt="Custom Offers in Clicks" className="w-48 sm:w-56 lg:w-64 h-auto" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-textPrimary mb-2 sm:mb-3 text-center">Customer Retention</h3>
            <p className="text-base sm:text-lg text-textSecondary text-center min-h-[4rem] sm:min-h-[4.5rem] lg:min-h-[4rem]">Get back your customers and get new ones from the ReTap network.</p>
          </div>
        </div>
      </section>

      <hr className="border-t border-border w-full" />

      {/* Features Section (nuova, dopo le metriche) */}
      <section id="features" className="scroll-mt-24 bg-background px-4 py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto flex flex-col gap-16 sm:gap-20 lg:gap-24">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-textPrimary text-center">Why choose ReTap?</h2>
          {/* Block 1: image left, text right */}
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
            <div className="w-full lg:w-1/2 flex justify-center items-center order-2 lg:order-1">
              <img 
                src="/retapG1.png" 
                alt="ReTap card" 
                className="w-full max-w-sm sm:max-w-md lg:max-w-xl" 
                style={{background: 'none', boxShadow: 'none'}} 
              />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col items-start justify-center lg:pl-12 order-1 lg:order-2">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-textPrimary leading-tight mb-4 sm:mb-6">Bring customers back and get new ones</h3>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-textSecondary leading-relaxed">Give cards to your customers. They tap their phone to check points (no app needed). They use the same card everywhere. Your customers return for promotions, and new ones discover your business through the ReTap network.</p>
            </div>
          </div>
          {/* Block 2: text left, image right */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8 sm:gap-12 lg:gap-16">
            <div className="w-full lg:w-1/2 flex justify-center items-center order-2 lg:order-1">
              <img 
                src="/retapG2.png" 
                alt="ReTap dashboard" 
                className="w-full max-w-sm sm:max-w-md lg:max-w-xl" 
                style={{background: 'none', boxShadow: 'none'}} 
              />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col items-start justify-center lg:pr-12 order-1 lg:order-2">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-textPrimary leading-tight mb-4 sm:mb-6">Real-time insights, real business impact</h3>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-textSecondary leading-relaxed">Track customer behavior, monitor campaign performance, and measure ROI — all from a single, easy-to-use dashboard. Make smarter decisions based on real data, not guesswork.</p>
            </div>
          </div>
          {/* Block 3: image left, text right */}
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
            <div className="w-full lg:w-1/2 flex justify-center items-center order-2 lg:order-1">
              <img 
                src="/retapG3.png" 
                alt="ReTap analytics" 
                className="w-full max-w-sm sm:max-w-md lg:max-w-xl" 
                style={{background: 'none', boxShadow: 'none'}} 
              />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col items-start justify-center lg:pl-12 order-1 lg:order-2">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-textPrimary leading-tight mb-4 sm:mb-6">Engage customers with tailored rewards</h3>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-textSecondary leading-relaxed">Design personalized promotions and loyalty offers in minutes. No tech skills required. Whether it's first-time visitors or loyal regulars, you can target every customer with the right offer at the perfect moment.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-t border-border w-full" />

      {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-24 flex items-center justify-center min-h-screen px-4 py-16 sm:py-20 lg:py-20 border-b border-border relative overflow-hidden">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-10 text-textPrimary text-center">
              Pricing
            </h2>
            <p className="text-lg sm:text-xl text-textSecondary mb-6 sm:mb-8 text-center">
              One simple, transparent subscription
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-4 relative">
              <Label htmlFor="billing-toggle" className="text-base sm:text-lg font-normal text-textPrimary">Monthly</Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="scale-110 sm:scale-125"
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="billing-toggle" className="text-base sm:text-lg font-normal text-textPrimary">
                  Annual
                </Label>
                <div className={`absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 transition-all duration-300 ${isAnnual ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                  <div className="bg-[#1A1A1A]/5 text-[#1A1A1A] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-[#1A1A1A]/10 whitespace-nowrap">
                    <span className="font-medium tracking-tight text-[#1A1A1A]/70">No activation fee + 10% off first year (Save {(SUBSCRIPTION.monthlyPrice * 12 * SUBSCRIPTION.annualDiscount + SUBSCRIPTION.activationFee).toFixed(0)}€)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Card className="max-w-sm sm:max-w-md w-full border-[#1A1A1A] shadow-xl rounded-2xl">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl text-center text-textPrimary">{SUBSCRIPTION.name}</CardTitle>
                <CardDescription className="text-center text-textSecondary text-sm sm:text-base">For all businesses, big and small</CardDescription>
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-4xl sm:text-5xl font-bold mb-1 text-textPrimary">
                    {isAnnual ? `${annualPrice}€` : `${SUBSCRIPTION.monthlyPrice}€`}
                  </span>
                  <span className="text-textSecondary text-base sm:text-lg">
                    /{isAnnual ? "year" : "month"}
                  </span>
                  {!isAnnual && (
                    <span className="text-xs sm:text-sm text-textSecondary mt-2 text-center">
                      + {SUBSCRIPTION.activationFee}€ one-time activation fee
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <ul className="space-y-2 mb-4">
                  {SUBSCRIPTION.features.map((feature, index) => (
                    <li key={feature} className={`flex items-center gap-2 ${index === 4 && !isAnnual ? 'hidden' : ''}`}>
                      <Check className="h-4 w-4 text-[#FF3131] flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-textSecondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-center">
                  <div className="bg-[#28A745]/10 text-[#28A745] text-xs sm:text-sm rounded-lg px-3 sm:px-4 py-2 mb-4 shadow-sm border border-[#28A745]/20 text-center">
                    30-day money-back guarantee. No questions asked.
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-4 sm:px-6">
                <Link href="/auth" className="w-full">
                  <Button className="w-full h-12 text-base mt-2 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white" variant="default">
                    Activate now
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <div className="text-center mt-6 sm:mt-8 text-textSecondary">
            <p className="text-sm sm:text-base">ReTap is always free for end customers.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="scroll-mt-24 flex items-center justify-center min-h-screen px-4 py-16 sm:py-20 lg:py-20 bg-background">
          <div className="container mx-auto text-center flex flex-col justify-center items-center h-full">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-10 text-textPrimary text-center">Frequently Asked Questions</h2>
            <div className="max-w-2xl sm:max-w-3xl mx-auto w-full">
              {FAQS.map((item, idx) => (
                <div key={idx} className="mb-4 border-b border-border">
                  <button
                    className={`w-full flex justify-between items-center py-3 sm:py-4 text-left font-medium text-base sm:text-lg transition-colors ${open === idx ? 'text-primary' : 'text-textPrimary'}`}
                    onClick={() => setOpen(open === idx ? null : idx)}
                    aria-expanded={open === idx}
                    aria-controls={`faq-content-${idx}`}
                  >
                    <span className="pr-4">{item.q}</span>
                    <svg className={`w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform flex-shrink-0 ${open === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div
                    id={`faq-content-${idx}`}
                    className={`${open === idx ? 'block' : 'hidden'} pb-3 sm:pb-4 text-sm sm:text-base text-textSecondary leading-relaxed`}
                  >
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-10 bg-surface text-center text-textSecondary text-sm border-t border-border">
          <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-4 px-4">
            <div className="flex flex-col items-center lg:items-start gap-1">
              <span className="font-bold text-primary text-base sm:text-lg">ReTap S.r.l.</span>
              <span className="text-xs sm:text-sm">VAT IT12345678901</span>
              <span className="text-xs text-textDisabled">&copy; {new Date().getFullYear()} ReTap. All rights reserved.</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-semibold text-textPrimary text-sm sm:text-base">Contacts</span>
              <a href="mailto:info@retapcard.com" className="hover:text-primary transition-colors text-xs sm:text-sm">info@retapcard.com</a>
              <a href="https://wa.me/393331234567" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors text-xs sm:text-sm">WhatsApp: +39 333 1234567</a>
            </div>
            <div className="flex flex-col items-center lg:items-end gap-1">
              <a href="#" className="hover:text-primary transition-colors text-xs sm:text-sm">Privacy Policy</a>
              <span className="text-xs text-textDisabled">ReTap - Loyalty made simple for business</span>
            </div>
          </div>
        </footer>

        {/* Bottone WhatsApp fisso in basso a destra */}
        <a
          href="https://wa.me/393331234567"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 bg-[#25D366] hover:bg-[#1ebe5d] rounded-full shadow-lg w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition-colors"
          aria-label="Contact us on WhatsApp"
        >
          <img src="/WhatsApp.webp" alt="WhatsApp" className="w-8 h-8 sm:w-10 sm:h-10" />
        </a>
    </main>
  );
}