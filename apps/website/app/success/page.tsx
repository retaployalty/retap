"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-muted/50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-md w-full border border-primary/10">
        <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
        <h1 className="text-3xl font-extrabold text-primary text-center">Pagamento completato!</h1>
        <p className="text-base text-muted-foreground text-center max-w-xs">
          Grazie per il tuo acquisto. La tua sottoscrizione è attiva e puoi iniziare subito a usare tutte le funzionalità di ReTap Business.
        </p>
        <Button onClick={() => router.push('/dashboard')} className="mt-2 w-full max-w-xs text-base font-semibold">
          Vai alla Dashboard
        </Button>
      </div>
    </div>
  );
} 