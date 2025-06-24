"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionStatus } from "@/lib/hooks/useSubscriptionStatus";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Crown,
  Clock
} from "lucide-react";

export function SubscriptionInfo() {
  const { hasActiveSubscription, isLoading } = useSubscriptionStatus();
  const router = useRouter();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Stato Abbonamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stato Abbonamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Stato:</span>
          <Badge 
            variant={hasActiveSubscription ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            {hasActiveSubscription ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Attivo
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Inattivo
              </>
            )}
          </Badge>
        </div>

        {hasActiveSubscription ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4" />
              <span>Hai accesso completo a tutte le funzionalità</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                Il tuo abbonamento è attivo. Puoi utilizzare tutte le funzionalità di ReTap.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Accesso limitato alle funzionalità</span>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800 mb-3">
                Per accedere a tutte le funzionalità, è necessario attivare un abbonamento.
              </p>
              <Button
                onClick={() => router.push('/checkout')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Attiva Abbonamento
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 