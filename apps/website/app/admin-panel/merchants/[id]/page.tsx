"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import ReactCalendar from "react-calendar";
import { format, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building,
  Users,
  CreditCard,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Gift,
  Target,
  BarChart3,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  Clock,
  Star,
  Activity
} from "lucide-react";

interface Merchant {
  id: string;
  name: string;
  country: string;
  industry: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  phone: string;
  logo_url: string;
  profile: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  };
  subscription?: {
    plan_type: string;
    status: string;
    end_date: string;
  };
  cardAllocation?: {
    total_cards_allocated: number;
    cards_distributed: number;
    cards_available: number;
    last_allocation_date: string;
  };
}

interface Reward {
  id: string;
  name: string;
  description: string;
  price_coins: number;
  is_active: boolean;
  created_at: string;
  redeemed_count: number;
  total_points_spent: number;
}

interface CheckpointReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
  redeemed_count: number;
}

interface CheckpointOffer {
  id: string;
  name: string;
  description: string;
  total_steps: number;
  created_at: string;
  active_customers: number;
  completions: number;
}

interface Transaction {
  id: string;
  points: number;
  created_at: string;
  customer_name: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_points: number;
  last_transaction: string;
  total_transactions: number;
}

interface CalendarEvent {
  date: Date;
  type: 'transaction' | 'card_issued';
  count: number;
  details: string[];
}

export default function MerchantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.id as string;
  const supabase = createClientComponentClient();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [checkpointRewards, setCheckpointRewards] = useState<CheckpointReward[]>([]);
  const [checkpointOffers, setCheckpointOffers] = useState<CheckpointOffer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardAllocationDialog, setCardAllocationDialog] = useState(false);
  const [newCardAllocation, setNewCardAllocation] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (merchantId) {
      loadMerchantData();
    }
  }, [merchantId]);

  const loadMerchantData = async () => {
    try {
      setLoading(true);

      // Carica dati del merchant (semplificato)
      const { data: merchantData, error: merchantError } = await supabase
        .from("merchants")
        .select(`
          *,
          profile:profiles(email, first_name, last_name, phone_number)
        `)
        .eq("id", merchantId)
        .single();

      if (merchantError) {
        console.error("Merchant error:", merchantError);
        throw merchantError;
      }

      // Carica allocazione carte (se la tabella esiste)
      let cardAllocation = null;
      try {
        const { data: allocationData } = await supabase
          .from("merchant_card_allocation")
          .select("*")
          .eq("merchant_id", merchantId)
          .single();
        cardAllocation = allocationData;
      } catch (error) {
        console.log("Card allocation table not available yet:", error);
        // Se la tabella non esiste, usa valori di default
        cardAllocation = {
          total_cards_allocated: 100,
          cards_distributed: 0,
          cards_available: 100,
          last_allocation_date: null
        };
      }

      setMerchant({
        ...merchantData,
        cardAllocation
      });

      // Carica rewards (semplificato)
      try {
        const { data: rewardsData } = await supabase
          .from("rewards")
          .select("*")
          .eq("merchant_id", merchantId);

        if (rewardsData) {
          const rewardsWithStats = await Promise.all(
            rewardsData.map(async (reward) => {
              try {
                const { data: redeemedData } = await supabase
                  .from("redeemed_rewards")
                  .select("points_spent")
                  .eq("reward_id", reward.id);

                const redeemedCount = redeemedData?.length || 0;
                const totalPointsSpent = redeemedData?.reduce((sum, r) => sum + r.points_spent, 0) || 0;

                return {
                  ...reward,
                  redeemed_count: redeemedCount,
                  total_points_spent: totalPointsSpent
                };
              } catch (error) {
                console.log("Error loading reward stats:", error);
                return {
                  ...reward,
                  redeemed_count: 0,
                  total_points_spent: 0
                };
              }
            })
          );
          setRewards(rewardsWithStats);
        }
      } catch (error) {
        console.log("Error loading rewards:", error);
        setRewards([]);
      }

      // Carica checkpoint rewards (semplificato)
      try {
        const { data: checkpointRewardsData } = await supabase
          .from("checkpoint_rewards")
          .select("*")
          .eq("merchant_id", merchantId);

        if (checkpointRewardsData) {
          setCheckpointRewards(checkpointRewardsData.map(reward => ({
            ...reward,
            redeemed_count: 0 // Semplificato per ora
          })));
        }
      } catch (error) {
        console.log("Error loading checkpoint rewards:", error);
        setCheckpointRewards([]);
      }

      // Carica checkpoint offers (semplificato)
      try {
        const { data: offersData } = await supabase
          .from("checkpoint_offers")
          .select("*")
          .eq("merchant_id", merchantId);

        if (offersData) {
          setCheckpointOffers(offersData.map(offer => ({
            ...offer,
            active_customers: 0, // Semplificato per ora
            completions: 0
          })));
        }
      } catch (error) {
        console.log("Error loading checkpoint offers:", error);
        setCheckpointOffers([]);
      }

      // Carica transazioni recenti con nomi clienti
      try {
        const { data: transactionsData } = await supabase
          .from("transactions")
          .select(`
            *,
            card_merchants(
              cards(
                customers(
                  first_name,
                  last_name
                )
              )
            )
          `)
          .in("card_merchant_id", 
            (await supabase
              .from("card_merchants")
              .select("id")
              .eq("merchant_id", merchantId)
            ).data?.map(cm => cm.id) || []
          )
          .order("created_at", { ascending: false })
          .limit(20);

        if (transactionsData) {
          setTransactions(transactionsData.map(t => ({
            id: t.id,
            points: t.points,
            created_at: t.created_at,
            customer_name: t.card_merchants?.cards?.customers 
              ? `${t.card_merchants.cards.customers.first_name || ''} ${t.card_merchants.cards.customers.last_name || ''}`.trim() 
              : 'Cliente anonimo'
          })));
        }
      } catch (error) {
        console.log("Error loading transactions:", error);
        setTransactions([]);
      }

      // Carica dati per il calendario (transazioni e carte emesse)
      try {
        // Carica tutte le transazioni per il calendario
        const { data: allTransactionsData } = await supabase
          .from("transactions")
          .select(`
            created_at,
            points,
            card_merchants(
              cards(
                customers(
                  first_name,
                  last_name
                )
              )
            )
          `)
          .in("card_merchant_id", 
            (await supabase
              .from("card_merchants")
              .select("id")
              .eq("merchant_id", merchantId)
            ).data?.map(cm => cm.id) || []
          )
          .order("created_at", { ascending: false });

        // Carica tutte le carte emesse da questo merchant
        const { data: cardsData } = await supabase
          .from("cards")
          .select(`
            created_at,
            uid
          `)
          .eq("issuing_merchant_id", merchantId)
          .order("created_at", { ascending: false });

        // Combina i dati per creare gli eventi del calendario
        const eventsMap = new Map<string, CalendarEvent>();

        // Aggiungi transazioni
        allTransactionsData?.forEach(transaction => {
          const dateKey = format(new Date(transaction.created_at), 'yyyy-MM-dd');
          const event = eventsMap.get(dateKey) || {
            date: new Date(transaction.created_at),
            type: 'transaction',
            count: 0,
            details: []
          };
          
          event.count += 1;
          const customerName = transaction.card_merchants?.[0]?.cards?.[0]?.customers?.[0]
            ? `${transaction.card_merchants[0].cards[0].customers[0].first_name || ''} ${transaction.card_merchants[0].cards[0].customers[0].last_name || ''}`.trim() 
            : 'Cliente anonimo';
          event.details.push(`${customerName}: ${transaction.points > 0 ? '+' : ''}${transaction.points} punti`);
          
          eventsMap.set(dateKey, event);
        });

        // Aggiungi carte emesse
        cardsData?.forEach(card => {
          const dateKey = format(new Date(card.created_at), 'yyyy-MM-dd');
          const existingEvent = eventsMap.get(dateKey);
          
          if (existingEvent) {
            // Se c'è già un evento per questa data, aggiungi le carte emesse
            existingEvent.details.push(`Carta emessa: ${card.uid}`);
          } else {
            // Crea un nuovo evento per le carte emesse
            eventsMap.set(dateKey, {
              date: new Date(card.created_at),
              type: 'card_issued',
              count: 1,
              details: [`Carta emessa: ${card.uid}`]
            });
          }
        });

        setCalendarEvents(Array.from(eventsMap.values()));
      } catch (error) {
        console.log("Error loading calendar data:", error);
        setCalendarEvents([]);
      }

      // Carica clienti che hanno avuto transazioni in questo business
      try {
        // Prima ottieni tutti i card_merchant_id per questo merchant
        const { data: cardMerchants } = await supabase
          .from("card_merchants")
          .select("id")
          .eq("merchant_id", merchantId);

        if (cardMerchants && cardMerchants.length > 0) {
          // Poi ottieni le transazioni per questi card_merchant
          const { data: transactionsForCustomers } = await supabase
            .from("transactions")
            .select(`
              *,
              card_merchants(
                cards(
                  customers(
                    id,
                    first_name,
                    last_name,
                    email,
                    created_at
                  )
                )
              )
            `)
            .in("card_merchant_id", cardMerchants.map(cm => cm.id))
            .order("created_at", { ascending: false });

          if (transactionsForCustomers) {
            // Raggruppa per customer e calcola le statistiche
            const customerMap = new Map();
            
            transactionsForCustomers.forEach(transaction => {
              const customer = transaction.card_merchants?.cards?.customers;
              if (customer) {
                if (!customerMap.has(customer.id)) {
                  customerMap.set(customer.id, {
                    id: customer.id,
                    first_name: customer.first_name || '',
                    last_name: customer.last_name || '',
                    email: customer.email || '',
                    total_points: 0,
                    last_transaction: transaction.created_at,
                    total_transactions: 0
                  });
                }
                
                const customerData = customerMap.get(customer.id);
                customerData.total_points += transaction.points || 0;
                customerData.total_transactions += 1;
                
                // Aggiorna l'ultima transazione se questa è più recente
                if (new Date(transaction.created_at) > new Date(customerData.last_transaction)) {
                  customerData.last_transaction = transaction.created_at;
                }
              }
            });

            setCustomers(Array.from(customerMap.values()));
          } else {
            setCustomers([]);
          }
        } else {
          setCustomers([]);
        }
      } catch (error) {
        console.log("Error loading customers:", error);
        setCustomers([]);
      }

    } catch (error) {
      console.error("Error loading merchant data:", error);
      toast.error("Errore nel caricamento dei dati del merchant");
    } finally {
      setLoading(false);
    }
  };

  const updateCardAllocation = async () => {
    try {
      const newAllocation = Number(newCardAllocation);
      if (isNaN(newAllocation) || newAllocation < (merchant?.cardAllocation?.cards_distributed || 0)) {
        toast.error("Inserisci un numero valido maggiore o uguale alle carte distribuite");
        return;
      }

      // Prova ad aggiornare la tabella se esiste
      try {
        const { error } = await supabase
          .from("merchant_card_allocation")
          .update({
            total_cards_allocated: newAllocation,
            cards_available: newAllocation - (merchant?.cardAllocation?.cards_distributed || 0),
            last_allocation_date: new Date().toISOString()
          })
          .eq("merchant_id", merchantId);

        if (error) throw error;
      } catch (error) {
        console.log("Card allocation table not available:", error);
        toast.error("La tabella di allocazione carte non è ancora disponibile. Esegui prima la migration.");
        return;
      }

      await loadMerchantData();
      setCardAllocationDialog(false);
      setNewCardAllocation("");
      toast.success("Allocazione carte aggiornata con successo");
    } catch (error) {
      console.error("Error updating card allocation:", error);
      toast.error("Errore nell'aggiornamento dell'allocazione");
    }
  };

  const sendEmailToMerchant = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Merchant non trovato</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla lista
        </Button>
        
        <div className="flex items-center gap-4">
          {merchant.logo_url && (
            <img 
              src={merchant.logo_url} 
              alt={merchant.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{merchant.name}</h1>
            <p className="text-gray-600">{merchant.industry} • {merchant.country}</p>
          </div>
        </div>
      </div>

      {/* Statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carte Allocate</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchant.cardAllocation?.total_cards_allocated || 100}</div>
            <p className="text-xs text-muted-foreground">
              {merchant.cardAllocation?.cards_distributed || 0} distribuite, {merchant.cardAllocation?.cards_available || 100} disponibili
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewCardAllocation((merchant.cardAllocation?.total_cards_allocated || 100).toString());
                setCardAllocationDialog(true);
              }}
              className="mt-2"
            >
              <Edit className="h-3 w-3 mr-1" />
              Modifica
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clienti Attivi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {customers.filter(c => {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                return new Date(c.last_transaction) > thirtyDaysAgo;
              }).length} attivi questo mese
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards.length}</div>
            <p className="text-xs text-muted-foreground">
              {rewards.filter(r => r.is_active).length} attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checkpoint Offers</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkpointOffers.length}</div>
            <p className="text-xs text-muted-foreground">
              {checkpointOffers.reduce((sum, o) => sum + o.active_customers, 0)} partecipanti totali
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punti Totali</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.reduce((sum, c) => sum + c.total_points, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.length} transazioni totali
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
          <TabsTrigger value="customers">Clienti</TabsTrigger>
          <TabsTrigger value="transactions">Transazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informazioni merchant */}
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Negozio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome</label>
                    <p className="text-sm">{merchant.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Settore</label>
                    <p className="text-sm">{merchant.industry}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Paese</label>
                    <p className="text-sm">{merchant.country}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefono</label>
                    <p className="text-sm">{merchant.phone || "Non specificato"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Indirizzo</label>
                  <p className="text-sm">{merchant.address}</p>
                </div>
                {merchant.latitude && merchant.longitude && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Coordinate</label>
                    <p className="text-sm">{merchant.latitude}, {merchant.longitude}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informazioni proprietario */}
            <Card>
              <CardHeader>
                <CardTitle>Proprietario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome</label>
                    <p className="text-sm">{merchant.profile.first_name} {merchant.profile.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{merchant.profile.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefono</label>
                    <p className="text-sm">{merchant.profile.phone_number || "Non specificato"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registrato</label>
                    <p className="text-sm">{new Date(merchant.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendEmailToMerchant(merchant.profile.email)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Invia Email
                  </Button>
                  {merchant.profile.phone_number && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`tel:${merchant.profile.phone_number}`, '_blank')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Chiama
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Abbonamento */}
          {merchant.subscription && (
            <Card>
              <CardHeader>
                <CardTitle>Abbonamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Piano</label>
                    <p className="text-sm capitalize">{merchant.subscription.plan_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Stato</label>
                    <Badge variant={merchant.subscription.status === 'active' ? 'default' : 'secondary'}>
                      {merchant.subscription.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Scadenza</label>
                    <p className="text-sm">
                      {merchant.subscription.end_date 
                        ? new Date(merchant.subscription.end_date).toLocaleDateString('it-IT')
                        : 'Nessuna scadenza'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistiche rewards */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiche Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rewards totali:</span>
                    <span className="font-medium">{rewards.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rewards attivi:</span>
                    <span className="font-medium">{rewards.filter(r => r.is_active).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Riscatti totali:</span>
                    <span className="font-medium">{rewards.reduce((sum, r) => sum + r.redeemed_count, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Punti spesi totali:</span>
                    <span className="font-medium">{rewards.reduce((sum, r) => sum + r.total_points_spent, 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance rewards */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                {rewards.length > 0 ? (
                  <div className="space-y-3">
                    {rewards
                      .sort((a, b) => b.redeemed_count - a.redeemed_count)
                      .slice(0, 5)
                      .map((reward) => (
                        <div key={reward.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{reward.name}</div>
                            <div className="text-xs text-gray-500">{reward.redeemed_count} riscatti</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{reward.total_points_spent}</div>
                            <div className="text-xs text-gray-500">punti spesi</div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Nessun reward configurato</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista Rewards ({rewards.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {rewards.length > 0 ? (
                <div className="space-y-4">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{reward.name}</h4>
                          <p className="text-sm text-gray-600">{reward.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline">{reward.price_coins} punti</Badge>
                            <Badge variant={reward.is_active ? "default" : "secondary"}>
                              {reward.is_active ? "Attivo" : "Inattivo"}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {reward.redeemed_count} riscatti
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Punti spesi</div>
                          <div className="font-medium">{reward.total_points_spent}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nessun reward configurato</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkpoints" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Checkpoint Rewards */}
            <Card>
              <CardHeader>
                <CardTitle>Checkpoint Rewards ({checkpointRewards.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {checkpointRewards.length > 0 ? (
                  <div className="space-y-4">
                    {checkpointRewards.map((reward) => (
                      <div key={reward.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Gift className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{reward.name}</h4>
                            <p className="text-sm text-gray-600">{reward.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{reward.redeemed_count} riscatti</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nessun checkpoint reward configurato</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Checkpoint Offers */}
            <Card>
              <CardHeader>
                <CardTitle>Checkpoint Offers ({checkpointOffers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {checkpointOffers.length > 0 ? (
                  <div className="space-y-4">
                    {checkpointOffers.map((offer) => (
                      <div key={offer.id} className="border rounded-lg p-4">
                        <div>
                          <h4 className="font-medium">{offer.name}</h4>
                          <p className="text-sm text-gray-600">{offer.description}</p>
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div className="text-center">
                              <div className="text-lg font-bold">{offer.total_steps}</div>
                              <div className="text-xs text-gray-500">Step totali</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold">{offer.active_customers}</div>
                              <div className="text-xs text-gray-500">Partecipanti</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold">{offer.completions}</div>
                              <div className="text-xs text-gray-500">Completamenti</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nessuna checkpoint offer configurata</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Clienti ({customers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {customers.length > 0 ? (
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {customer.first_name} {customer.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline">{customer.total_points} punti</Badge>
                            <Badge variant="secondary">{customer.total_transactions} transazioni</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Ultima transazione</div>
                          <div className="text-sm">
                            {customer.last_transaction 
                              ? new Date(customer.last_transaction).toLocaleDateString('it-IT')
                              : 'Mai'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nessun cliente registrato</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Calendario delle Attività */}
          <Card>
            <CardHeader>
              <CardTitle>Calendario delle Attività</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualizza transazioni e carte emesse nel tempo
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ReactCalendar
                    onChange={(value) => {
                      if (value instanceof Date) {
                        setSelectedDate(value);
                      }
                    }}
                    value={selectedDate}
                    locale="it-IT"
                    tileContent={({ date, view }) => {
                      if (view === 'month') {
                        const event = calendarEvents.find(e => isSameDay(e.date, date));
                        if (event) {
                          return (
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mb-1"></div>
                              <span className="text-xs text-blue-600 font-medium">{event.count}</span>
                            </div>
                          );
                        }
                      }
                      return null;
                    }}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Legenda</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Transazioni e carte emesse</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Carte emesse</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedDate && (
                    <div>
                      <h4 className="font-medium mb-2">
                        Attività del {format(selectedDate, 'dd MMMM yyyy', { locale: it })}
                      </h4>
                      {(() => {
                        const dayEvents = calendarEvents.filter(e => isSameDay(e.date, selectedDate));
                        if (dayEvents.length > 0) {
                          return (
                            <div className="space-y-2">
                              {dayEvents.map((event, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="font-medium text-sm">
                                    {event.count} attività
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {event.details.slice(0, 3).map((detail, i) => (
                                      <div key={i}>• {detail}</div>
                                    ))}
                                    {event.details.length > 3 && (
                                      <div className="text-blue-600">
                                        ... e altre {event.details.length - 3} attività
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center py-4 text-gray-500">
                              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Nessuna attività in questa data</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiche del Calendario */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiche Attività</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {calendarEvents.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Giorni con attività</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {calendarEvents.reduce((sum, event) => sum + event.count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Attività totali</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {calendarEvents.length > 0 
                      ? Math.round(calendarEvents.reduce((sum, event) => sum + event.count, 0) / calendarEvents.length * 10) / 10
                      : 0
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Media attività/giorno</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transazioni Recenti */}
          <Card>
            <CardHeader>
              <CardTitle>Transazioni Recenti ({transactions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{transaction.customer_name}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.created_at).toLocaleDateString('it-IT')} - {new Date(transaction.created_at).toLocaleTimeString('it-IT')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={transaction.points > 0 ? "default" : "secondary"}>
                            {transaction.points > 0 ? '+' : ''}{transaction.points} punti
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nessuna transazione registrata</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog per allocazione carte */}
      <Dialog open={cardAllocationDialog} onOpenChange={setCardAllocationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Allocazione Carte</DialogTitle>
            <DialogDescription>
              Modifica il numero di carte allocate per {merchant.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Attuale allocazione:</strong>
                <div className="text-lg font-bold">{merchant.cardAllocation?.total_cards_allocated || 100}</div>
              </div>
              <div>
                <strong>Carte distribuite:</strong>
                <div className="text-lg font-bold text-blue-600">{merchant.cardAllocation?.cards_distributed || 0}</div>
              </div>
              <div>
                <strong>Carte disponibili:</strong>
                <div className="text-lg font-bold text-green-600">{merchant.cardAllocation?.cards_available || 100}</div>
              </div>
              <div>
                <strong>Ultima modifica:</strong>
                <div className="text-sm">
                  {merchant.cardAllocation?.last_allocation_date 
                    ? new Date(merchant.cardAllocation.last_allocation_date).toLocaleDateString('it-IT')
                    : 'Mai'
                  }
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Nuova allocazione carte:
              </label>
              <Input
                type="number"
                min={merchant.cardAllocation?.cards_distributed || 0}
                value={newCardAllocation}
                onChange={(e) => setNewCardAllocation(e.target.value)}
                placeholder="Inserisci numero di carte"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimo: {merchant.cardAllocation?.cards_distributed || 0} (carte già distribuite)
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCardAllocationDialog(false)}
              >
                Annulla
              </Button>
              <Button onClick={updateCardAllocation}>
                Aggiorna Allocazione
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 