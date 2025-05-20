"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMerchants: 0,
    totalCards: 0,
    totalTransactions: 0,
    activeSubscriptions: 0
  });
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check if admin is authenticated via cookie
    const isAdminAuthenticated = document.cookie.includes('adminAuthenticated=true');
    if (!isAdminAuthenticated) {
      router.push("/admin-panel/login");
      return;
    }

    // Load dashboard stats
    const loadStats = async () => {
      try {
        // Get total merchants
        const { count: merchantsCount } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true });

        // Get total cards
        const { count: cardsCount } = await supabase
          .from('cards')
          .select('*', { count: 'exact', head: true });

        // Get total transactions
        const { count: transactionsCount } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true });

        // Get active subscriptions
        const { count: subscriptionsCount } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        setStats({
          totalMerchants: merchantsCount || 0,
          totalCards: cardsCount || 0,
          totalTransactions: transactionsCount || 0,
          activeSubscriptions: subscriptionsCount || 0
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [router, supabase]);

  const handleLogout = () => {
    // Remove admin cookie
    document.cookie = "adminAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/admin-panel/login");
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Panoramica generale del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalMerchants}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalCards}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalTransactions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 