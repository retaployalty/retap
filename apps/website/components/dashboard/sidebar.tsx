"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Gift,
  Settings,
  HelpCircle,
  LogOut,
  Store,
  Lock,
  Crown,
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSubscriptionStatus } from "@/lib/hooks/useSubscriptionStatus";
import { SubscriptionStatus } from "./SubscriptionStatus";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiresSubscription: true,
  },
  {
    name: "Customers",
    href: "/dashboard/customers",
    icon: Users,
    requiresSubscription: true,
  },
  {
    name: "Promotions",
    href: "/dashboard/promotions",
    icon: Gift,
    requiresSubscription: true,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: Store,
    requiresSubscription: true,
  },
  {
    name: "Tutorial",
    href: "/dashboard/tutorial",
    icon: HelpCircle,
    requiresSubscription: false,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    requiresSubscription: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { hasActiveSubscription, isLoading, error } = useSubscriptionStatus();

  // Debug logging
  console.log('Sidebar - Subscription Status:', { hasActiveSubscription, isLoading, error });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  // Temporaneamente permetto accesso a tutte le sezioni per testare
  // TODO: Rimuovere questa logica quando l'abbonamento funziona correttamente
  const shouldShowAllSections = true; // hasActiveSubscription || !isLoading;

  return (
    <TooltipProvider>
      <div className="flex h-full w-64 flex-col border-r bg-white">
        <div className="flex h-18 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <img src="/retapLogo.png" alt="ReTap Logo" className="h-20 w-auto" />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const isDisabled = item.requiresSubscription && !isLoading && !shouldShowAllSections;
            
            const linkContent = (
              <div className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all relative",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isDisabled
                  ? "text-muted-foreground/40 hover:bg-muted/30 cursor-not-allowed blur-[0.5px]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <item.icon className={cn("h-4 w-4", isDisabled && "opacity-50")} />
                <span className={cn(isDisabled && "opacity-60")}>{item.name}</span>
                {isDisabled && (
                  <div className="ml-auto flex items-center gap-1">
                    <Lock className="h-3 w-3 text-muted-foreground/60" />
                    <Crown className="h-3 w-3 text-yellow-500" />
                  </div>
                )}
              </div>
            );

            if (isDisabled) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <div className="cursor-not-allowed">
                      {linkContent}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="text-center">
                      <p className="font-medium text-sm">Premium Feature</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upgrade to access {item.name.toLowerCase()} and all premium features
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link key={item.name} href={item.href}>
                {linkContent}
              </Link>
            );
          })}
        </nav>
        
        {/* Indicatore stato abbonamento */}
        <SubscriptionStatus />
        
        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
} 