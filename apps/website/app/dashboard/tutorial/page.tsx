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
  Video
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
    window.open('https://wa.me/393401234567', '_blank');
  };

  const faqs = [
    {
      question: "How does the points system work?",
      answer: "The ReTap points system allows you to accumulate points with every purchase. Points can be redeemed for rewards and discounts. Each euro spent equals one point, but you can customize the conversion rate in settings."
    },
    {
      question: "How can I issue a new card?",
      answer: "To issue a new card, go to the Customers section and click on 'New Card'. Enter the customer's details and confirm. The card will be activated immediately and can be used by the customer."
    },
    {
      question: "How does the POS work?",
      answer: "The ReTap POS integrates with your existing system. When a customer pays, you can scan their NFC card or QR code to credit points. The system automatically calculates points to assign based on the amount spent."
    },
    {
      question: "Can I customize the points conversion rate?",
      answer: "Yes, you can customize the points conversion rate in the settings section. This allows you to set different rates for different products or categories."
    },
    {
      question: "How do I manage customer cards?",
      answer: "You can manage customer cards in the Customers section. Here you can view card balances, transaction history, and issue new cards. You can also block or replace lost cards."
    },
    {
      question: "What happens if a card is lost?",
      answer: "If a card is lost, you can immediately block it in the Customers section and issue a new one. The customer's points balance will be transferred to the new card automatically."
    }
  ];

  return (
    <div className="space-y-8 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-extrabold">Tutorial</h1>
          <p className="text-lg text-[#f8494c] font-semibold mt-1">Quick Guide</p>
          <p className="text-muted-foreground text-sm mt-1">Learn how to use ReTap effectively</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <Button 
            variant="outline" 
            className="font-medium h-10 px-4 shadow-none flex items-center gap-2 hover:bg-[#f8494c] hover:text-white transition-colors"
          >
            <Download className="h-4 w-4" /> Download Guide
          </Button>
          <Button 
            onClick={() => router.push('/checkout')}
            className="bg-[#f8494c] hover:bg-[#f8494c]/90 flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" /> Subscribe Now
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Video Tutorial */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Video className="h-6 w-6 text-[#f8494c]" /> Video Tutorial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              {isPlaying ? (
                <video
                  className="w-full h-full"
                  controls
                  autoPlay
                  src="/tutorial.mp4"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <div 
                      className="w-24 h-24 mx-auto rounded-full bg-[#f8494c]/10 flex items-center justify-center cursor-pointer hover:bg-[#f8494c]/20 transition-colors"
                      onClick={() => setIsPlaying(true)}
                    >
                      <Play className="w-12 h-12 text-[#f8494c]" />
                    </div>
                    <p className="mt-4 text-white/80">Click to play tutorial video</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-[#f8494c]" /> Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border-b border-border/40"
                >
                  <AccordionTrigger className="text-left py-4 hover:no-underline">
                    <span className="font-medium text-lg">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-[#f8494c]" /> Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-muted-foreground text-lg">
                  Our support team is available on WhatsApp to help you with any questions or issues. We typically respond within minutes during business hours.
                </p>
              </div>
              <Button 
                onClick={handleWhatsApp}
                className="bg-[#25D366] hover:bg-[#25D366]/90 flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Chat on WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}