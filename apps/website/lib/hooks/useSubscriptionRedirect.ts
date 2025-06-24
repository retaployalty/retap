"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export function useSubscriptionRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasActiveSubscription, isLoading } = useSubscriptionStatus();

  useEffect(() => {
    // Non fare nulla se stiamo ancora caricando
    if (isLoading) return;

    // Pagine sempre accessibili
    const alwaysAccessiblePages = ['/dashboard/tutorial', '/dashboard/settings'];
    const isAlwaysAccessible = alwaysAccessiblePages.includes(pathname);

    // Se l'utente non ha un abbonamento attivo e non è in una pagina sempre accessibile
    if (!hasActiveSubscription && !isAlwaysAccessible) {
      // Reindirizza al tutorial
      router.push('/dashboard/tutorial');
    }
  }, [hasActiveSubscription, isLoading, pathname, router]);

  return { hasActiveSubscription, isLoading };
} 