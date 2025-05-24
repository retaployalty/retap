"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#25D366"/>
    <path d="M16 7.5A8.5 8.5 0 0 0 7.5 16c0 1.5.4 2.9 1.1 4.1L7 25l5-1.6A8.5 8.5 0 1 0 16 7.5Zm0 15.5c-1.4 0-2.7-.4-3.8-1.1l-.3-.2-3 .9.9-2.9-.2-.3A7.1 7.1 0 1 1 16 23Zm3.9-5.4c-.2-.1-1.2-.6-1.3-.7-.2-.1-.3-.2-.5.1-.1.2-.5.7-.6.8-.1.2-.2.2-.4.1-.2-.1-.8-.3-1.5-.9-.6-.5-1-1.2-1.1-1.4-.1-.2 0-.3.1-.4.1-.1.2-.2.3-.3.1-.1.1-.2.2-.3.1-.1.1-.2 0-.4 0-.1-.5-1.2-.7-1.6-.2-.4-.3-.3-.5-.3h-.4c-.2 0-.4.1-.5.2-.2.2-.7.7-.7 1.7 0 1 .7 2 1.1 2.4.1.2 1.5 2.3 3.7 3.1.5.2.9.3 1.2.4.5.1.9.1 1.2.1.4 0 1.2-.2 1.4-.7.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z" fill="#fff"/>
  </svg>
);

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
        <div
          className="bg-gradient-to-br from-green-50 to-green-100 border border-green-400 rounded-2xl px-6 py-6 flex flex-col items-center shadow-sm w-full mt-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block align-middle"><WhatsAppIcon /></span>
            <span className="font-bold text-green-800 text-xl">Configura il tuo business</span>
          </div>
          <p className="text-center text-green-900 mb-5 text-base max-w-md">
            Prenota la call iniziale di 30 minuti su WhatsApp:<br />
            ti aiutiamo a configurare e usare ReTap senza pensieri.
          </p>
          <a
            href="https://wa.me/390212345678?text=Ciao,%20vorrei%20prenotare%20la%20call%20di%20setup%20per%20ReTap"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-lg font-bold text-white bg-green-500 rounded-xl shadow-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 mb-2"
          >
            <span className="inline-block align-middle"><WhatsAppIcon /></span>
            Scrivici su WhatsApp
          </a>
          <span className="text-green-700 font-bold text-base select-all mb-1">+39 02 12345678</span>
          <span className="text-xs text-green-800 text-center mt-1">Rispondiamo velocemente dal lunedì al venerdì</span>
        </div>
        <Button onClick={() => router.push('/dashboard')} className="mt-2 w-full max-w-xs text-base font-semibold">
          Vai alla Dashboard
        </Button>
      </div>
    </div>
  );
} 