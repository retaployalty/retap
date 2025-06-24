"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, CreditCard, Zap, Gift, HelpCircle, ArrowRight, CheckCircle, Star, Smartphone } from "lucide-react";

export default function TutorialPage() {
  const router = useRouter();

  // Quick Tutorial Steps
  const steps = [
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Register your business",
      desc: "Create your merchant profile in a few clicks."
    },
    {
      icon: <CreditCard className="h-8 w-8 text-white" />,
      title: "Assign an NFC card",
      desc: "Link a card or digital pass to your customer."
    },
    {
      icon: <Zap className="h-8 w-8 text-white" />,
      title: "Add points with the POS",
      desc: "Every purchase is automatically recorded."
    },
    {
      icon: <Gift className="h-8 w-8 text-white" />,
      title: "Customer redeems rewards",
      desc: "Reward loyalty directly from the dashboard."
    }
  ];

  // Benefits
  const benefits = [
    {
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      text: "More loyal customers, less churn"
    },
    {
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      text: "No more paper cards, all digital"
    },
    {
      icon: <Smartphone className="h-6 w-6 text-blue-600" />,
      text: "Works also from smartphone"
    }
  ];

  // FAQ
  const faqs = [
    {
      q: "Do I need special hardware?",
      a: "No, just an NFC-compatible Android POS or our web dashboard."
    },
    {
      q: "Can I use my own NFC cards?",
      a: "Yes, you can use cards you already have or order them from us."
    },
    {
      q: "What if I cancel my subscription?",
      a: "No lock-in: you can export your data and cancel anytime."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-10">
      <div className="w-full max-w-6xl px-4 md:px-8 mx-auto mt-8">
        {/* HERO */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 md:mb-3">How ReTap Works</h1>
          <p className="text-base md:text-lg text-slate-600 mb-5 md:mb-6 max-w-2xl">Start building customer loyalty in minutes. No more paper cards, just digital rewards. Simple, fast, and effective!</p>
          <Button size="lg" className="bg-gradient-to-r from-[#f8494c] to-red-600 text-white text-lg px-8 py-6 shadow-lg hover:scale-105 transition-all" onClick={() => router.push('/checkout')}>
            Activate subscription <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <div className="text-xs text-slate-500 mt-2">No lock-in, cancel anytime</div>
        </motion.div>

        {/* QUICK TUTORIAL */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="mb-10 md:mb-14">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">Quick Tutorial</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {steps.map((step, i) => (
              <Card key={i} className="flex flex-col items-center p-5 md:p-6 bg-white shadow-md border-0 h-full">
                <div className="mb-3 md:mb-4 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[#f8494c] to-red-600 shadow-lg">
                  {step.icon}
              </div>
                <div className="font-bold text-base md:text-lg text-slate-900 mb-1 md:mb-2 text-center">{step.title}</div>
                <div className="text-slate-600 text-sm text-center">{step.desc}</div>
              </Card>
            ))}
              </div>
        </motion.div>
            
        {/* BENEFITS */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="mb-10 md:mb-14">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3 bg-white rounded-xl px-4 md:px-5 py-3 md:py-4 shadow border border-slate-100 w-full md:w-auto justify-center">
                {b.icon}
                <span className="text-slate-800 font-medium text-sm md:text-base">{b.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="mb-12 md:mb-16">
          <Card className="bg-white shadow border-0">
            <CardContent className="py-7 md:py-8 px-4 md:px-6">
              <div className="flex items-center gap-2 mb-5 md:mb-6">
                <HelpCircle className="h-6 w-6 text-[#f8494c]" />
                <span className="font-bold text-base md:text-lg text-slate-900">Frequently Asked Questions</span>
              </div>
              <div className="space-y-5 md:space-y-6">
                {faqs.map((faq, i) => (
                  <div key={i} className="border-b border-slate-100 pb-3 md:pb-4">
                    <div className="font-semibold text-slate-800 mb-1">{faq.q}</div>
                    <div className="text-slate-600 text-sm">{faq.a}</div>
                  </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

        {/* FINAL CALL TO ACTION */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="">
          <Card className="bg-gradient-to-br from-[#f8494c] to-red-600 shadow-xl border-0">
            <CardContent className="py-8 md:py-10 px-5 md:px-8 flex flex-col items-center">
              <div className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 text-center">Ready to grow your business?</div>
              <div className="text-white text-base md:text-lg mb-5 md:mb-6 text-center">Activate ReTap now and start rewarding your customers. No lock-in, cancel anytime.</div>
              <Button size="lg" className="bg-white text-[#f8494c] font-bold text-lg px-8 py-6 shadow-lg hover:bg-slate-100 hover:scale-105 transition-all" onClick={() => router.push('/checkout')}>
                Activate subscription <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
    </div>
  );
}