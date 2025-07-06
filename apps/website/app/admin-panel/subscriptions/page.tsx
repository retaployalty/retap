"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  BarChart3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Subscription {
  id: string;
  plan_type: string;
  billing_type: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  merchant: {
    id: string;
    name: string;
    profile: {
      email: string;
      first_name: string;
      last_name: string;
    };
  };
  payment?: {
    amount: number;
    status: string;
    created_at: string;
  };
}

interface SubscriptionStats {
  total: number;
  active: number;
  cancelled: number;
  expired: number;
  pending: number;
  revenue: {
    monthly: number;
    annual: number;
    total: number;
  };
  byPlan: { [key: string]: number };
  byBilling: { [key: string]: number };
  churnRate: number;
  mrr: number;
  arr: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBilling, setSelectedBilling] = useState<string>("all");
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    cancelled: 0,
    expired: 0,
    pending: 0,
    revenue: { monthly: 0, annual: 0, total: 0 },
    byPlan: {},
    byBilling: {},
    churnRate: 0,
    mrr: 0,
    arr: 0
  });
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      // Prima carica tutti i merchant con i loro profile_id
      const { data: merchantsData, error: merchantsError } = await supabase
        .from("merchants")
        .select("id, name, profile_id, profile:profiles(email, first_name, last_name)")
        .order("created_at", { ascending: false });

      if (merchantsError) throw merchantsError;

      console.log("Merchants loaded:", merchantsData?.length || 0);

      // Poi carica tutte le subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      console.log("Subscriptions loaded:", subscriptionsData?.length || 0);

      // Combina i dati: per ogni subscription, trova il merchant corrispondente
      const subscriptionsWithMerchants = (subscriptionsData || []).map(subscription => {
        const merchant = merchantsData?.find(m => m.profile_id === subscription.profile_id);
        
        return {
          ...subscription,
          merchant: merchant ? {
            id: merchant.id,
            name: merchant.name,
            profile: merchant.profile
          } : {
            id: 'unknown',
            name: 'Merchant non trovato',
            profile: {
              email: 'N/A',
              first_name: 'N/A',
              last_name: 'N/A'
            }
          },
          payment: {
            amount: subscription.plan_type === 'base' ? 29 : subscription.plan_type === 'premium' ? 79 : 199,
            status: 'completed',
            created_at: subscription.created_at
          }
        };
      });

      console.log("Combined subscriptions:", subscriptionsWithMerchants.length);

      if (subscriptionsWithMerchants.length === 0) {
        setSubscriptions([]);
        setStats({
          total: 0,
          active: 0,
          cancelled: 0,
          expired: 0,
          pending: 0,
          revenue: { monthly: 0, annual: 0, total: 0 },
          byPlan: {},
          byBilling: {},
          churnRate: 0,
          mrr: 0,
          arr: 0
        });
        return;
      }
      
      setSubscriptions(subscriptionsWithMerchants);
      calculateStats(subscriptionsWithMerchants);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (subscriptionsData: Subscription[]) => {
    const planCount: { [key: string]: number } = {};
    const billingCount: { [key: string]: number } = {};
    let active = 0;
    let cancelled = 0;
    let expired = 0;
    let pending = 0;
    let monthlyRevenue = 0;
    let annualRevenue = 0;

    subscriptionsData.forEach(subscription => {
      // Conta per piano
      planCount[subscription.plan_type] = (planCount[subscription.plan_type] || 0) + 1;
      
      // Conta per fatturazione
      billingCount[subscription.billing_type] = (billingCount[subscription.billing_type] || 0) + 1;
      
      // Conta per stato
      switch (subscription.status) {
        case 'active':
          active++;
          break;
        case 'cancelled':
          cancelled++;
          break;
        case 'expired':
          expired++;
          break;
        case 'pending':
          pending++;
          break;
      }

      // Calcola revenue
      if (subscription.payment) {
        if (subscription.billing_type === 'monthly') {
          monthlyRevenue += subscription.payment.amount || 0;
        } else if (subscription.billing_type === 'annual') {
          annualRevenue += subscription.payment.amount || 0;
        }
      }
    });

    const totalRevenue = monthlyRevenue + annualRevenue;
    const mrr = monthlyRevenue + (annualRevenue / 12);
    const arr = mrr * 12;
    const churnRate = subscriptionsData.length > 0 ? (cancelled / subscriptionsData.length) * 100 : 0;

    setStats({
      total: subscriptionsData.length,
      active,
      cancelled,
      expired,
      pending,
      revenue: { monthly: monthlyRevenue, annual: annualRevenue, total: totalRevenue },
      byPlan: planCount,
      byBilling: billingCount,
      churnRate,
      mrr,
      arr
    });
  };

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch = 
      subscription.merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscription.merchant.profile.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlan = selectedPlan === "all" || subscription.plan_type === selectedPlan;
    const matchesStatus = selectedStatus === "all" || subscription.status === selectedStatus;
    const matchesBilling = selectedBilling === "all" || subscription.billing_type === selectedBilling;

    return matchesSearch && matchesPlan && matchesStatus && matchesBilling;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "base":
        return "bg-blue-100 text-blue-800";
      case "premium":
        return "bg-purple-100 text-purple-800";
      case "top":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (confirm("Sei sicuro di voler cancellare questo abbonamento?")) {
      try {
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: 'cancelled' })
          .eq("id", subscriptionId);
        
        if (error) throw error;
        loadSubscriptions(); // Ricarica la lista
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        alert("Errore durante la cancellazione dell'abbonamento");
      }
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    if (confirm("Sei sicuro di voler riattivare questo abbonamento?")) {
      try {
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: 'active' })
          .eq("id", subscriptionId);
        
        if (error) throw error;
        loadSubscriptions(); // Ricarica la lista
      } catch (error) {
        console.error("Error reactivating subscription:", error);
        alert("Errore durante la riattivazione dell'abbonamento");
      }
    }
  };

  const sendEmailToMerchant = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const exportSubscriptions = () => {
    const csvContent = [
      ['Negozio', 'Email', 'Piano', 'Fatturazione', 'Stato', 'Data Inizio', 'Data Fine', 'Importo'],
      ...filteredSubscriptions.map(sub => [
        sub.merchant.name,
        sub.merchant.profile.email,
        sub.plan_type,
        sub.billing_type,
        sub.status,
        new Date(sub.start_date).toLocaleDateString(),
        sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '-',
        `€${sub.payment?.amount || 0}`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestisci gli abbonamenti e monitora le revenue
        </p>
      </div>

      {/* Statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Abbonamenti</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{stats.mrr.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Monthly Recurring Revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">€{stats.arr.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Annual Recurring Revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Tasso di abbandono
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Lista Abbonamenti</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista Abbonamenti</CardTitle>
                <div className="flex items-center gap-4">
                  {/* Filtri */}
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtra per piano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i piani</SelectItem>
                      {Object.keys(stats.byPlan).map(plan => (
                        <SelectItem key={plan} value={plan}>
                          {plan} ({stats.byPlan[plan]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtra per stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      <SelectItem value="active">Attivi</SelectItem>
                      <SelectItem value="cancelled">Cancellati</SelectItem>
                      <SelectItem value="expired">Scaduti</SelectItem>
                      <SelectItem value="pending">In attesa</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedBilling} onValueChange={setSelectedBilling}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtra per fatturazione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le fatturazioni</SelectItem>
                      <SelectItem value="monthly">Mensile</SelectItem>
                      <SelectItem value="annual">Annuale</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cerca abbonamento..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-[300px]"
                    />
                  </div>

                  <Button variant="outline" onClick={exportSubscriptions}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negozio</TableHead>
                    <TableHead>Contatti</TableHead>
                    <TableHead>Piano</TableHead>
                    <TableHead>Fatturazione</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.merchant.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.merchant.profile.first_name} {subscription.merchant.profile.last_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendEmailToMerchant(subscription.merchant.profile.email)}
                            className="h-6 w-6 p-0"
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                          <div className="text-sm">
                            {subscription.merchant.profile.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanColor(subscription.plan_type)}>
                          {subscription.plan_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {subscription.billing_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                          {subscription.status === 'active' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {subscription.status === 'cancelled' && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(subscription.start_date).toLocaleDateString()}
                          </div>
                          {subscription.end_date && (
                            <div className="text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(subscription.end_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          €{subscription.payment?.amount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {subscription.billing_type === 'monthly' ? 'Mensile' : 'Annuale'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSubscription(subscription)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizza dettagli
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendEmailToMerchant(subscription.merchant.profile.email)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Invia email
                            </DropdownMenuItem>
                            {subscription.status === 'active' && (
                              <DropdownMenuItem 
                                onClick={() => handleCancelSubscription(subscription.id)}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancella
                              </DropdownMenuItem>
                            )}
                            {subscription.status === 'cancelled' && (
                              <DropdownMenuItem 
                                onClick={() => handleReactivateSubscription(subscription.id)}
                                className="text-green-600"
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Riattiva
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredSubscriptions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nessun abbonamento trovato</p>
                  <p className="text-sm">
                    {subscriptions.length === 0 
                      ? "Non ci sono ancora abbonamenti nel database" 
                      : "Prova a modificare i criteri di ricerca"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione per Piano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byPlan)
                    .sort(([,a], [,b]) => b - a)
                    .map(([plan, count]) => (
                      <div key={plan} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{plan}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(count / stats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuzione per Fatturazione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byBilling)
                    .sort(([,a], [,b]) => b - a)
                    .map(([billing, count]) => (
                      <div key={billing} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{billing}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(count / stats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">€{stats.revenue.monthly.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Revenue Mensile</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">€{stats.revenue.annual.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Revenue Annuale</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">€{stats.revenue.total.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Revenue Totale</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog per dettagli abbonamento */}
      <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Abbonamento</DialogTitle>
            <DialogDescription>
              Informazioni complete sull'abbonamento selezionato
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informazioni Negozio</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nome:</strong> {selectedSubscription.merchant.name}</div>
                    <div><strong>Proprietario:</strong> {selectedSubscription.merchant.profile.first_name} {selectedSubscription.merchant.profile.last_name}</div>
                    <div><strong>Email:</strong> {selectedSubscription.merchant.profile.email}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Informazioni Abbonamento</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Piano:</strong> <Badge className={getPlanColor(selectedSubscription.plan_type)}>{selectedSubscription.plan_type}</Badge></div>
                    <div><strong>Fatturazione:</strong> <Badge variant="outline" className="capitalize">{selectedSubscription.billing_type}</Badge></div>
                    <div><strong>Stato:</strong> <Badge className={getStatusColor(selectedSubscription.status)}>{selectedSubscription.status}</Badge></div>
                    <div><strong>Stripe ID:</strong> {selectedSubscription.stripe_subscription_id || "N/A"}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Date e Pagamenti</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium">Data Inizio</div>
                    <div className="text-lg">{new Date(selectedSubscription.start_date).toLocaleDateString()}</div>
                  </div>
                  {selectedSubscription.end_date && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium">Data Fine</div>
                      <div className="text-lg">{new Date(selectedSubscription.end_date).toLocaleDateString()}</div>
                    </div>
                  )}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium">Importo</div>
                    <div className="text-lg font-bold">€{selectedSubscription.payment?.amount || 0}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium">Stato Pagamento</div>
                    <div className="text-lg">{selectedSubscription.payment?.status || "N/A"}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedSubscription(null)}>
                  Chiudi
                </Button>
                <Button onClick={() => sendEmailToMerchant(selectedSubscription.merchant.profile.email)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Invia Email
                </Button>
                {selectedSubscription.status === 'active' && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleCancelSubscription(selectedSubscription.id)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancella
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 