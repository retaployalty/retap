"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Globe, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Building,
  Filter,
  Download
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
  stats?: {
    total_cards: number;
    total_transactions: number;
    total_points: number;
    active_customers: number;
    last_transaction?: string;
  };
  cardAllocation?: {
    total_cards_allocated: number;
    cards_distributed: number;
    cards_available: number;
    last_allocation_date: string;
  };
}

interface MerchantStats {
  total: number;
  active: number;
  inactive: number;
  withCoordinates: number;
  withoutCoordinates: number;
  byIndustry: { [key: string]: number };
  byCountry: { [key: string]: number };
  recentSignups: number;
  churnRisk: number;
}

export default function MerchantsPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [stats, setStats] = useState<MerchantStats>({
    total: 0,
    active: 0,
    inactive: 0,
    withCoordinates: 0,
    withoutCoordinates: 0,
    byIndustry: {},
    byCountry: {},
    recentSignups: 0,
    churnRisk: 0
  });
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [cardAllocationDialog, setCardAllocationDialog] = useState<{
    open: boolean;
    merchant: Merchant | null;
    newAllocation: string;
  }>({
    open: false,
    merchant: null,
    newAllocation: ''
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      // Carica merchant con dati completi
      const { data: merchantsData, error: merchantsError } = await supabase
        .from("merchants")
        .select(`
          *,
          profile:profiles(email, first_name, last_name, phone_number),
          cardAllocation:merchant_card_allocation(*)
        `)
        .order("created_at", { ascending: false });

      if (merchantsError) throw merchantsError;

      console.log("Merchants loaded:", merchantsData?.length || 0);

      if (!merchantsData || merchantsData.length === 0) {
        setMerchants([]);
        setStats({
          total: 0,
          active: 0,
          inactive: 0,
          withCoordinates: 0,
          withoutCoordinates: 0,
          byIndustry: {},
          byCountry: {},
          recentSignups: 0,
          churnRisk: 0
        });
        return;
      }

      // Carica statistiche per ogni merchant
      const merchantsWithStats = await Promise.all(
        (merchantsData || []).map(async (merchant) => {
          // Query semplificata per le carte
          const { data: cardsData } = await supabase
            .from("cards")
            .select("id")
            .eq("issuing_merchant_id", merchant.id);

          // Query semplificata per le transazioni
          const { data: transactionsData } = await supabase
            .from("transactions")
            .select("points, card_merchant_id, created_at")
            .in("card_merchant_id", 
              (await supabase
                .from("card_merchants")
                .select("id")
                .eq("merchant_id", merchant.id)
              ).data?.map(cm => cm.id) || []
            )
            .order("created_at", { ascending: false });

          const totalPoints = transactionsData?.reduce((sum, t) => sum + (t.points || 0), 0) || 0;

          return {
            ...merchant,
            stats: {
              total_cards: cardsData?.length || 0,
              total_transactions: transactionsData?.length || 0,
              total_points: totalPoints,
              active_customers: transactionsData?.length || 0, // Semplificato per ora
              last_transaction: transactionsData && transactionsData.length > 0 
                ? transactionsData[0].created_at 
                : undefined
            }
          };
        })
      );

      setMerchants(merchantsWithStats);

      // Calcola statistiche globali
      calculateStats(merchantsWithStats);
    } catch (error) {
      console.error("Error loading merchants:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWellnessScore = (merchant: Merchant): { score: number; color: string; label: string } => {
    let score = 0;
    const factors: string[] = [];

    // Fattore 1: Attività recente (40% del punteggio)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (merchant.stats?.last_transaction) {
      const lastActivity = new Date(merchant.stats.last_transaction);
      if (lastActivity > sevenDaysAgo) {
        score += 40;
        factors.push("Attivo questa settimana");
      } else if (lastActivity > thirtyDaysAgo) {
        score += 20;
        factors.push("Attivo questo mese");
      } else {
        factors.push("Inattivo da 30+ giorni");
      }
    } else {
      factors.push("Mai attivo");
    }

    // Fattore 2: Utilizzo carte (25% del punteggio)
    const cardUsage = merchant.cardAllocation ? 
      (merchant.cardAllocation.cards_distributed / merchant.cardAllocation.total_cards_allocated) : 0;
    
    if (cardUsage > 0.7) {
      score += 25;
      factors.push("Alto utilizzo carte");
    } else if (cardUsage > 0.3) {
      score += 15;
      factors.push("Utilizzo carte medio");
    } else if (cardUsage > 0) {
      score += 5;
      factors.push("Basso utilizzo carte");
    } else {
      factors.push("Nessuna carta distribuita");
    }

    // Fattore 3: Volume transazioni (20% del punteggio)
    const transactionCount = merchant.stats?.total_transactions || 0;
    if (transactionCount > 50) {
      score += 20;
      factors.push("Alto volume transazioni");
    } else if (transactionCount > 20) {
      score += 15;
      factors.push("Volume transazioni buono");
    } else if (transactionCount > 5) {
      score += 10;
      factors.push("Volume transazioni basso");
    } else if (transactionCount > 0) {
      score += 5;
      factors.push("Poche transazioni");
    } else {
      factors.push("Nessuna transazione");
    }

    // Fattore 4: Punti accumulati (15% del punteggio)
    const totalPoints = merchant.stats?.total_points || 0;
    if (totalPoints > 1000) {
      score += 15;
      factors.push("Molti punti accumulati");
    } else if (totalPoints > 500) {
      score += 10;
      factors.push("Buoni punti accumulati");
    } else if (totalPoints > 100) {
      score += 5;
      factors.push("Pochi punti accumulati");
    } else {
      factors.push("Nessun punto accumulato");
    }

    // Determina colore e label
    let color = "bg-gray-500";
    let label = "Critico";

    if (score >= 80) {
      color = "bg-green-500";
      label = "Eccellente";
    } else if (score >= 60) {
      color = "bg-blue-500";
      label = "Buono";
    } else if (score >= 40) {
      color = "bg-yellow-500";
      label = "Medio";
    } else if (score >= 20) {
      color = "bg-orange-500";
      label = "Basso";
    } else {
      color = "bg-red-500";
      label = "Critico";
    }

    return { score, color, label };
  };

  const calculateStats = (merchantsData: Merchant[]) => {
    const industryCount: { [key: string]: number } = {};
    const countryCount: { [key: string]: number } = {};
    let withCoordinates = 0;
    let withoutCoordinates = 0;
    let recentSignups = 0;
    let churnRisk = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    merchantsData.forEach(merchant => {
      // Conta per industria
      industryCount[merchant.industry] = (industryCount[merchant.industry] || 0) + 1;
      
      // Conta per paese
      countryCount[merchant.country] = (countryCount[merchant.country] || 0) + 1;
      
      // Conta coordinate
      if (merchant.latitude && merchant.longitude) {
        withCoordinates++;
      } else {
        withoutCoordinates++;
      }
      
      // Conta iscrizioni recenti
      if (new Date(merchant.created_at) > thirtyDaysAgo) {
        recentSignups++;
      }
      
      // Conta rischio churn (inattivi da 7 giorni)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (!merchant.stats || merchant.stats.total_transactions === 0 || 
          (merchant.stats.last_transaction && new Date(merchant.stats.last_transaction) < sevenDaysAgo)) {
        churnRisk++;
      }
    });

    setStats({
      total: merchantsData.length,
      active: merchantsData.filter(m => m.stats && m.stats.total_transactions > 0).length,
      inactive: merchantsData.filter(m => !m.stats || m.stats.total_transactions === 0).length,
      withCoordinates,
      withoutCoordinates,
      byIndustry: industryCount,
      byCountry: countryCount,
      recentSignups,
      churnRisk
    });
  };

  const filteredMerchants = merchants.filter((merchant) => {
    const matchesSearch = 
    merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesIndustry = selectedIndustry === "all" || merchant.industry === selectedIndustry;
    const matchesCountry = selectedCountry === "all" || merchant.country === selectedCountry;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isAtRisk = !merchant.stats || 
      merchant.stats.total_transactions === 0 || 
      (merchant.stats.last_transaction && new Date(merchant.stats.last_transaction) < sevenDaysAgo);
    
    const wellness = calculateWellnessScore(merchant);
    
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "active" && merchant.stats && merchant.stats.total_transactions > 0 && !isAtRisk) ||
      (selectedStatus === "inactive" && (!merchant.stats || merchant.stats.total_transactions === 0)) ||
      (selectedStatus === "churn-risk" && isAtRisk) ||
      (selectedStatus === "low-cards" && ((merchant.cardAllocation?.cards_distributed || 0) / (merchant.cardAllocation?.total_cards_allocated || 100)) > 0.8) ||
      (selectedStatus === "wellness-low" && wellness.score < 40) ||
      (selectedStatus === "wellness-critical" && wellness.score < 20);

    return matchesSearch && matchesIndustry && matchesCountry && matchesStatus;
  });

  const hasCoordinates = (merchant: Merchant) => {
    return merchant.latitude !== null && merchant.longitude !== null;
  };

  const openInMap = (latitude: number, longitude: number) => {
    window.open(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`, '_blank');
  };

  const handleEditMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
  };

  const handleDeleteMerchant = async (merchantId: string) => {
    if (confirm("Sei sicuro di voler eliminare questo merchant? Questa azione non può essere annullata.")) {
      try {
        const { error } = await supabase
          .from("merchants")
          .delete()
          .eq("id", merchantId);
        
        if (error) throw error;
        loadMerchants(); // Ricarica la lista
      } catch (error) {
        console.error("Error deleting merchant:", error);
        alert("Errore durante l'eliminazione del merchant");
      }
    }
  };

  const sendEmailToMerchant = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const exportToCSV = (merchantsToExport: Merchant[]) => {
    const headers = [
      'Nome Negozio',
      'Settore',
      'Paese',
      'Proprietario',
      'Email',
      'Telefono',
      'Carte Allocate',
      'Carte Distribuite',
      'Transazioni Totali',
      'Punti Totali',
      'Ultima Attività',
      'Stato',
      'Data Registrazione'
    ];

    const csvContent = [
      headers.join(','),
      ...merchantsToExport.map(merchant => [
        `"${merchant.name}"`,
        `"${merchant.industry}"`,
        `"${merchant.country}"`,
        `"${merchant.profile.first_name} ${merchant.profile.last_name}"`,
        `"${merchant.profile.email}"`,
        `"${merchant.profile.phone_number || ''}"`,
        merchant.cardAllocation?.total_cards_allocated || 100,
        merchant.cardAllocation?.cards_distributed || 0,
        merchant.stats?.total_transactions || 0,
        merchant.stats?.total_points || 0,
        merchant.stats?.last_transaction ? `"${new Date(merchant.stats.last_transaction).toLocaleString('it-IT')}"` : '"Nessuna attività"',
        merchant.stats && merchant.stats.total_transactions > 0 ? '"Attivo"' : '"Inattivo"',
        `"${new Date(merchant.created_at).toLocaleDateString('it-IT')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `merchants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateCardAllocation = async (merchantId: string, newAllocation: number) => {
    try {
      const currentMerchant = merchants.find(m => m.id === merchantId);
      const currentDistributed = currentMerchant?.cardAllocation?.cards_distributed || 0;
      
      const { error } = await supabase
        .from('merchant_card_allocation')
        .update({
          total_cards_allocated: newAllocation,
          cards_available: Math.max(0, newAllocation - currentDistributed),
          last_allocation_date: new Date().toISOString()
        })
        .eq('merchant_id', merchantId);

      if (error) throw error;
      
      // Ricarica i dati
      loadMerchants();
      setCardAllocationDialog({ open: false, merchant: null, newAllocation: '' });
      toast.success('Allocazione carte aggiornata con successo');
    } catch (error) {
      console.error('Error updating card allocation:', error);
      toast.error('Errore nell\'aggiornamento dell\'allocazione');
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Merchant Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestisci tutti i negozi registrati e monitora le loro performance
        </p>
      </div>

      {/* Statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Merchant</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recentSignups} questo mese
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Merchant Attivi</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100).toFixed(1)}% del totale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Rischio Churn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.churnRisk}</div>
            <p className="text-xs text-muted-foreground">
              Inattivi da 7+ giorni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benessere Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {merchants.length > 0 ? 
                Math.round(merchants.reduce((sum, m) => sum + calculateWellnessScore(m).score, 0) / merchants.length) : 
                0
              }/100
            </div>
            <p className="text-xs text-muted-foreground">
              {merchants.filter(m => calculateWellnessScore(m).score < 40).length} merchant a rischio
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Lista Merchant</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
                  <CardTitle>Lista Merchant</CardTitle>
                  <div className="flex items-center gap-4">
                    <Button onClick={() => exportToCSV(filteredMerchants)}>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                    {(() => {
                      const sevenDaysAgo = new Date();
                      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                      const atRiskMerchants = filteredMerchants.filter(merchant => {
                        const isAtRisk = !merchant.stats || 
                          merchant.stats.total_transactions === 0 || 
                          (merchant.stats.last_transaction && new Date(merchant.stats.last_transaction) < sevenDaysAgo);
                        return isAtRisk;
                      });
                      
                      if (atRiskMerchants.length > 0) {
                        return (
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              const emails = atRiskMerchants.map(m => m.profile.email).join(',');
                              window.open(`mailto:${emails}?subject=ReTap - Supporto e assistenza&body=Ciao,%0D%0A%0D%0ANoti che non hai avuto attività recente su ReTap. Siamo qui per aiutarti a ripartire!%0D%0A%0D%0ACordiali saluti,%0D%0AIl team ReTap`, '_blank');
                            }}
                            className="text-orange-600 border-orange-200"
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Contatta {atRiskMerchants.length} a rischio
                          </Button>
                        );
                      }
                      
                      // Pulsante per merchant con benessere basso
                      const lowWellnessMerchants = filteredMerchants.filter(merchant => {
                        const wellness = calculateWellnessScore(merchant);
                        return wellness.score < 40;
                      });
                      
                      if (lowWellnessMerchants.length > 0) {
                        return (
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              const emails = lowWellnessMerchants.map(m => m.profile.email).join(',');
                              window.open(`mailto:${emails}?subject=ReTap - Supporto per migliorare le performance&body=Ciao,%0D%0A%0D%0AVogliamo aiutarti a migliorare le tue performance su ReTap! Abbiamo notato alcune aree di miglioramento.%0D%0A%0D%0AContattaci per un supporto personalizzato.%0D%0A%0D%0ACordiali saluti,%0D%0AIl team ReTap`, '_blank');
                            }}
                            className="text-yellow-600 border-yellow-200"
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Supporta {lowWellnessMerchants.length} con performance basse
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  {/* Filtri */}
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtra per settore" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i settori</SelectItem>
                      {Object.keys(stats.byIndustry).map(industry => (
                        <SelectItem key={industry} value={industry}>
                          {industry} ({stats.byIndustry[industry]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtra per paese" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i paesi</SelectItem>
                      {Object.keys(stats.byCountry).map(country => (
                        <SelectItem key={country} value={country}>
                          {country} ({stats.byCountry[country]})
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
                      <SelectItem value="inactive">Inattivi</SelectItem>
                      <SelectItem value="churn-risk">A Rischio Churn</SelectItem>
                      <SelectItem value="low-cards">Carte quasi esaurite</SelectItem>
                      <SelectItem value="wellness-low">Benessere Basso</SelectItem>
                      <SelectItem value="wellness-critical">Benessere Critico</SelectItem>
                    </SelectContent>
                  </Select>

              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                      placeholder="Cerca merchant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                    <TableHead>Negozio</TableHead>
                <TableHead>Proprietario</TableHead>
                    <TableHead>Contatti</TableHead>
                    <TableHead>Localizzazione</TableHead>
                    <TableHead>Carte</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Benessere</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Ultima Attività</TableHead>
                    <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMerchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell>
                        <div className="flex items-center gap-3">
                          {merchant.logo_url && (
                            <img 
                              src={merchant.logo_url} 
                              alt={merchant.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div 
                              className="font-medium cursor-pointer hover:text-blue-600"
                              onClick={() => router.push(`/admin-panel/merchants/${merchant.id}`)}
                            >
                              {merchant.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {merchant.industry}
                            </div>
                          </div>
                        </div>
                  </TableCell>
                  <TableCell>
                        <div>
                          <div className="font-medium">
                            {merchant.profile.first_name} {merchant.profile.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {merchant.profile.email}
                          </div>
                        </div>
                  </TableCell>
                  <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendEmailToMerchant(merchant.profile.email)}
                            className="h-6 w-6 p-0"
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                          {merchant.profile.phone_number && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`tel:${merchant.profile.phone_number}`, '_blank')}
                              className="h-6 w-6 p-0"
                            >
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                    </div>
                  </TableCell>
                  <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <Badge variant="outline">{merchant.country}</Badge>
                          </div>
                    {hasCoordinates(merchant) ? (
                            <div className="flex items-center gap-1">
                        <Badge variant="default" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {merchant.latitude?.toFixed(4)}, {merchant.longitude?.toFixed(4)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInMap(merchant.latitude!, merchant.longitude!)}
                          className="h-6 w-6 p-0"
                        >
                          <Globe className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-gray-500">
                        Non geocodificato
                      </Badge>
                    )}
                        </div>
                  </TableCell>
                  <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {merchant.cardAllocation?.cards_distributed || 0} / {merchant.cardAllocation?.total_cards_allocated || 100}
                            </span>
                            <span className="text-gray-500">
                              {merchant.cardAllocation?.cards_available || 100} rimanenti
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                ((merchant.cardAllocation?.cards_distributed || 0) / (merchant.cardAllocation?.total_cards_allocated || 100)) > 0.8 
                                  ? 'bg-red-500' 
                                  : ((merchant.cardAllocation?.cards_distributed || 0) / (merchant.cardAllocation?.total_cards_allocated || 100)) > 0.6 
                                    ? 'bg-yellow-500' 
                                    : 'bg-blue-600'
                              }`}
                              style={{ 
                                width: `${Math.min(100, ((merchant.cardAllocation?.cards_distributed || 0) / (merchant.cardAllocation?.total_cards_allocated || 100)) * 100)}%` 
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {((merchant.cardAllocation?.cards_distributed || 0) / (merchant.cardAllocation?.total_cards_allocated || 100) * 100).toFixed(1)}% utilizzate
                            </span>
                            {((merchant.cardAllocation?.cards_distributed || 0) / (merchant.cardAllocation?.total_cards_allocated || 100)) > 0.8 && (
                              <Badge variant="destructive" className="text-xs">
                                Carte quasi esaurite
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <Users className="h-3 w-3 inline mr-1" />
                            {merchant.stats?.active_customers || 0} clienti
                          </div>
                          <div className="text-sm">
                            <CreditCard className="h-3 w-3 inline mr-1" />
                            {merchant.stats?.total_cards || 0} carte
                          </div>
                          <div className="text-sm">
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                            {merchant.stats?.total_points || 0} punti
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const wellness = calculateWellnessScore(merchant);
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{wellness.label}</span>
                                <span className="text-xs text-muted-foreground">{wellness.score}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${wellness.color}`}
                                  style={{ width: `${wellness.score}%` }}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {wellness.score < 40 && (
                                  <span className="text-red-600 font-medium">⚠️ Attenzione</span>
                                )}
                                {wellness.score >= 40 && wellness.score < 60 && (
                                  <span className="text-yellow-600 font-medium">📊 Monitora</span>
                                )}
                                {wellness.score >= 60 && (
                                  <span className="text-green-600 font-medium">✅ Sano</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const sevenDaysAgo = new Date();
                          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                          const isAtRisk = !merchant.stats || 
                            merchant.stats.total_transactions === 0 || 
                            (merchant.stats.last_transaction && new Date(merchant.stats.last_transaction) < sevenDaysAgo);
                          
                          if (isAtRisk) {
                            return <Badge className="bg-red-100 text-red-800">A Rischio Churn</Badge>;
                          } else if (merchant.stats && merchant.stats.total_transactions > 0) {
                            return <Badge className="bg-green-100 text-green-800">Attivo</Badge>;
                          } else {
                            return <Badge className="bg-gray-100 text-gray-800">Inattivo</Badge>;
                          }
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {merchant.stats?.last_transaction ? (
                            <div>
                              <div className="font-medium">
                                {new Date(merchant.stats.last_transaction).toLocaleDateString('it-IT')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(merchant.stats.last_transaction).toLocaleTimeString('it-IT', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              Nessuna attività
                            </div>
                          )}
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
                            <DropdownMenuItem onClick={() => router.push(`/admin-panel/merchants/${merchant.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizza dettagli
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditMerchant(merchant)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendEmailToMerchant(merchant.profile.email)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Invia email
                            </DropdownMenuItem>
                            {(() => {
                              const sevenDaysAgo = new Date();
                              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                              const isAtRisk = !merchant.stats || 
                                merchant.stats.total_transactions === 0 || 
                                (merchant.stats.last_transaction && new Date(merchant.stats.last_transaction) < sevenDaysAgo);
                              
                              if (isAtRisk) {
                                return (
                                  <DropdownMenuItem 
                                    onClick={() => sendEmailToMerchant(merchant.profile.email)}
                                    className="text-orange-600"
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Contatta (A Rischio)
                                  </DropdownMenuItem>
                                );
                              }
                              return null;
                            })()}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMerchant(merchant.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredMerchants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nessun merchant trovato</p>
                  <p className="text-sm">
                    {merchants.length === 0 
                      ? "Non ci sono ancora merchant registrati nel database" 
                      : "Prova a modificare i criteri di ricerca"
                    }
                  </p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Merchant Totali</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.recentSignups} nuovi questo mese
                </p>
          </CardContent>
        </Card>
        
        <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Merchant Attivi</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.active / stats.total) * 100).toFixed(1)}% del totale
            </p>
          </CardContent>
        </Card>
        
        <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">A Rischio Churn</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.churnRisk}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.churnRisk / stats.total) * 100).toFixed(1)}% del totale
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Geolocalizzati</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.withCoordinates}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.withCoordinates / stats.total) * 100).toFixed(1)}% del totale
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Trend di Attività (Ultimi 30 giorni)</CardTitle>
              <CardDescription>
                Analisi dell'attività dei merchant nel tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {merchants.filter(m => {
                        const lastWeek = new Date();
                        lastWeek.setDate(lastWeek.getDate() - 7);
                        return m.stats?.last_transaction && new Date(m.stats.last_transaction) >= lastWeek;
                      }).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Attivi questa settimana</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {merchants.filter(m => {
                        const lastMonth = new Date();
                        lastMonth.setMonth(lastMonth.getMonth() - 1);
                        return m.stats?.last_transaction && new Date(m.stats.last_transaction) >= lastMonth;
                      }).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Attivi questo mese</div>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
                      {merchants.filter(m => {
                        const threeMonthsAgo = new Date();
                        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                        return m.stats?.last_transaction && new Date(m.stats.last_transaction) < threeMonthsAgo;
                      }).length}
            </div>
                    <div className="text-sm text-muted-foreground">Inattivi da 3+ mesi</div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Performance per Settore</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.byIndustry)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([industry, count]) => {
                        const industryMerchants = merchants.filter(m => m.industry === industry);
                        const activeInIndustry = industryMerchants.filter(m => {
                          const lastWeek = new Date();
                          lastWeek.setDate(lastWeek.getDate() - 7);
                          return m.stats?.last_transaction && new Date(m.stats.last_transaction) >= lastWeek;
                        }).length;
                        
                        return (
                          <div key={industry} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium">{industry}</div>
                              <div className="text-sm text-muted-foreground">
                                {count} merchant totali
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-green-600">{activeInIndustry}</div>
                              <div className="text-sm text-muted-foreground">
                                {((activeInIndustry / count) * 100).toFixed(1)}% attivi
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>

          {/* Wellness Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuzione del Benessere Merchant</CardTitle>
              <CardDescription>
                Analisi dello stato di salute dei merchant basata su attività, engagement e performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                                     const wellnessCategories: {
                     [key: string]: { count: number; color: string; merchants: Merchant[] }
                   } = {
                     'Eccellente (80-100)': { count: 0, color: 'bg-green-500', merchants: [] },
                     'Buono (60-79)': { count: 0, color: 'bg-blue-500', merchants: [] },
                     'Discreto (40-59)': { count: 0, color: 'bg-yellow-500', merchants: [] },
                     'Attenzione (20-39)': { count: 0, color: 'bg-orange-500', merchants: [] },
                     'Critico (0-19)': { count: 0, color: 'bg-red-500', merchants: [] }
                   };
                  
                  merchants.forEach(merchant => {
                    const wellness = calculateWellnessScore(merchant);
                    if (wellness.score >= 80) {
                      wellnessCategories['Eccellente (80-100)'].count++;
                      wellnessCategories['Eccellente (80-100)'].merchants.push(merchant);
                    } else if (wellness.score >= 60) {
                      wellnessCategories['Buono (60-79)'].count++;
                      wellnessCategories['Buono (60-79)'].merchants.push(merchant);
                    } else if (wellness.score >= 40) {
                      wellnessCategories['Discreto (40-59)'].count++;
                      wellnessCategories['Discreto (40-59)'].merchants.push(merchant);
                    } else if (wellness.score >= 20) {
                      wellnessCategories['Attenzione (20-39)'].count++;
                      wellnessCategories['Attenzione (20-39)'].merchants.push(merchant);
                    } else {
                      wellnessCategories['Critico (0-19)'].count++;
                      wellnessCategories['Critico (0-19)'].merchants.push(merchant);
                    }
                  });
                  
                  return (
                    <div className="space-y-3">
                      {Object.entries(wellnessCategories).map(([category, data]) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${data.color}`}></div>
                            <span className="text-sm font-medium">{category}</span>
      </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold">{data.count}</div>
                              <div className="text-xs text-muted-foreground">
                                {((data.count / stats.total) * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${data.color}`}
                                style={{ width: `${(data.count / stats.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione per Settore</CardTitle>
                <CardDescription>
                  Analisi della distribuzione dei merchant per settore commerciale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byIndustry)
                    .sort(([,a], [,b]) => b - a)
                    .map(([industry, count]) => (
                      <div key={industry} className="flex items-center justify-between">
                        <span className="text-sm">{industry}</span>
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
                <CardTitle>Distribuzione per Paese</CardTitle>
                <CardDescription>
                  Analisi della distribuzione geografica dei merchant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byCountry)
                    .sort(([,a], [,b]) => b - a)
                    .map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between">
                        <span className="text-sm">{country}</span>
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

          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Metriche di Engagement</CardTitle>
              <CardDescription>
                Analisi dettagliata dell'engagement e dell'utilizzo della piattaforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Utilizzo Carte</h4>
                  <div className="space-y-2">
                    {(() => {
                      const cardUsage = merchants.map(m => ({
                        merchant: m,
                        usage: m.cardAllocation ? 
                          ((m.cardAllocation.cards_distributed / m.cardAllocation.total_cards_allocated) * 100) : 0
                      })).sort((a, b) => b.usage - a.usage).slice(0, 5);
                      
                      return cardUsage.map((item, index) => (
                        <div key={item.merchant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <span className="text-sm">{item.merchant.name}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-600">
                            {item.usage.toFixed(1)}%
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Top Performers</h4>
                  <div className="space-y-2">
                    {(() => {
                      const topPerformers = merchants
                        .filter(m => m.stats?.total_transactions)
                        .sort((a, b) => (b.stats?.total_transactions || 0) - (a.stats?.total_transactions || 0))
                        .slice(0, 5);
                      
                      return topPerformers.map((merchant, index) => (
                        <div key={merchant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <span className="text-sm">{merchant.name}</span>
                          </div>
                          <span className="text-sm font-bold text-green-600">
                            {merchant.stats?.total_transactions || 0} tx
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Merchant a Rischio</h4>
                  <div className="space-y-2">
                    {(() => {
                      const atRisk = merchants.filter(m => {
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        return !m.stats || 
                          m.stats.total_transactions === 0 || 
                          (m.stats.last_transaction && new Date(m.stats.last_transaction) < sevenDaysAgo);
                      }).slice(0, 5);
                      
                      return atRisk.map((merchant, index) => (
                        <div key={merchant.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <span className="text-sm">{merchant.name}</span>
                          </div>
                          <span className="text-sm font-bold text-red-600">
                            {merchant.stats?.last_transaction ? 
                              `${Math.floor((new Date().getTime() - new Date(merchant.stats.last_transaction).getTime()) / (1000 * 60 * 60 * 24))}g fa` : 
                              'Mai'
                            }
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog per dettagli merchant */}
      <Dialog open={!!selectedMerchant} onOpenChange={() => setSelectedMerchant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Merchant</DialogTitle>
            <DialogDescription>
              Informazioni complete sul merchant selezionato
            </DialogDescription>
          </DialogHeader>
          {selectedMerchant && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informazioni Negozio</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nome:</strong> {selectedMerchant.name}</div>
                    <div><strong>Settore:</strong> {selectedMerchant.industry}</div>
                    <div><strong>Paese:</strong> {selectedMerchant.country}</div>
                    <div><strong>Indirizzo:</strong> {selectedMerchant.address}</div>
                    <div><strong>Telefono:</strong> {selectedMerchant.phone || "Non specificato"}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Informazioni Proprietario</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nome:</strong> {selectedMerchant.profile.first_name} {selectedMerchant.profile.last_name}</div>
                    <div><strong>Email:</strong> {selectedMerchant.profile.email}</div>
                    <div><strong>Telefono:</strong> {selectedMerchant.profile.phone_number || "Non specificato"}</div>
                    <div><strong>Registrato:</strong> {new Date(selectedMerchant.created_at).toLocaleDateString('it-IT')}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Performance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedMerchant.stats?.active_customers || 0}</div>
                    <div className="text-sm text-muted-foreground">Clienti Attivi</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedMerchant.stats?.total_cards || 0}</div>
                    <div className="text-sm text-muted-foreground">Carte Emesse</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedMerchant.stats?.total_transactions || 0}</div>
                    <div className="text-sm text-muted-foreground">Transazioni</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedMerchant.stats?.total_points || 0}</div>
                    <div className="text-sm text-muted-foreground">Punti Totali</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedMerchant(null)}>
                  Chiudi
                </Button>
                <Button onClick={() => sendEmailToMerchant(selectedMerchant.profile.email)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Invia Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog per allocazione carte */}
      <Dialog open={cardAllocationDialog.open} onOpenChange={(open) => setCardAllocationDialog({ ...cardAllocationDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Allocazione Carte</DialogTitle>
            <DialogDescription>
              Modifica il numero di carte allocate per {cardAllocationDialog.merchant?.name}
            </DialogDescription>
          </DialogHeader>
          {cardAllocationDialog.merchant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Attuale allocazione:</strong>
                  <div className="text-lg font-bold">{cardAllocationDialog.merchant.cardAllocation?.total_cards_allocated || 100}</div>
                </div>
                <div>
                  <strong>Carte distribuite:</strong>
                  <div className="text-lg font-bold text-blue-600">{cardAllocationDialog.merchant.cardAllocation?.cards_distributed || 0}</div>
                </div>
                <div>
                  <strong>Carte disponibili:</strong>
                  <div className="text-lg font-bold text-green-600">{cardAllocationDialog.merchant.cardAllocation?.cards_available || 100}</div>
                </div>
                <div>
                  <strong>Ultima modifica:</strong>
                  <div className="text-sm">
                    {cardAllocationDialog.merchant.cardAllocation?.last_allocation_date 
                      ? new Date(cardAllocationDialog.merchant.cardAllocation.last_allocation_date).toLocaleDateString('it-IT')
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
                  min={cardAllocationDialog.merchant.cardAllocation?.cards_distributed || 0}
                  value={cardAllocationDialog.newAllocation}
                  onChange={(e) => setCardAllocationDialog({ ...cardAllocationDialog, newAllocation: e.target.value })}
                  placeholder="Inserisci numero di carte"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimo: {cardAllocationDialog.merchant.cardAllocation?.cards_distributed || 0} (carte già distribuite)
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCardAllocationDialog({ open: false, merchant: null, newAllocation: '' })}
                >
                  Annulla
                </Button>
                <Button 
                  onClick={() => {
                    const newAllocation = Number(cardAllocationDialog.newAllocation);
                    if (!isNaN(newAllocation) && newAllocation >= (cardAllocationDialog.merchant?.cardAllocation?.cards_distributed || 0)) {
                      updateCardAllocation(cardAllocationDialog.merchant!.id, newAllocation);
                    } else {
                      toast.error('Inserisci un numero valido maggiore o uguale alle carte distribuite');
                    }
                  }}
                >
                  Aggiorna Allocazione
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}