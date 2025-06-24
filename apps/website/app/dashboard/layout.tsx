"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { SubscriptionOverlay } from "@/components/dashboard/SubscriptionOverlay";
import { useSubscriptionStatus } from "@/lib/hooks/useSubscriptionStatus";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasActiveSubscription, isLoading } = useSubscriptionStatus();
  const pathname = usePathname();

  // Pagine sempre accessibili (tutorial e impostazioni)
  const alwaysAccessiblePages = ['/dashboard/tutorial', '/dashboard/settings'];
  const isAlwaysAccessible = alwaysAccessiblePages.includes(pathname);

  // Mostra l'overlay solo se l'utente non ha un abbonamento attivo e non è in una pagina sempre accessibile
  // Ora gli utenti possono vedere tutte le pagine ma oscurate
  const shouldShowOverlay = !isLoading && !hasActiveSubscription && !isAlwaysAccessible;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <SubscriptionOverlay isBlocked={shouldShowOverlay}>
          {children}
        </SubscriptionOverlay>
      </main>
    </div>
  );
} 