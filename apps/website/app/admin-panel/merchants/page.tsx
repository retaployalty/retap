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
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface Merchant {
  id: string;
  name: string;
  country: string;
  industry: string;
  address: string;
  created_at: string;
  profile: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      const { data, error } = await supabase
        .from("merchants")
        .select(`
          *,
          profile:profiles(email, first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMerchants(data || []);
    } catch (error) {
      console.error("Error loading merchants:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = merchants.filter((merchant) =>
    merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-3xl font-bold text-gray-900">Merchants</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestisci tutti i negozi registrati
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista Negozio</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca negozio..."
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
                <TableHead>Nome Negozio</TableHead>
                <TableHead>Proprietario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Paese</TableHead>
                <TableHead>Settore</TableHead>
                <TableHead>Indirizzo</TableHead>
                <TableHead>Data Registrazione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMerchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell className="font-medium">{merchant.name}</TableCell>
                  <TableCell>
                    {merchant.profile.first_name} {merchant.profile.last_name}
                  </TableCell>
                  <TableCell>{merchant.profile.email}</TableCell>
                  <TableCell>{merchant.country}</TableCell>
                  <TableCell>{merchant.industry}</TableCell>
                  <TableCell>{merchant.address}</TableCell>
                  <TableCell>
                    {new Date(merchant.created_at).toLocaleDateString()}
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