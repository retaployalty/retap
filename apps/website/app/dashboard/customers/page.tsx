"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ChevronRight, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { format } from "date-fns"

interface Customer {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  created_at: string
  cards_count: number
  total_points: number
  last_transaction: string | null
}

interface Transaction {
  id: string;
  points: number;
  created_at: string;
  merchant_id: string;
  reward_name?: string | null;
  status?: string | null;
}

interface RedeemedReward {
  id: string;
  reward_id: string;
  reward_name: string;
  points_spent: number;
  redeemed_at: string;
  status: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({})
  const [rewards, setRewards] = useState<Record<string, RedeemedReward[]>>({})
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  async function loadCustomers() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("profile_id", user.id)
        .single()

      if (!merchant) return

      const { data, error } = await supabase
        .rpc('get_merchant_customers', { p_merchant_id: merchant.id })

      if (error) throw error

      console.log('Dati clienti ricevuti:', data)
      setCustomers(data as Customer[] || [])
    } catch (error) {
      console.error("Error loading customers:", error)
      toast.error("Error loading customers")
    } finally {
      setLoading(false)
    }
  }

  async function loadCustomerDetails(customerId: string) {
    if (transactions[customerId] && rewards[customerId]) {
      setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
      return;
    }
    const { data: txs } = await supabase.rpc("get_customer_transactions", { p_customer_id: customerId });
    const { data: rds } = await supabase.rpc("get_customer_redeemed_rewards", { p_customer_id: customerId });
    setTransactions(prev => ({ ...prev, [customerId]: txs || [] }));
    setRewards(prev => ({ ...prev, [customerId]: rds || [] }));
    setExpandedCustomer(customerId);
  }

  useEffect(() => {
    loadCustomers()
  }, [supabase])

  if (loading) {
    return <div>Loading customers...</div>
  }

  return (
    <div className="space-y-8 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-extrabold">Customers</h1>
          <p className="text-lg text-[#f8494c] font-semibold mt-1">Customer Management</p>
          <p className="text-muted-foreground text-sm mt-1">View and manage your customer base</p>
        </div>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-6 w-6 text-[#f8494c]" /> Customer List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Points</TableHead>
                  <TableHead>Last Transaction</TableHead>
                  <TableHead>Dettagli</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <>
                    <TableRow key={customer.id}>
                      <TableCell>{customer.first_name || "-"}</TableCell>
                      <TableCell>{customer.last_name || "-"}</TableCell>
                      <TableCell>{customer.email || "No email"}</TableCell>
                      <TableCell>{customer.total_points}</TableCell>
                      <TableCell>
                        {customer.last_transaction 
                          ? isClient ? format(new Date(customer.last_transaction), "dd/MM/yyyy") : ""
                          : "No transactions"}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => loadCustomerDetails(customer.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            transition: "transform 0.2s"
                          }}
                          aria-label={expandedCustomer === customer.id ? "Chiudi dettagli" : "Apri dettagli"}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              transition: "transform 0.2s",
                              transform: expandedCustomer === customer.id ? "rotate(90deg)" : "rotate(0deg)"
                            }}
                          >
                            <ChevronRight size={20} color="#f8494c" />
                          </span>
                        </button>
                      </TableCell>
                    </TableRow>
                    {expandedCustomer === customer.id && (
                      <TableRow className="bg-muted/40">
                        <TableCell colSpan={6} className="p-6">
                          <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <h3 className="font-semibold text-lg mb-2 text-[#f8494c]">Transaction History</h3>
                            <div className="overflow-x-auto max-h-64 overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Points</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(() => {
                                    const allTransactions = [
                                      ...(transactions[customer.id] || []).map(tx => ({
                                        id: tx.id,
                                        date: new Date(tx.created_at),
                                        type: 'Transaction',
                                        description: tx.reward_name || 'Points earned',
                                        points: tx.points,
                                        status: 'completed'
                                      })),
                                      ...(rewards[customer.id] || [])
                                        .filter(reward => reward.status !== 'pending')
                                        .map(reward => ({
                                          id: reward.id,
                                          date: new Date(reward.redeemed_at),
                                          type: 'Reward',
                                          description: reward.reward_name,
                                          points: -reward.points_spent,
                                          status: reward.status
                                        }))
                                    ].sort((a, b) => b.date.getTime() - a.date.getTime());

                                    if (allTransactions.length === 0) {
                                      return (
                                    <TableRow>
                                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No activity found
                                      </TableCell>
                                    </TableRow>
                                      );
                                    }

                                    return allTransactions
                                      .slice(0, 10)
                                      .map(item => (
                                        <TableRow key={item.id}>
                                          <TableCell>
                                            {format(item.date, "dd/MM/yyyy HH:mm")}
                                          </TableCell>
                                          <TableCell>
                                            {item.description}
                                          </TableCell>
                                          <TableCell>
                                            <span className={item.points > 0 ? 'text-green-600' : 'text-[#f8494c]'}>
                                              {item.points > 0 ? '+' : ''}{item.points}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                              item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                              'bg-red-100 text-red-800'
                                            }`}>
                                              {item.status}
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                      ));
                                  })()}
                                </TableBody>
                              </Table>
                            </div>
                            {((transactions[customer.id]?.length || 0) + (rewards[customer.id]?.length || 0)) > 10 && (
                              <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                                <ChevronDown className="h-3 w-3" />
                                <span>More activity available</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 