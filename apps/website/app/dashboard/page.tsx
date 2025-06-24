"use client";

import * as React from "react";
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
  HelpCircle,
  Activity,
  Crown,
  UserCheck,
  UserX
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";

// Custom tooltip styles
const tooltipStyles = {
  tooltip: "bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-2 text-sm text-gray-600 max-w-[200px]",
  arrow: "fill-white border-gray-200"
};

export default function DashboardPage() {
  const [merchant, setMerchant] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("today");
  const supabase = createClientComponentClient();
  
  // Utilizzo il hook personalizzato per le statistiche
  const { stats, loading, error } = useDashboardStats(merchant?.id, timeRange);

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

  if (loading) {
    return (
      <div className="space-y-8 min-h-screen p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Caricamento dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 min-h-screen p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-2">Errore nel caricamento</div>
            <div className="text-sm text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

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
                  <p>Unique customers with at least one transaction in the selected period</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.activeCustomers}</div>
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
                  <p>Total number of active NFC physical cards registered</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.issuedCards}</div>
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
                  <p>Percentage of customers who returned in the last 30 days</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.customerRetention}%</div>
            <p className="text-xs text-muted-foreground">Returning customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Points and Transaction Volume Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              Points Trend
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-[#f8494c] transition-colors" />
                </TooltipTrigger>
                <TooltipContent className={tooltipStyles.tooltip} sideOffset={5}>
                  <p>Points accumulated today, this week and this month</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{stats.pointsToday}</p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats.pointsThisWeek}</p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{stats.pointsThisMonth}</p>
              </div>
            </div>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border rounded-lg bg-card">
              {stats.pointsTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.pointsTrend}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      domain={[0, Math.max(...stats.pointsTrend.map(d => d.points)) + 10]}
                    />
                    <RechartsTooltip
                      formatter={(value) => [`${value} points`, '']}
                      labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('en-US')}`}
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
                      dataKey="points" 
                      fill="#f8494c"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No points data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#f8494c]" />
              Transaction Volume
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-[#f8494c] transition-colors" />
                </TooltipTrigger>
                <TooltipContent className={tooltipStyles.tooltip} sideOffset={5}>
                  <p>Daily number of transactions in the selected period</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {stats.transactionVolume.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.transactionVolume}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={[0, Math.max(...stats.transactionVolume.map(d => d.transactions)) + 2]}
                    />
                    <RechartsTooltip
                      formatter={(value) => [`${value} transactions`, '']}
                      labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('en-US')}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#64748b'
                      }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="transactions" 
                      stroke="#f8494c"
                      strokeWidth={2}
                      dot={{ fill: '#f8494c', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#f8494c', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No transaction data available
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Daily transaction volume in the selected period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reward Performance and Customer Segmentation Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#f8494c]" />
              Reward Performance
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-[#f8494c] transition-colors" />
                </TooltipTrigger>
                <TooltipContent className={tooltipStyles.tooltip} sideOffset={5}>
                  <p>Reward statistics: totals, redemption rate and most popular rewards</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Reward Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-card rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Rewards</p>
                  <p className="text-xl font-bold">{stats.rewardPerformance.totalRewards}</p>
                </div>
                <div className="text-center p-3 bg-card rounded-lg">
                  <p className="text-sm text-muted-foreground">Redemption Rate</p>
                  <p className="text-xl font-bold">{stats.rewardPerformance.redemptionRate}%</p>
                </div>
              </div>
              
              {/* Top Rewards */}
              <div>
                <h4 className="text-sm font-medium mb-3">Top Performing Rewards</h4>
                <div className="space-y-3">
                  {stats.rewardPerformance.topRewards.length > 0 ? (
                    stats.rewardPerformance.topRewards.map((reward, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-[#f8494c]" />
                          <span className="text-sm font-medium">{reward.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{reward.redemptions} redemptions</div>
                          <div className="text-xs text-muted-foreground">{reward.pointsCost} points</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No rewards redeemed yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#f8494c]" />
              Customer Segmentation
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-[#f8494c] transition-colors" />
                </TooltipTrigger>
                <TooltipContent className={tooltipStyles.tooltip} sideOffset={5}>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Segments:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3 w-3 text-green-600" />
                        <span><strong>New:</strong> First transaction within 30 days</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat className="h-3 w-3 text-blue-600" />
                        <span><strong>Returning:</strong> Active customers for 30+ days</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Crown className="h-3 w-3 text-yellow-600" />
                        <span><strong>VIP:</strong> 1000+ points OR 10+ transactions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserX className="h-3 w-3 text-red-600" />
                        <span><strong>Inactive:</strong> No visits for 90+ days</span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total Customers */}
              <div className="text-center p-3 bg-card rounded-lg">
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{stats.customerSegmentation.totalCustomers}</p>
              </div>
              
              {/* Segments */}
              <div className="space-y-3">
                {stats.customerSegmentation.segments.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {segment.segment === 'New' && <UserCheck className="h-4 w-4 text-green-600" />}
                      {segment.segment === 'Returning' && <Repeat className="h-4 w-4 text-blue-600" />}
                      {segment.segment === 'VIP' && <Crown className="h-4 w-4 text-yellow-600" />}
                      {segment.segment === 'Inactive' && <UserX className="h-4 w-4 text-red-600" />}
                      <span className="text-sm font-medium">{segment.segment}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{segment.count}</div>
                      <div className="text-xs text-muted-foreground">{segment.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 