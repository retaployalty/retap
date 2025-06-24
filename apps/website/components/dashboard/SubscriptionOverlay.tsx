"use client";

import { Lock, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SubscriptionOverlayProps {
  children: React.ReactNode;
  isBlocked: boolean;
}

export function SubscriptionOverlay({ children, isBlocked }: SubscriptionOverlayProps) {
  if (!isBlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Contenuto originale leggermente oscurato ma visibile */}
      <div className="blur-[1px] opacity-60 pointer-events-none">
        {children}
      </div>
      
      {/* Overlay minimo e non invasivo */}
      <div className="absolute top-4 right-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Subscription Required</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Activate your subscription to interact with all dashboard features.
          </p>
          
          <Link
            href="/dashboard/tutorial"
            className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Activate Subscription
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
} 