# Dashboard KPI - Documentazione Aggiornata

## Panoramica

La dashboard è stata aggiornata per collegare tutti i KPI (Key Performance Indicators) direttamente a Supabase, fornendo dati reali e aggiornati in tempo reale. I KPI sono stati migliorati per essere più actionable e informativi.

## KPI Implementati e Migliorati

### 1. Active Customers (Clienti Attivi) ✅
- **Descrizione**: Numero di clienti unici che hanno effettuato almeno una transazione nel periodo selezionato
- **Query**: Filtra le transazioni per merchant e periodo, estrae i customer_id unici
- **Filtri**: Oggi, Questa settimana, Questo mese, Questo anno
- **Stato**: MANTIENI - KPI essenziale e ben implementato

### 2. Issued Physical Cards (Carte Fisiche Emesse) ✅
- **Descrizione**: Numero totale di carte NFC fisiche emesse dal merchant
- **Query**: Conta le carte nella tabella `cards` dove `issuing_merchant_id` corrisponde al merchant corrente
- **Nota**: Mostra solo le carte emesse direttamente dal merchant
- **Stato**: MANTIENI - Importante per il business model NFC

### 3. Customer Retention (Fidelizzazione Clienti) ✅
- **Descrizione**: Percentuale di clienti che sono tornati almeno una volta negli ultimi 30 giorni
- **Calcolo**: 
  - Clienti recenti (ultimi 30 giorni)
  - Clienti storici (prima dei 30 giorni)
  - Retention = (clienti che appaiono in entrambi i gruppi / clienti storici) * 100
- **Stato**: MANTIENI - KPI fondamentale per la fidelizzazione

### 4. Points Trend (Trend Punti) ✅
- **Descrizione**: Totale punti accumulati per periodo
- **Periodi**: Oggi, Questa settimana, Questo mese
- **Query**: Somma i punti dalle transazioni filtrate per merchant e periodo
- **Stato**: MANTIENI - Mostra l'attività del sistema

## 🔄 KPI Migliorati

### 5. Transaction Volume (Volume Transazioni) 🔄 **MIGLIORATO**
- **Descrizione**: Volume giornaliero di transazioni negli ultimi 14 giorni
- **Sostituisce**: Peak Hours (troppo specifico, poco actionable)
- **Calcolo**: Raggruppa le transazioni per data e conta le occorrenze giornaliere
- **Visualizzazione**: Grafico a linee con trend temporale
- **Vantaggi**: 
  - Più actionable per identificare trend
  - Mostra pattern settimanali
  - Utile per pianificazione operativa

### 6. Reward Performance (Performance Rewards) 🔄 **MIGLIORATO**
- **Descrizione**: Metriche complete sui rewards e riscatti
- **Sostituisce**: Most Requested Rewards (troppo limitato)
- **Metriche incluse**:
  - **Total Rewards**: Numero totale di rewards attivi
  - **Redemption Rate**: Percentuale di punti riscattati vs punti emessi
  - **Average Points per Reward**: Media punti per riscatto
  - **Top Performing Rewards**: Top 5 rewards per numero di riscatti
- **Vantaggi**:
  - Analisi completa del programma rewards
  - Identifica rewards più popolari
  - Misura l'efficacia del programma fedeltà

### 7. Customer Segmentation (Segmentazione Clienti) 🔄 **ESPANSO**
- **Descrizione**: Segmentazione avanzata dei clienti con più categorie
- **Sostituisce**: Segmentazione semplificata (solo New vs Returning)
- **Segmenti**:
  - **New**: Prima visita negli ultimi 30 giorni
  - **Returning**: Clienti attivi ma non nuovi
  - **VIP**: Clienti con >1000 punti totali o >10 transazioni
  - **Inactive**: Ultima visita più di 90 giorni fa
- **Metriche**:
  - Conteggio per segmento
  - Percentuale per segmento
  - Totale clienti
- **Vantaggi**:
  - Targeting più preciso per campagne marketing
  - Identifica clienti VIP da fidelizzare
  - Strategie per riattivare clienti inattivi

## Struttura del Database

### Tabelle Principali Utilizzate

1. **transactions**
   - `id`: UUID della transazione
   - `points`: Punti accumulati
   - `created_at`: Data e ora della transazione
   - `card_merchant_id`: Riferimento a card_merchants

2. **card_merchants**
   - `id`: UUID del record
   - `card_id`: Riferimento alla carta
   - `merchant_id`: Riferimento al merchant

3. **cards**
   - `id`: UUID della carta
   - `customer_id`: Riferimento al cliente
   - `issuing_merchant_id`: Merchant che ha emesso la carta

4. **redeemed_rewards**
   - `id`: UUID del riscatto
   - `customer_id`: Cliente che ha riscattato
   - `merchant_id`: Merchant del reward
   - `reward_id`: Riferimento al reward
   - `points_spent`: Punti spesi per il riscatto

5. **rewards**
   - `id`: UUID del reward
   - `name`: Nome del reward
   - `merchant_id`: Merchant proprietario
   - `price_coins`: Punti necessari per il riscatto
   - `is_active`: Se il reward è attivo

## Hook Personalizzato: useDashboardStats

### Funzionalità Aggiornate
- Gestisce il caricamento delle statistiche
- Gestisce gli stati di loading ed error
- Ricalcola automaticamente quando cambia il merchant o il periodo
- Fornisce funzione di refetch
- **Nuove funzioni**:
  - `calculateTransactionVolume()`: Calcola volume transazioni per giorno
  - `calculateRewardPerformance()`: Analisi completa rewards
  - `calculateAdvancedCustomerSegmentation()`: Segmentazione avanzata

### Utilizzo
```typescript
const { stats, loading, error, refetch } = useDashboardStats(merchantId, timeRange);
```

### Nuove Strutture Dati
```typescript
interface DashboardStats {
  // ... KPI esistenti ...
  transactionVolume: Array<{ date: string; transactions: number }>;
  rewardPerformance: {
    totalRewards: number;
    totalRedemptions: number;
    redemptionRate: number;
    averagePointsPerReward: number;
    topRewards: Array<{ name: string; redemptions: number; pointsCost: number }>;
  };
  customerSegmentation: {
    new: number;
    returning: number;
    vip: number;
    inactive: number;
    totalCustomers: number;
    segments: Array<{ segment: string; count: number; percentage: number }>;
  };
}
```

## Query Supabase Aggiornate

### Transaction Volume
```sql
SELECT 
  DATE(t.created_at) as date,
  COUNT(*) as transactions
FROM transactions t
INNER JOIN card_merchants cm ON t.card_merchant_id = cm.id
WHERE cm.merchant_id = :merchant_id
  AND t.created_at >= :start_date
GROUP BY DATE(t.created_at)
ORDER BY date DESC
LIMIT 14
```

### Reward Performance
```sql
-- Total Rewards
SELECT COUNT(*) FROM rewards 
WHERE merchant_id = :merchant_id AND is_active = true

-- Redemption Rate
SELECT 
  (SELECT SUM(points_spent) FROM redeemed_rewards WHERE merchant_id = :merchant_id) as redeemed_points,
  (SELECT SUM(points) FROM transactions t 
   INNER JOIN card_merchants cm ON t.card_merchant_id = cm.id 
   WHERE cm.merchant_id = :merchant_id) as total_points
```

### Advanced Customer Segmentation
```sql
-- VIP Customers
SELECT COUNT(DISTINCT c.customer_id) 
FROM transactions t
INNER JOIN card_merchants cm ON t.card_merchant_id = cm.id
INNER JOIN cards c ON cm.card_id = c.id
WHERE cm.merchant_id = :merchant_id
GROUP BY c.customer_id
HAVING SUM(t.points) > 1000 OR COUNT(*) > 10
```

## Gestione degli Errori

La dashboard gestisce diversi tipi di errori:
- Errori di connessione a Supabase
- Errori nelle query complesse
- Dati mancanti per nuovi KPI
- Timeout per calcoli complessi

Gli errori vengono mostrati all'utente con messaggi chiari e la possibilità di riprovare.

## Performance

### Ottimizzazioni Implementate
- Query separate per ogni KPI per evitare query troppo complesse
- Utilizzo di indici sui campi più utilizzati
- Caching dei risultati nel hook
- Lazy loading dei dati
- **Nuove ottimizzazioni**:
  - Calcoli batch per segmentazione avanzata
  - Limite di 14 giorni per transaction volume
  - Top 5 rewards per performance

### Considerazioni
- Le query sono ottimizzate per dataset di medie dimensioni
- Per dataset molto grandi, considerare l'implementazione di viste materializzate
- Monitorare le performance delle query complesse di segmentazione

## Estensioni Future

### Possibili Miglioramenti
1. **Caching**: Implementare cache Redis per i dati più utilizzati
2. **Real-time**: Aggiungere aggiornamenti in tempo reale con Supabase Realtime
3. **Export**: Funzionalità di export dei dati in CSV/Excel
4. **Filtri Avanzati**: Filtri per categoria, età clienti, etc.
5. **Grafici Interattivi**: Grafici più dettagliati con drill-down
6. **Alerting**: Notifiche per KPI che superano soglie

### Metriche Aggiuntive
- Lifetime Value (LTV) dei clienti
- Churn rate dettagliato
- Conversion rate
- Average Order Value (AOV)
- Seasonal trends
- Geographic distribution
- **Nuove metriche suggerite**:
  - Customer Acquisition Cost (CAC)
  - Revenue per Customer (ARPU)
  - Transaction Frequency
  - Points Velocity (punti per giorno)

## Troubleshooting

### Problemi Comuni
1. **Dati non aggiornati**: Verificare la connessione a Supabase
2. **Query lente**: Controllare gli indici del database
3. **Errori di autenticazione**: Verificare le policy RLS
4. **Dati mancanti**: Controllare le relazioni tra tabelle
5. **Calcoli errati**: Verificare la logica di segmentazione

### Debug
- Utilizzare la console del browser per vedere gli errori
- Controllare i log di Supabase
- Verificare le policy RLS per il merchant corrente
- Testare le query complesse separatamente

## Benefici dei Miglioramenti

### Transaction Volume vs Peak Hours
- **Prima**: Ore di picco poco actionable
- **Ora**: Trend temporali utili per pianificazione

### Reward Performance vs Most Requested
- **Prima**: Solo lista rewards più richiesti
- **Ora**: Analisi completa del programma fedeltà

### Customer Segmentation Espanso
- **Prima**: Solo New vs Returning
- **Ora**: 4 segmenti con metriche dettagliate per targeting preciso

La dashboard è ora molto più actionable e fornisce insights più profondi per prendere decisioni di business informate! 🚀 