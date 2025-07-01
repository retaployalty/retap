"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

export default function GrantAccessPage() {
  const [email, setEmail] = useState("");
  const [durationMonths, setDurationMonths] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGranted, setLastGranted] = useState<any>(null);

  const handleGrantAccess = async () => {
    if (!email) {
      toast.error("Inserisci un'email");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/grant-free-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, durationMonths }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setLastGranted(result.subscription);
        setEmail("");
      } else {
        toast.error(result.error || "Errore sconosciuto");
      }
    } catch (error) {
      console.error("Errore:", error);
      toast.error("Errore di connessione");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Concedi Accesso Gratuito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email del Merchant</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="merchant@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="duration">Durata (mesi)</Label>
            <Input
              id="duration"
              type="number"
              value={durationMonths}
              onChange={(e) => setDurationMonths(parseInt(e.target.value) || 12)}
              min="1"
              max="60"
            />
          </div>

          <Button 
            onClick={handleGrantAccess} 
            disabled={isLoading || !email}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Concedendo accesso...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Concedi Accesso
              </>
            )}
          </Button>

          {lastGranted && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800">Accesso concesso!</h4>
              <p className="text-sm text-green-600">
                Email: {lastGranted.email}<br />
                Durata: {lastGranted.durationMonths} mesi<br />
                Scade: {new Date(lastGranted.endDate).toLocaleDateString('it-IT')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
