"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Gift, TrendingUp, PlusCircle, UserPlus, BarChart2 } from "lucide-react";

export default function DashboardPage() {
  const [merchant, setMerchant] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: merchant } = await supabase
        .from('merchants')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      setMerchant(merchant);
    };

    fetchMerchant();
  }, [supabase]);

  return (
    <div className="space-y-10 bg-[#f8f9fb] min-h-screen p-6 rounded-xl">
      {/* Improved Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-lg text-[#f8494c] font-semibold mt-1">Welcome, {merchant?.name || "Business"}</p>
          <p className="text-muted-foreground text-sm mt-1">Monitor your customers, cards and points in real time.</p>
        </div>
        {merchant?.logo_url && (
          <div className="flex items-center justify-center">
            <div className="rounded-full border-4 border-[#f8494c] p-1 bg-white shadow-md">
              <img src={merchant.logo_url} alt="Logo" className="h-16 w-16 rounded-full object-cover" />
            </div>
          </div>
        )}
        <Button variant="outline" className="border border-[#f8494c] text-[#1A1A1A] font-medium h-10 px-4 shadow-none md:ml-8 mt-4 md:mt-0 flex items-center gap-2">
          <Gift className="h-4 w-4 mr-1 text-[#f8494c]" /> Download report
        </Button>
      </div>

      {/* Improved KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#f8494c] rounded-t-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-6 w-6 text-[#f8494c]" /> Active customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#1A1A1A]">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#f8494c] rounded-t-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-[#f8494c]" /> Active cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#1A1A1A]">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#f8494c] rounded-t-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Gift className="h-6 w-6 text-[#f8494c]" /> Points issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#1A1A1A]">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#f8494c] rounded-t-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-[#f8494c]" /> Active promotions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#1A1A1A]">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Points trend</CardTitle>
            <BarChart2 className="h-5 w-5 text-[#f8494c]" />
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              {/* Here you can integrate a chart library like recharts or chart.js */}
              <span>Points chart (coming soon)</span>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 shadow-md">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserPlus className="h-4 w-4 text-[#f8494c]" /> Mario Rossi activated a new card
                <span className="ml-auto text-xs">2 hours ago</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gift className="h-4 w-4 text-[#f8494c]" /> 100 points issued to Laura Bianchi
                <span className="ml-auto text-xs">yesterday</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-[#f8494c]" /> New promotion "Summer 2024" activated
                <span className="ml-auto text-xs">3 days ago</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 