import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSubscriptionStatus(): SubscriptionStatus {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    let isMounted = true;

    async function checkSubscriptionStatus() {
      try {
        // Ottieni la sessione dell'utente
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (!session?.user) {
          setHasActiveSubscription(false);
          setIsLoading(false);
          return;
        }

        // Verifica se l'utente ha un abbonamento attivo
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('status, end_date')
          .eq('profile_id', session.user.id)
          .eq('status', 'active')
          .single();

        if (!isMounted) return;

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, che è normale se non c'è abbonamento
          console.error('Errore nel controllo dell\'abbonamento:', subscriptionError);
          setError(subscriptionError.message);
        }

        if (subscription) {
          // Verifica se l'abbonamento non è scaduto
          const endDate = new Date(subscription.end_date);
          const now = new Date();
          setHasActiveSubscription(endDate > now);
        } else {
          setHasActiveSubscription(false);
        }

        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Errore nel controllo dello stato dell\'abbonamento:', err);
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
        setIsLoading(false);
      }
    }

    checkSubscriptionStatus();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return { hasActiveSubscription, isLoading, error };
} 