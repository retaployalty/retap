"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CreditCard, 
  Gift, 
  TrendingUp, 
  Clock, 
  Repeat, 
  BarChart2, 
  Calendar,
  Download,
  Percent,
  Award,
  PieChart,
  Plus,
  Settings,
  HelpCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Custom tooltip styles
const tooltipStyles = {
  tooltip: "bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-2 text-sm text-gray-600 max-w-[200px]",
  arrow: "fill-white border-gray-200"
};

export default function DashboardPage() {
  const [merchant, setMerchant] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("today");
  const supabase = createClientComponentClient();

  // Sample data for peak hours - this would come from your API
  const peakHoursData = [
    { hour: '9:00', transactions: 12 },
    { hour: '10:00', transactions: 18 },
    { hour: '11:00', transactions: 25 },
    { hour: '12:00', transactions: 30 },
    { hour: '13:00', transactions: 28 },
    { hour: '14:00', transactions: 22 },
    { hour: '15:00', transactions: 20 },
    { hour: '16:00', transactions: 24 },
    { hour: '17:00', transactions: 27 },
    { hour: '18:00', transactions: 32 },
    { hour: '19:00', transactions: 29 },
    { hour: '20:00', transactions: 15 },
  ];

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
    <div className="space-y-8 min-h-screen p-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-extrabold">Dashboard</h1>
          <p className="text-lg text-[#f8494c] font-semibold mt-1">Welcome, {merchant?.name || "Business"}</p>
          <p className="text-muted-foreground text-sm mt-1">Monitor your customers, cards and points in real time</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <Button variant="outline" className="font-medium h-10 px-4 shadow-none flex items-center gap-2 hover:bg-[#f8494c] hover:text-white transition-colors">
            <Download className="h-4 w-4 mr-1" /> Download Report
          </Button>
        </div>
      </div>

      {/* Time Filter */}
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="year">This year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-6 w-6 text-[#f8494c]" /> Active Customers
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-[#f8494c] transition-colors" />
                </TooltipTrigger>
                <TooltipContent className={tooltipStyles.tooltip} sideOffset={5}>
                  <p>Shows the number of unique customers who made at least one transaction in the selected time period</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-[#f8494c]" /> Issued Physical Cards
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-[#f8494c] transition-colors" />
                </TooltipTrigger>
                <TooltipContent className={tooltipStyles.tooltip} sideOffset={5}>
                  <p>Total number of active NFC physical cards currently registered in your store</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">0</div>
            <p className="text-xs text-muted-foreground">NFC cards issued</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Repeat className="h-6 w-6 text-[#f8494c]" /> Customer Retention
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-[#f8494c] transition-colors" />
                </TooltipTrigger>
                <TooltipContent className={tooltipStyles.tooltip} sideOffset={5}>
                  <p>Percentage of customers who have returned to your store at least once in the last 30 days</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">0%</div>
            <p className="text-xs text-muted-foreground">Returning customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Points and Analysis Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Points Trend</CardTitle>
            <BarChart2 className="h-5 w-5 text-[#f8494c]" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border rounded-lg bg-card">
              Points chart (coming soon)
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 hover:shadow-md transition-shadow">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle>Peak Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={peakHoursData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 40]} />
                  <YAxis 
                    dataKey="hour" 
                    type="category" 
                    width={50}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip
                    formatter={(value) => [`${value} transactions`, '']}
                    labelFormatter={(label) => `Hour: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#64748b'
                    }}
                  />
                  <Bar 
                    dataKey="transactions" 
                    fill="#f8494c"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Average transactions per hour based on store opening hours
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards and Segmentation Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle>Most Requested Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#f8494c]" />
                  <span className="text-sm">Reward 1</span>
                </div>
                <span className="text-sm font-medium">0 redemptions</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#f8494c]" />
                  <span className="text-sm">Reward 2</span>
                </div>
                <span className="text-sm font-medium">0 redemptions</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#f8494c]" />
                  <span className="text-sm">Reward 3</span>
                </div>
                <span className="text-sm font-medium">0 redemptions</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle>Customer Segmentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-[#f8494c] mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">New vs Returning</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New</span>
                    <span className="text-sm font-medium">0%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Returning</span>
                    <span className="text-sm font-medium">0%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Points History */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="space-y-0 pb-2">
          <CardTitle>Points History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground border rounded-lg bg-card">
            Points distribution/redemption history chart (coming soon)
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 