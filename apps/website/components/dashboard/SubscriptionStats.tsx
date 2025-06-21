import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  Users, 
  Activity,
  Loader2
} from "lucide-react";
import { useSubscriptionStats } from "@/lib/hooks/useSubscriptionStats";

interface SubscriptionStatsProps {
  userId: string;
  subscription: any;
  merchantsCount: number;
}

export function SubscriptionStats({ userId, subscription, merchantsCount }: SubscriptionStatsProps) {
  const { stats, history, isLoading, error } = useSubscriptionStats(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#f8494c]" /> Statistiche Dettagliate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Caricamento statistiche...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#f8494c]" /> Statistiche Dettagliate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Impossibile caricare le statistiche dettagliate
            </p>
            <Badge variant="outline" className="text-sm">
              Errore: {error}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStats = stats || {
    total_cards: 0,
    cards_this_month: 0,
    plan_limit: 100,
    usage_percentage: 0
  };

  const currentHistory = history || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#f8494c]" /> Statistiche Dettagliate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* Usage Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Utilizzo Piano</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Carte questo mese</span>
                  <span className="font-medium">
                    {currentStats.cards_this_month} / {currentStats.plan_limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#f8494c] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(currentStats.usage_percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {Math.round(currentStats.usage_percentage)}% utilizzato
                  </span>
                  <span className="text-muted-foreground">
                    {currentStats.plan_limit - currentStats.cards_this_month} rimanenti
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Riepilogo</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Carte totali</span>
                  </div>
                  <span className="font-medium">{currentStats.total_cards}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Negozi attivi</span>
                  </div>
                  <span className="font-medium">{merchantsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Piano attuale</span>
                  </div>
                  <Badge variant="outline">
                    {subscription?.plan_type || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription History */}
          {currentHistory.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cronologia Abbonamenti</h3>
              <div className="space-y-3">
                {currentHistory.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {item.plan_type} - {item.billing_type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.start_date).toLocaleDateString('it-IT')} - 
                          {item.end_date ? new Date(item.end_date).toLocaleDateString('it-IT') : 'Attivo'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      className={
                        item.status === 'active' ? 'bg-green-100 text-green-800' :
                        item.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        item.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {item.status === 'active' ? 'Attivo' : 
                       item.status === 'cancelled' ? 'Cancellato' :
                       item.status === 'expired' ? 'Scaduto' : item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Azioni Rapide</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-[#f8494c]" />
                  <span className="font-medium">Gestisci Abbonamento</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Aggiorna il tuo piano o cancella l'abbonamento
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">Cambia Piano</Badge>
                  <Badge variant="outline" className="text-xs">Cancella</Badge>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-[#f8494c]" />
                  <span className="font-medium">Gestisci Negozi</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Aggiungi o modifica i tuoi negozi
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">Aggiungi Negozio</Badge>
                  <Badge variant="outline" className="text-xs">Visualizza Tutti</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 