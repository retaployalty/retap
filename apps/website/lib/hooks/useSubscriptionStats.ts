import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface SubscriptionStats {
  total_cards: number;
  cards_this_month: number;
  plan_limit: number;
  usage_percentage: number;
}

export interface SubscriptionHistory {
  plan_type: string;
  billing_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  payment_amount: number | null;
  payment_status: string | null;
  payment_date: string | null;
}

export function useSubscriptionStats(userId: string | null) {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Ottieni le statistiche di utilizzo
        let usageData = null;
        try {
          const { data, error: usageError } = await (supabase as any)
            .rpc('get_subscription_usage', { profile_id: userId });

          if (usageError) {
            console.warn('Errore nel recupero delle statistiche di utilizzo:', usageError);
            // Usa dati di fallback
            usageData = [{
              total_cards: 0,
              cards_this_month: 0,
              plan_limit: 100,
              usage_percentage: 0
            }];
          } else {
            usageData = data;
          }
        } catch (usageError) {
          console.warn('Errore nell\'esecuzione della funzione get_subscription_usage:', usageError);
          // Usa dati di fallback
          usageData = [{
            total_cards: 0,
            cards_this_month: 0,
            plan_limit: 100,
            usage_percentage: 0
          }];
        }

        // Ottieni la cronologia degli abbonamenti
        let historyData = [];
        try {
          const { data, error: historyError } = await (supabase as any)
            .rpc('get_subscription_history', { profile_id: userId });

          if (historyError) {
            console.warn('Errore nel recupero della cronologia:', historyError);
            // Usa dati di fallback
            historyData = [];
          } else {
            historyData = data || [];
          }
        } catch (historyError) {
          console.warn('Errore nell\'esecuzione della funzione get_subscription_history:', historyError);
          // Usa dati di fallback
          historyData = [];
        }

        // Se non abbiamo dati di utilizzo, prova a recuperarli direttamente
        if (!usageData || usageData.length === 0) {
          try {
            // Recupera direttamente le carte dell'utente
            const { data: cardsData, error: cardsError } = await (supabase as any)
              .from('cards')
              .select('created_at')
              .in('merchant_id', 
                (await (supabase as any)
                  .from('merchants')
                  .select('id')
                  .eq('profile_id', userId)
                ).data?.map((m: any) => m.id) || []
              );

            if (!cardsError && cardsData) {
              const totalCards = cardsData.length;
              const cardsThisMonth = cardsData.filter((card: any) => 
                new Date(card.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              ).length;

              usageData = [{
                total_cards: totalCards,
                cards_this_month: cardsThisMonth,
                plan_limit: 100,
                usage_percentage: Math.round((cardsThisMonth / 100) * 100)
              }];
            }
          } catch (directError) {
            console.warn('Errore nel recupero diretto delle carte:', directError);
            usageData = [{
              total_cards: 0,
              cards_this_month: 0,
              plan_limit: 100,
              usage_percentage: 0
            }];
          }
        }

        setStats(usageData?.[0] || null);
        setHistory(historyData || []);
        setIsLoading(false);

      } catch (error) {
        console.error('Errore generale nel recupero delle statistiche:', error);
        setError(error instanceof Error ? error.message : 'Errore sconosciuto');
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [userId]);

  return { stats, history, isLoading, error };
} 