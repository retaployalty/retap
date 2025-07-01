"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  CreditCard, 
  MessageCircle, 
  Settings, 
  Gift, 
  ArrowRight, 
  CheckCircle, 
  ArrowDown,
  ArrowUp,
  Shield,
  Phone,
  Users,
  Star,
  Zap,
  TrendingUp,
  Clock,
  Award,
  Target,
  Sparkles
} from "lucide-react";

export default function TutorialPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <CreditCard className="h-8 w-8 text-white" />,
      title: "Step 1: Activate your subscription",
      subtitle: "Start your journey to customer loyalty",
      highlight: "💰 Full refund guarantee",
      fear: "What if it doesn't work for my business?",
      solution: "Try risk-free with our 30-day money-back guarantee",
      content: (
        <div className="space-y-6">
          {/* Social Proof Section */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-800">Join 2,000+ businesses</h3>
                <p className="text-emerald-700">Already using ReTap to grow their customer base</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-800">40%</div>
                <div className="text-sm text-emerald-600">Increase in retention</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-800">3x</div>
                <div className="text-sm text-emerald-600">More repeat customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-800">98%</div>
                <div className="text-sm text-emerald-600">Satisfaction rate</div>
              </div>
            </div>
          </div>

          {/* Risk Reversal */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-800">Zero risk guarantee</h3>
                <p className="text-blue-700">Try ReTap completely risk-free</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-700">Full refund if not satisfied</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-700">No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-700">Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="bg-gradient-to-r from-[#f8494c] to-red-600 rounded-2xl p-6 text-white shadow-2xl">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold mb-2">Start growing today</h3>
              <p className="text-white/90">Get your first 30 days risk-free</p>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-[#f8494c] text-xl px-10 py-8 shadow-2xl hover:bg-gray-100 hover:scale-105 transition-all w-full font-bold"
              onClick={() => router.push('/checkout')}
            >
              🚀 Activate subscription now <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <p className="text-center text-white/80 text-sm mt-3">
              ⚡ Setup in under 5 minutes • No credit card required for trial
            </p>
          </div>
        </div>
      )
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-white" />,
      title: "Step 2: We'll text you to organize setup",
      subtitle: "Personal support from our experts",
      highlight: "📱 Contact within 24 hours",
      fear: "Will I get lost in the setup process?",
      solution: "Our expert guides you through every step personally",
      content: (
        <div className="space-y-6">
          {/* Personal Touch */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-400 flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Personal setup specialist</h3>
              </div>
            </div>
            <div className="text-slate-700 text-base mt-2">
              After activation, we'll contact you to schedule the best day to deliver the kit and set up everything in your store.
            </div>
          </div>

          {/* What to Expect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-bold text-orange-800 text-lg">What we'll discuss</h4>
              </div>
              <ul className="space-y-3 text-orange-700">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Best time for the visit</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Your business needs & goals</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Setup requirements & timeline</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white border-2 border-teal-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-bold text-teal-800 text-lg">What to prepare</h4>
              </div>
              <ul className="space-y-3 text-teal-700">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span>WiFi password</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span>Power outlet access</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span>30 minutes of your time</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Urgency */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-yellow-800 text-lg">Quick setup process</h4>
                <p className="text-yellow-700">Most businesses are up and running in under 1 hour</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <Settings className="h-8 w-8 text-white" />,
      title: "Step 3: We come to set up everything",
      subtitle: "Complete installation and training",
      highlight: "🛠️ Professional setup service",
      fear: "What if the setup is complicated?",
      solution: "Our expert handles everything - you just relax and watch",
      content: (
        <div className="space-y-6">
          {/* Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-green-800 text-lg">100 ReTap Cards</h4>
                  <p className="text-green-700">High-quality NFC cards ready to use</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-green-100">
                <div className="flex items-center gap-2 text-green-700">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Pre-configured & ready</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-800 text-lg">Professional POS Device</h4>
                  <p className="text-blue-700">NFC reader with warranty</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">2-year warranty included</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-6">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-600" />
              Setup timeline
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f8494c] text-white flex items-center justify-center text-sm font-bold">1</div>
                <span className="text-slate-700">Device installation (15 min)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f8494c] text-white flex items-center justify-center text-sm font-bold">2</div>
                <span className="text-slate-700">Staff training (20 min)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f8494c] text-white flex items-center justify-center text-sm font-bold">3</div>
                <span className="text-slate-700">Testing & verification (10 min)</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-4">
              We'll bring you 100 ReTap cards and the POS device, ready to use.
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <Gift className="h-8 w-8 text-white" />,
      title: "Step 4: Create rewards & start growing",
      subtitle: "Launch your loyalty program",
      highlight: "🎯 Start attracting customers",
      fear: "What if I don't know how to create good rewards?",
      solution: "We provide proven templates and strategies that work",
      content: (
        <div className="space-y-6">
          {/* Success Stories */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-pink-800">Ready to grow!</h3>
                <p className="text-pink-700">Join businesses seeing 40% more repeat customers</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-pink-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-800 mb-2">"Our customer retention doubled in 3 months"</div>
                <div className="text-pink-600">- Maria, Coffee Shop Owner</div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-[#f8494c] to-red-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Create Promotions</h4>
                  <p className="text-white/90">Design attractive rewards</p>
                </div>
              </div>
              <Button 
                className="w-full bg-white text-[#f8494c] hover:bg-gray-100 font-bold py-6 text-lg"
                onClick={() => router.push('/dashboard/promotions')}
              >
                Go to Promotions <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-500 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-800">Manage Customers</h4>
                  <p className="text-slate-600">Distribute cards and track loyalty</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-[#f8494c] text-[#f8494c] hover:bg-[#f8494c] hover:text-white font-bold py-6 text-lg"
                onClick={() => router.push('/dashboard/customers')}
              >
                Manage Customers <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Proven Strategies */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6">
            <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
              💡 Proven strategies that work
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-emerald-100">
                <div className="font-semibold text-emerald-800 mb-2">Quick wins</div>
                <ul className="space-y-1 text-emerald-700 text-sm">
                  <li>• "Buy 5, Get 1 Free"</li>
                  <li>• "10% off on birthday"</li>
                  <li>• "First purchase discount"</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-4 border border-emerald-100">
                <div className="font-semibold text-emerald-800 mb-2">Advanced strategies</div>
                <ul className="space-y-1 text-emerald-700 text-sm">
                  <li>• Tier-based rewards</li>
                  <li>• Referral bonuses</li>
                  <li>• Seasonal promotions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-gradient-to-r from-[#f8494c] to-red-600 rounded-2xl p-6 text-white shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Don't wait to start growing</h3>
              <p className="text-white/90 mb-4">Every day you wait is a day you're losing customers to competitors</p>
              <Button 
                className="bg-white text-[#f8494c] font-bold text-lg px-8 py-6 hover:bg-gray-100 hover:scale-105 transition-all"
                onClick={() => router.push('/checkout')}
              >
                🚀 Start now - 30 days free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center pb-10">
      <div className="w-full max-w-6xl px-4 md:px-8 mx-auto mt-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }} 
          className="mb-12 text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#f8494c] to-red-600 bg-clip-text text-transparent mb-4">
            How to Start
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 font-medium mb-6">
            4 proven steps to start your loyalty program
          </p>
          <div className="flex items-center justify-center gap-6 text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Risk-free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>5-minute setup</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Expert support</span>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1, duration: 0.6 }} 
          className="mb-8"
        >
          <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
            <motion.div 
              className="bg-gradient-to-r from-[#f8494c] to-red-600 h-3 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
              </div>
        </motion.div>
            
        {/* Step Navigation Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15, duration: 0.6 }} 
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 ${
                  index === currentStep
                    ? 'border-[#f8494c] bg-white shadow-2xl scale-105'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    index === currentStep
                      ? 'bg-gradient-to-br from-[#f8494c] to-red-600 shadow-lg'
                      : 'bg-slate-100'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-bold ${
                      index === currentStep ? 'text-[#f8494c]' : 'text-slate-600'
                    }`}>
                      Step {index + 1}
                    </div>
                    <div className={`text-xs ${
                      index === currentStep ? 'text-slate-800' : 'text-slate-500'
                    }`}>
                      {step.title.split(': ')[1]}
                    </div>
                  </div>
              </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5 }} 
          className="mb-8"
        >
          <Card className="bg-white shadow-2xl border-0 overflow-hidden p-0">
            <CardContent className="p-0">
              {/* Header con sfondo bianco e testo colorato */}
              <div className="bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f8494c] to-red-600 flex items-center justify-center shadow-lg">
                    {steps[currentStep].icon}
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#f8494c]">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-slate-600 text-lg">
                      {steps[currentStep].subtitle}
                    </p>
                  </div>
                </div>
                {/* Step 1: Full refund guarantee a destra, in rosso */}
                {currentStep === 0 && (
                  <div className="inline-block bg-gradient-to-r from-[#f8494c] to-red-600 text-white px-6 py-2 rounded-full text-lg font-semibold whitespace-nowrap flex items-center gap-2 shadow">
                    <span className="text-xl">💰</span> Full refund guarantee
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-6 md:p-8">
                {/* STEP 1 */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-[#f8494c] to-red-600 rounded-2xl p-8 text-white flex flex-col items-center gap-4 shadow-lg">
                      <span className="text-4xl">🎁</span>
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold mb-2">Try ReTap for free – 30 days money-back guarantee</div>
                        <div className="text-white/90 text-base mb-6">Get full access to all features. If you're not 100% satisfied within the first month, you'll get a full refund. No questions asked.</div>
                        <Button 
                          size="lg" 
                          className="bg-white text-[#f8494c] text-xl px-12 py-6 shadow-2xl hover:bg-gray-100 hover:scale-105 transition-all font-bold w-full max-w-xs"
                          onClick={() => router.push('/checkout')}
                        >
                          Start your free trial <ArrowRight className="ml-3 h-6 w-6" />
                        </Button>
                        <div className="text-white/80 text-sm mt-3">
                          You'll be charged only if you decide to continue after 30 days. Cancel anytime.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* STEP 2 */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-400 flex items-center justify-center">
                          <Phone className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">Personal setup specialist</h3>
                        </div>
                      </div>
                      <div className="text-slate-700 text-base mt-2">
                        After activation, we'll contact you to schedule the best day to deliver the kit and set up everything in your store.
                      </div>
                    </div>
                  </div>
                )}
                {/* STEP 3 */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-6">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-slate-600" />
                        Setup timeline
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f8494c] text-white flex items-center justify-center text-sm font-bold">1</div>
                          <span className="text-slate-700">Device installation (15 min)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f8494c] text-white flex items-center justify-center text-sm font-bold">2</div>
                          <span className="text-slate-700">Staff training (20 min)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f8494c] text-white flex items-center justify-center text-sm font-bold">3</div>
                          <span className="text-slate-700">Testing & verification (10 min)</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-4">
                        We'll bring you 100 ReTap cards and the POS device, ready to use.
                      </div>
                    </div>
                  </div>
                )}
                {/* STEP 4 */}
                {currentStep === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-[#f8494c] to-red-600 rounded-2xl p-6 text-white shadow-xl flex flex-col items-center justify-center">
                      <Gift className="h-10 w-10 mb-2" />
                      <h4 className="font-bold text-lg mb-2">Create Promotions</h4>
                      <Button 
                        className="w-full bg-white text-[#f8494c] hover:bg-gray-100 font-bold py-4 text-lg"
                        onClick={() => router.push('/dashboard/promotions')}
                      >
                        Go to Promotions <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center">
                      <Users className="h-10 w-10 mb-2 text-[#f8494c]" />
                      <h4 className="font-bold text-lg mb-2 text-slate-800">Manage Customers</h4>
                      <Button 
                        variant="outline" 
                        className="w-full border-[#f8494c] text-[#f8494c] hover:bg-[#f8494c] hover:text-white font-bold py-4 text-lg"
                        onClick={() => router.push('/dashboard/customers')}
                      >
                        Manage Customers <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center">
                      <Settings className="h-10 w-10 mb-2 text-blue-700" />
                      <h4 className="font-bold text-lg mb-2 text-blue-800">Manage Profile</h4>
                      <Button 
                        variant="outline" 
                        className="w-full border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white font-bold py-4 text-lg"
                        onClick={() => router.push('/dashboard/profile')}
                      >
                        Manage Profile <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

        {/* Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.6 }} 
          className="flex justify-between items-center"
        >
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3"
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-4 h-4 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-[#f8494c]' 
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <Button 
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
            className="flex items-center gap-2 bg-[#f8494c] hover:bg-red-600 px-6 py-3"
          >
            Next
            <ArrowDown className="h-4 w-4 -rotate-90" />
          </Button>
        </motion.div>

        {/* Final CTA for last step */}
        {currentStep === steps.length - 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 24 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.6 }} 
            className="mt-8"
          >
            <Card className="bg-gradient-to-br from-[#f8494c] to-red-600 shadow-2xl border-0 overflow-hidden">
              <CardContent className="py-12 px-8 text-center">
                <div className="inline-block bg-white/20 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
                  🎯 Limited Time Offer
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to start growing your business?
                </h3>
                <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto">
                  Join 2,000+ businesses already using ReTap. Start your 30-day risk-free trial today.
                </p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                  <div className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5" />
                    <span>No setup fees</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5" />
                    <span>Full refund guarantee</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="bg-white text-[#f8494c] font-bold text-2xl px-12 py-8 shadow-2xl hover:bg-gray-100 hover:scale-105 transition-all"
                  onClick={() => router.push('/checkout')}
                >
                  🚀 Start my 30-day free trial <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
                <p className="text-white/70 text-sm mt-4">
                  ⚡ Setup in under 5 minutes • No credit card required
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
        </div>
    </div>
  );
}