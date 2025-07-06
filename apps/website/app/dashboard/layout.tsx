"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { SubscriptionOverlay } from "@/components/dashboard/SubscriptionOverlay";
import { useSubscriptionStatus } from "@/lib/hooks/useSubscriptionStatus";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasActiveSubscription, isLoading } = useSubscriptionStatus();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pagine sempre accessibili (tutorial e impostazioni)
  const alwaysAccessiblePages = ['/dashboard/tutorial', '/dashboard/settings'];
  const isAlwaysAccessible = alwaysAccessiblePages.includes(pathname);

  // Mostra l'overlay solo se l'utente non ha un abbonamento attivo e non è in una pagina sempre accessibile
  // Ora gli utenti possono vedere tutte le pagine ma oscurate
  const shouldShowOverlay = !isLoading && !hasActiveSubscription && !isAlwaysAccessible;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={closeSidebar} />
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {/* Mobile header with hamburger */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <img src="/retapLogo.png" alt="ReTap Logo" className="h-12 w-auto" />
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
        
        <SubscriptionOverlay isBlocked={shouldShowOverlay}>
          {children}
        </SubscriptionOverlay>
      </main>
    </div>
  );
} 