"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Play, 
  HelpCircle, 
  MessageCircle,
  Download,
  MessageSquare,
  Video,
  BookOpen,
  Users,
  Settings,
  Smartphone,
  Zap,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Mail
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

export default function TutorialPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hi! I need help with ReTap setup.");
    const whatsappUrl = `https://wa.me/+1234567890?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDownloadGuide = () => {
    // Simula il download di una guida PDF
    const link = document.createElement('a');
    link.href = '/guide.pdf';
    link.download = 'ReTap-User-Guide.pdf';
    link.click();
  };

  const quickSteps = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Add Customers",
      description: "Create customer profiles and issue NFC cards",
      color: "bg-[#f8494c]",
      step: "1"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Setup POS",
      description: "Configure your point of sale system",
      color: "bg-[#f8494c]",
      step: "2"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Start Earning",
      description: "Customers earn points with every purchase",
      color: "bg-[#f8494c]",
      step: "3"
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Customize Rewards",
      description: "Set up rewards and promotions",
      color: "bg-[#f8494c]",
      step: "4"
    }
  ];

  return (
    <div className="space-y-8 min-h-screen p-6 bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f8494c]/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-[#f8494c]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Tutorial & Guide</h1>
          </div>
          <p className="text-muted-foreground">
            Learn how to use ReTap effectively and get the most out of your loyalty program
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={handleDownloadGuide}
            className="font-medium h-10 px-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> 
            Download Guide
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button 
            onClick={() => router.push('/checkout')}
            className="bg-[#f8494c] hover:bg-[#f8494c]/90 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" /> 
            Subscribe Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Quick Start Guide */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#f8494c]/5 to-red-500/5">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Zap className="h-6 w-6 text-[#f8494c]" /> 
              Quick Start Guide
            </CardTitle>
            <CardDescription className="text-lg">
              Get up and running with ReTap in 4 simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickSteps.map((step, index) => (
                <div key={index} className="relative group h-full">
                  {/* Step Number */}
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-r from-[#f8494c] to-red-600 text-white flex items-center justify-center text-lg font-bold z-10 shadow-lg">
                    {step.step}
                  </div>
                  
                  {/* Connection Line */}
                  {index < quickSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-5 -right-3 w-6 h-0.5 bg-gradient-to-r from-[#f8494c]/30 to-transparent z-0"></div>
                  )}
                  
                  {/* Card Content */}
                  <div className="relative h-full p-6 border-2 border-white rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 flex flex-col">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-2xl opacity-50"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full">
                      <div className={`w-14 h-14 rounded-xl ${step.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        {step.icon}
                      </div>
                      <h3 className="font-bold text-lg mb-3 text-gray-800 group-hover:text-[#f8494c] transition-colors duration-300 flex-shrink-0">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed flex-grow">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Video Tutorial */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Video className="h-5 w-5 text-[#f8494c]" /> 
              Video Tutorial
            </CardTitle>
            <CardDescription>
              Watch our comprehensive tutorial to learn all the features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-2xl">
              {isPlaying ? (
                <video
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  src="/tutorial.mp4"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 mx-auto rounded-full bg-[#f8494c] flex items-center justify-center cursor-pointer hover:bg-[#f8494c]/90 transition-all duration-300 hover:scale-110 shadow-lg"
                      onClick={() => setIsPlaying(true)}
                    >
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    <p className="mt-4 text-white/90 font-medium">Click to play tutorial video</p>
                    <p className="text-white/60 text-sm mt-1">Duration: 5 minutes</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <HelpCircle className="h-6 w-6 text-[#f8494c]" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription className="text-lg">
              Common questions about ReTap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border-none rounded-lg bg-gradient-to-br from-slate-50 to-gray-100/50 shadow-sm transition-shadow hover:shadow-md">
                  <AccordionTrigger className="px-6 py-4 text-left font-semibold text-gray-800 hover:no-underline hover:text-[#f8494c]">
                    How do I set up NFC cards for my customers?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600 leading-relaxed">
                    You can order NFC cards through our platform or use your existing cards. Each card will be linked to a customer profile in your dashboard.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-none rounded-lg bg-gradient-to-br from-slate-50 to-gray-100/50 shadow-sm transition-shadow hover:shadow-md">
                  <AccordionTrigger className="px-6 py-4 text-left font-semibold text-gray-800 hover:no-underline hover:text-[#f8494c]">
                    What POS systems are compatible?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600 leading-relaxed">
                    ReTap is compatible with most modern POS systems. We provide integration guides for popular platforms like Square, Shopify, and custom solutions.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3" className="border-none rounded-lg bg-gradient-to-br from-slate-50 to-gray-100/50 shadow-sm transition-shadow hover:shadow-md">
                  <AccordionTrigger className="px-6 py-4 text-left font-semibold text-gray-800 hover:no-underline hover:text-[#f8494c]">
                    How do customers redeem their points?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600 leading-relaxed">
                    Customers can redeem points through your POS system or the ReTap mobile app. You can set up automatic rewards or manual redemption options.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-none rounded-lg bg-gradient-to-br from-slate-50 to-gray-100/50 shadow-sm transition-shadow hover:shadow-md">
                  <AccordionTrigger className="px-6 py-4 text-left font-semibold text-gray-800 hover:no-underline hover:text-[#f8494c]">
                    Is there a limit to the number of customers or transactions?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600 leading-relaxed">
                    Our plans are designed to scale with your business. We offer different tiers based on your needs, with no hard limits on customers or transactions on most plans.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>

        {/* Contact Us Section */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <MessageSquare className="h-6 w-6 text-[#f8494c]" />
              Need Help?
            </CardTitle>
            <CardDescription className="text-lg">
              Contact us for any questions or support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div 
                className="p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-[#f8494c] hover:bg-[#f8494c]/5 transition-all duration-300 cursor-pointer text-center"
                onClick={handleWhatsApp}
              >
                <div className="w-16 h-16 rounded-full bg-[#f8494c]/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-[#f8494c]" />
                </div>
                <h3 className="font-bold text-lg mb-2">WhatsApp</h3>
                <p className="text-gray-600 text-sm">Chat with us directly</p>
                <p className="text-sm font-medium text-[#f8494c] mt-2">+1 234 567 890</p>
              </div>

              <div 
                className="p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-[#f8494c] hover:bg-[#f8494c]/5 transition-all duration-300 cursor-pointer text-center"
                onClick={() => window.open('mailto:support@retap.com')}
              >
                <div className="w-16 h-16 rounded-full bg-[#f8494c]/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-[#f8494c]" />
                </div>
                <h3 className="font-bold text-lg mb-2">Email</h3>
                <p className="text-gray-600 text-sm">Get support via email</p>
                <p className="text-sm font-medium text-[#f8494c] mt-2">support@retap.com</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}