import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface DashboardStats {
  activeCustomers: number;
  issuedCards: number;
  customerRetention: number;
  pointsToday: number;
  pointsThisWeek: number;
  pointsThisMonth: number;
  transactionVolume: Array<{ date: string; transactions: number }>;
  pointsTrend: Array<{ date: string; points: number }>;
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

export function useDashboardStats(merchantId: string | null, timeRange: string) {
  const [stats, setStats] = useState<DashboardStats>({
    activeCustomers: 0,
    issuedCards: 0,
    customerRetention: 0,
    pointsToday: 0,
    pointsThisWeek: 0,
    pointsThisMonth: 0,
    transactionVolume: [],
    pointsTrend: [],
    rewardPerformance: {
      totalRewards: 0,
      totalRedemptions: 0,
      redemptionRate: 0,
      averagePointsPerReward: 0,
      topRewards: []
    },
    customerSegmentation: {
      new: 0,
      returning: 0,
      vip: 0,
      inactive: 0,
      totalCustomers: 0,
      segments: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Funzione per calcolare le date in base al timeRange
  const getDateRange = (range: string) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case "today":
        return { start: startOfDay, end: now };
      case "week":
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        return { start: startOfWeek, end: now };
      case "month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: now };
      case "year":
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear, end: now };
      default:
        return { start: startOfDay, end: now };
    }
  };

  // Funzione per estrarre customer_id dalle transazioni
  const extractCustomerId = (transaction: any) => {
    const cardMerchant = Array.isArray(transaction.card_merchants) ? transaction.card_merchants[0] : transaction.card_merchants;
    const card = Array.isArray(cardMerchant?.cards) ? cardMerchant?.cards[0] : cardMerchant?.cards;
    return card?.customer_id;
  };

  // Funzione per calcolare il volume di transazioni per giorno
  const calculateTransactionVolume = (transactions: any[], dateRange: { start: Date; end: Date }) => {
    const volumeByDate: { [key: string]: number } = {};
    
    transactions?.forEach(transaction => {
      const transactionDate = new Date(transaction.created_at);
      if (transactionDate >= dateRange.start && transactionDate <= dateRange.end) {
        const date = transactionDate.toISOString().split('T')[0];
        volumeByDate[date] = (volumeByDate[date] || 0) + 1;
      }
    });

    // Converti in array e ordina per data
    return Object.entries(volumeByDate)
      .map(([date, count]) => ({ date, transactions: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Funzione per calcolare il trend dei punti per giorno
  const calculatePointsTrend = (transactions: any[], dateRange: { start: Date; end: Date }) => {
    const pointsByDate: { [key: string]: number } = {};
    
    transactions?.forEach(transaction => {
      const transactionDate = new Date(transaction.created_at);
      if (transactionDate >= dateRange.start && transactionDate <= dateRange.end) {
        const date = transactionDate.toISOString().split('T')[0];
        pointsByDate[date] = (pointsByDate[date] || 0) + (transaction.points || 0);
      }
    });

    // Converti in array e ordina per data
    return Object.entries(pointsByDate)
      .map(([date, points]) => ({ date, points }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Funzione per calcolare le performance dei rewards
  const calculateRewardPerformance = async (merchantId: string, dateRange: { start: Date; end: Date }) => {
    // Ottieni tutti i rewards del merchant
    const { data: rewards } = await supabase
      .from('rewards')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('is_active', true);

    // Ottieni i riscatti nel periodo selezionato
    const { data: redeemedRewards } = await supabase
      .from('redeemed_rewards')
      .select(`
        reward_id,
        points_spent,
        created_at,
        rewards!inner(
          name,
          price_coins
        )
      `)
      .eq('merchant_id', merchantId)
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    const totalRewards = rewards?.length || 0;
    const totalRedemptions = redeemedRewards?.length || 0;
    
    // Calcola il tasso di riscatto (redemption rate) nel periodo selezionato
    const { data: totalPointsIssued } = await supabase
      .from('transactions')
      .select(`
        points,
        card_merchants!inner(
          merchant_id
        )
      `)
      .eq('card_merchants.merchant_id', merchantId)
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    const totalPoints = totalPointsIssued?.reduce((sum, t) => sum + (t.points || 0), 0) || 0;
    const totalPointsRedeemed = redeemedRewards?.reduce((sum, r) => sum + (r.points_spent || 0), 0) || 0;
    const redemptionRate = totalPoints > 0 ? (totalPointsRedeemed / totalPoints) * 100 : 0;

    // Calcola la media punti per reward
    const averagePointsPerReward = totalRedemptions > 0 ? totalPointsRedeemed / totalRedemptions : 0;

    // Top rewards per numero di riscatti nel periodo
    const rewardCounts: { [key: string]: { name: string; redemptions: number; pointsCost: number } } = {};
    redeemedRewards?.forEach(redemption => {
      const reward = Array.isArray(redemption.rewards) ? redemption.rewards[0] : redemption.rewards;
      const rewardName = reward?.name || 'Unknown';
      
      if (!rewardCounts[rewardName]) {
        rewardCounts[rewardName] = {
          name: rewardName,
          redemptions: 0,
          pointsCost: reward?.price_coins || 0
        };
      }
      rewardCounts[rewardName].redemptions += 1;
    });

    const topRewards = Object.values(rewardCounts)
      .sort((a, b) => b.redemptions - a.redemptions)
      .slice(0, 5);

    return {
      totalRewards,
      totalRedemptions,
      redemptionRate: Math.round(redemptionRate * 100) / 100,
      averagePointsPerReward: Math.round(averagePointsPerReward * 100) / 100,
      topRewards
    };
  };

  // Funzione per calcolare la segmentazione avanzata dei clienti
  const calculateAdvancedCustomerSegmentation = async (merchantId: string, dateRange: { start: Date; end: Date }) => {
    // Ottieni tutte le transazioni del merchant nel periodo selezionato
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select(`
        card_merchant_id,
        created_at,
        points,
        card_merchants!inner(
          merchant_id,
          cards!inner(
            customer_id
          )
        )
      `)
      .eq('card_merchants.merchant_id', merchantId)
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    const customerData: { [key: string]: { 
      firstVisit: Date; 
      lastVisit: Date; 
      totalPoints: number; 
      transactionCount: number;
      totalSpent: number;
    } } = {};

    // Raggruppa le transazioni per cliente
    allTransactions?.forEach(transaction => {
      const customerId = extractCustomerId(transaction);
      if (!customerId) return;

      const transactionDate = new Date(transaction.created_at);
      
      if (!customerData[customerId]) {
        customerData[customerId] = {
          firstVisit: transactionDate,
          lastVisit: transactionDate,
          totalPoints: 0,
          transactionCount: 0,
          totalSpent: 0
        };
      }

      customerData[customerId].lastVisit = transactionDate > customerData[customerId].lastVisit ? transactionDate : customerData[customerId].lastVisit;
      customerData[customerId].firstVisit = transactionDate < customerData[customerId].firstVisit ? transactionDate : customerData[customerId].firstVisit;
      customerData[customerId].totalPoints += transaction.points || 0;
      customerData[customerId].transactionCount += 1;
    });

    // Calcola i segmenti basati sul periodo selezionato
    const now = new Date();
    const periodStart = dateRange.start;
    const periodEnd = dateRange.end;
    
    let newCustomers = 0;
    let returningCustomers = 0;
    let vipCustomers = 0;
    let inactiveCustomers = 0;

    Object.values(customerData).forEach(customer => {
      // Nuovi clienti: prima visita nel periodo selezionato
      if (customer.firstVisit >= periodStart && customer.firstVisit <= periodEnd) {
        newCustomers++;
      }
      // Clienti di ritorno: prima visita prima del periodo ma attivi nel periodo
      else if (customer.firstVisit < periodStart && customer.lastVisit >= periodStart) {
        returningCustomers++;
      }
      // Clienti inattivi: ultima visita prima del periodo
      else if (customer.lastVisit < periodStart) {
        inactiveCustomers++;
      }
      // Altri clienti attivi nel periodo
      else {
        returningCustomers++;
      }

      // VIP: clienti con più di 1000 punti totali o più di 10 transazioni nel periodo
      if (customer.totalPoints > 1000 || customer.transactionCount > 10) {
        vipCustomers++;
      }
    });

    const totalCustomers = Object.keys(customerData).length;
    
    const segments = [
      { segment: 'New', count: newCustomers, percentage: totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0 },
      { segment: 'Returning', count: returningCustomers, percentage: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0 },
      { segment: 'VIP', count: vipCustomers, percentage: totalCustomers > 0 ? (vipCustomers / totalCustomers) * 100 : 0 },
      { segment: 'Inactive', count: inactiveCustomers, percentage: totalCustomers > 0 ? (inactiveCustomers / totalCustomers) * 100 : 0 }
    ];

    return {
      new: Math.round((newCustomers / totalCustomers) * 100 * 100) / 100,
      returning: Math.round((returningCustomers / totalCustomers) * 100 * 100) / 100,
      vip: Math.round((vipCustomers / totalCustomers) * 100 * 100) / 100,
      inactive: Math.round((inactiveCustomers / totalCustomers) * 100 * 100) / 100,
      totalCustomers,
      segments: segments.map(s => ({ ...s, percentage: Math.round(s.percentage * 100) / 100 }))
    };
  };

  // Funzione per caricare le statistiche
  const loadStats = async () => {
    if (!merchantId) return;

    setLoading(true);
    setError(null);
    const dateRange = getDateRange(timeRange);

    try {
      // 1. Active Customers - clienti unici con transazioni nel periodo
      const { data: activeCustomersData } = await supabase
        .from('transactions')
        .select(`
          card_merchant_id,
          card_merchants!inner(
            merchant_id,
            cards!inner(
              customer_id
            )
          )
        `)
        .eq('card_merchants.merchant_id', merchantId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      const uniqueCustomers = new Set(
        activeCustomersData?.map(extractCustomerId).filter(Boolean) || []
      );

      // 2. Issued Physical Cards - carte emesse dal merchant (sempre totale)
      const { count: issuedCardsCount } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('issuing_merchant_id', merchantId);

      // 3. Customer Retention - clienti che sono tornati nel periodo selezionato
      const periodStart = dateRange.start;
      const periodEnd = dateRange.end;
      
      // Trova clienti che avevano transazioni prima del periodo
      const { data: previousTransactions } = await supabase
        .from('transactions')
        .select(`
          card_merchant_id,
          card_merchants!inner(
            merchant_id,
            cards!inner(
              customer_id
            )
          )
        `)
        .eq('card_merchants.merchant_id', merchantId)
        .lt('created_at', periodStart.toISOString());

      // Trova clienti che hanno transazioni nel periodo
      const { data: currentTransactions } = await supabase
        .from('transactions')
        .select(`
          card_merchant_id,
          card_merchants!inner(
            merchant_id,
            cards!inner(
              customer_id
            )
          )
        `)
        .eq('card_merchants.merchant_id', merchantId)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      const previousCustomers = new Set(
        previousTransactions?.map(extractCustomerId).filter(Boolean) || []
      );
      const currentCustomers = new Set(
        currentTransactions?.map(extractCustomerId).filter(Boolean) || []
      );

      const returningCustomersCount = Array.from(currentCustomers).filter(customerId => 
        previousCustomers.has(customerId)
      ).length;

      const retentionRate = previousCustomers.size > 0 ? (returningCustomersCount / previousCustomers.size) * 100 : 0;

      // 4. Points Trend - punti nel periodo selezionato
      const { data: pointsData } = await supabase
        .from('transactions')
        .select(`
          points,
          created_at,
          card_merchants!inner(
            merchant_id
          )
        `)
        .eq('card_merchants.merchant_id', merchantId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      const totalPoints = pointsData?.reduce((sum, t) => sum + (t.points || 0), 0) || 0;

      // Calcola punti per sottoperiodi basati sul timeRange
      let pointsToday = 0;
      let pointsThisWeek = 0;
      let pointsThisMonth = 0;

      if (timeRange === 'today') {
        pointsToday = totalPoints;
        pointsThisWeek = totalPoints;
        pointsThisMonth = totalPoints;
      } else if (timeRange === 'week') {
        pointsThisWeek = totalPoints;
        pointsThisMonth = totalPoints;
        // Calcola punti di oggi separatamente
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        pointsToday = pointsData?.filter(t => new Date(t.created_at) >= startOfDay)
          .reduce((sum, t) => sum + (t.points || 0), 0) || 0;
      } else if (timeRange === 'month') {
        pointsThisMonth = totalPoints;
        // Calcola punti di questa settimana e oggi separatamente
        const weekStart = getDateRange('week').start;
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        pointsThisWeek = pointsData?.filter(t => new Date(t.created_at) >= weekStart)
          .reduce((sum, t) => sum + (t.points || 0), 0) || 0;
        pointsToday = pointsData?.filter(t => new Date(t.created_at) >= startOfDay)
          .reduce((sum, t) => sum + (t.points || 0), 0) || 0;
      } else if (timeRange === 'year') {
        // Calcola tutti i sottoperiodi separatamente
        const monthStart = getDateRange('month').start;
        const weekStart = getDateRange('week').start;
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        pointsThisMonth = pointsData?.filter(t => new Date(t.created_at) >= monthStart)
          .reduce((sum, t) => sum + (t.points || 0), 0) || 0;
        pointsThisWeek = pointsData?.filter(t => new Date(t.created_at) >= weekStart)
          .reduce((sum, t) => sum + (t.points || 0), 0) || 0;
        pointsToday = pointsData?.filter(t => new Date(t.created_at) >= startOfDay)
          .reduce((sum, t) => sum + (t.points || 0), 0) || 0;
      }

      // 5. Transaction Volume nel periodo selezionato
      const { data: transactionVolumeData } = await supabase
        .from('transactions')
        .select(`
          created_at,
          card_merchants!inner(
            merchant_id
          )
        `)
        .eq('card_merchants.merchant_id', merchantId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      const transactionVolume = calculateTransactionVolume(transactionVolumeData || [], dateRange);

      // 6. Reward Performance nel periodo selezionato
      const rewardPerformance = await calculateRewardPerformance(merchantId, dateRange);

      // 7. Customer Segmentation nel periodo selezionato
      const customerSegmentation = await calculateAdvancedCustomerSegmentation(merchantId, dateRange);

      setStats({
        activeCustomers: uniqueCustomers.size,
        issuedCards: issuedCardsCount || 0,
        customerRetention: Math.round(retentionRate * 100) / 100,
        pointsToday,
        pointsThisWeek,
        pointsThisMonth,
        transactionVolume,
        pointsTrend: calculatePointsTrend(pointsData || [], dateRange),
        rewardPerformance,
        customerSegmentation
      });

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setError(error instanceof Error ? error.message : 'Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (merchantId) {
      loadStats();
    }
  }, [merchantId, timeRange]);

  return { stats, loading, error, refetch: loadStats };
} 