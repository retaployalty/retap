"use client";

import { AlertCircle, CreditCard, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SubscriptionBannerProps {
  isVisible: boolean;
}

export function SubscriptionBanner({ isVisible }: SubscriptionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-orange-800">
              <strong>Abbonamento richiesto:</strong> Per accedere a tutte le funzionalità 
              della dashboard e iniziare a utilizzare ReTap, è necessario attivare un abbonamento.
            </AlertDescription>
            <div className="flex items-center gap-3 mt-3">
              <Button
                size="sm"
                onClick={() => router.push('/checkout')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Attiva Abbonamento
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Alert>
  );
} 