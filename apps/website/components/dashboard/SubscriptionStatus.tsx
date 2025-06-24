"use client";

import { Badge } from "@/components/ui/badge";
import { useSubscriptionStatus } from "@/lib/hooks/useSubscriptionStatus";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export function SubscriptionStatus() {
  const { hasActiveSubscription, isLoading } = useSubscriptionStatus();

  if (isLoading) {
    return (
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />
          <span className="text-xs text-muted-foreground">Checking subscription...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border-t">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Subscription Status</span>
        <Badge 
          variant={hasActiveSubscription ? "default" : "secondary"}
          className="text-xs"
        >
          {hasActiveSubscription ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
      </div>
    </div>
  );
} 