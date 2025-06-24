"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscriptionStatus } from "@/lib/hooks/useSubscriptionStatus";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  CreditCard, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Gift, 
  BarChart3,
  Settings
} from "lucide-react";

interface WelcomeMessageProps {
  merchantName?: string;
}

export function WelcomeMessage({ merchantName }: WelcomeMessageProps) {
  const { hasActiveSubscription, isLoading } = useSubscriptionStatus();
  const router = useRouter();

  if (isLoading || hasActiveSubscription) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Sparkles className="h-5 w-5" />
          Benvenuto in ReTap, {merchantName || "Business"}!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-blue-800">
          Ottimo! Hai completato la registrazione. Ora è il momento di attivare il tuo abbonamento 
          per iniziare a utilizzare tutte le funzionalità di ReTap.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-900 text-sm">Cosa puoi fare ora:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Esplorare il tutorial
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Configurare le impostazioni
              </li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-900 text-sm">Con l'abbonamento:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-center gap-2">
                <Users className="h-3 w-3 text-blue-600" />
                Gestire clienti
              </li>
              <li className="flex items-center gap-2">
                <Gift className="h-3 w-3 text-blue-600" />
                Creare promozioni
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 className="h-3 w-3 text-blue-600" />
                Visualizzare statistiche
              </li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => router.push('/checkout')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Attiva Abbonamento
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/tutorial')}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Vai al Tutorial
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 