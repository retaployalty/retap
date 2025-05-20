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
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Transaction {
  id: string;
  points: number;
  created_at: string;
  merchant: {
    name: string;
  };
  card: {
    uid: string;
    customer: {
      email: string;
    };
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          merchant:merchants(name),
          card:cards(
            uid,
            customer:customers(email)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.card.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.card.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Visualizza tutte le transazioni delle carte
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista Transazioni</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca transazione..."
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
                <TableHead>Cliente</TableHead>
                <TableHead>Carta</TableHead>
                <TableHead>Punti</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.merchant.name}
                  </TableCell>
                  <TableCell>{transaction.card.customer.email}</TableCell>
                  <TableCell>{transaction.card.uid}</TableCell>
                  <TableCell>{transaction.points}</TableCell>
                  <TableCell>
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 