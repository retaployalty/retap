import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  plan_type: 'base' | 'premium' | 'top';
  billing_type: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: string;
  name: string;
  country: string;
  industry: string;
  address: string;
  logo_url: string | null;
  phone: string | null;
  hours: any;
  created_at: string;
}

export interface UserData {
  profile: UserProfile | null;
  subscription: Subscription | null;
  merchants: Merchant[];
  isLoading: boolean;
  error: string | null;
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData>({
    profile: null,
    subscription: null,
    merchants: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Ottieni l'utente corrente
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Utente non autenticato');
        }

        // Ottieni il profilo dell'utente
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Errore nel recupero del profilo:', profileError);
        }

        // Ottieni l'abbonamento corrente
        const { data: subscription, error: subscriptionError } = await supabase
          .rpc('get_current_subscription', { profile_id: user.id });

        if (subscriptionError) {
          console.error('Errore nel recupero dell\'abbonamento:', subscriptionError);
        }

        // Ottieni i merchant dell'utente
        const { data: merchants, error: merchantsError } = await supabase
          .from('merchants')
          .select('*')
          .eq('profile_id', user.id);

        if (merchantsError) {
          console.error('Errore nel recupero dei merchant:', merchantsError);
        }

        setUserData({
          profile: profile || null,
          subscription: subscription?.[0] || null,
          merchants: merchants || [],
          isLoading: false,
          error: null,
        });

      } catch (error) {
        console.error('Errore nel recupero dei dati utente:', error);
        setUserData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Errore sconosciuto',
        }));
      }
    }

    fetchUserData();
  }, []);

  return userData;
} 