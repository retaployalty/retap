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
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Globe } from "lucide-react";

interface Merchant {
  id: string;
  name: string;
  country: string;
  industry: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
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
    merchant.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasCoordinates = (merchant: Merchant) => {
    return merchant.latitude !== null && merchant.longitude !== null;
  };

  const openInMap = (latitude: number, longitude: number) => {
    window.open(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`, '_blank');
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
                  placeholder="Cerca negozio, email o indirizzo..."
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
                <TableHead>Coordinate</TableHead>
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
                  <TableCell>
                    <Badge variant="outline">{merchant.country}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{merchant.industry}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm truncate" title={merchant.address}>
                        {merchant.address || "Non specificato"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {hasCoordinates(merchant) ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {merchant.latitude?.toFixed(4)}, {merchant.longitude?.toFixed(4)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInMap(merchant.latitude!, merchant.longitude!)}
                          className="h-6 w-6 p-0"
                        >
                          <Globe className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-gray-500">
                        Non geocodificato
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(merchant.created_at).toLocaleDateString('it-IT')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredMerchants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nessun negozio trovato</p>
              <p className="text-sm">Prova a modificare i criteri di ricerca</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totale Negozio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchants.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Con Coordinate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {merchants.filter(hasCoordinates).length}
            </div>
            <p className="text-xs text-gray-500">
              {((merchants.filter(hasCoordinates).length / merchants.length) * 100).toFixed(1)}% del totale
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Senza Coordinate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {merchants.filter(m => !hasCoordinates(m)).length}
            </div>
            <p className="text-xs text-gray-500">
              Necessitano geocoding
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}