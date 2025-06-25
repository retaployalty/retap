"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressInput } from "@/components/ui/address-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GB, US, IT, CH, AT, FR, DE, ES, CA, AU, JP, CN, IN, BR, RU } from 'country-flag-icons/react/3x2';
import { AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const BUSINESS_CATEGORIES = [
  "Restaurant",
  "Pizzeria",
  "Bar",
  "Cafe",
  "Bakery",
  "Ice Cream Shop",
  "Hair Salon",
  "Beauty Salon",
  "Spa",
  "Gym",
  "Clothing Store",
  "Shoe Store",
  "Jewelry Store",
  "Bookstore",
  "Other"
] as const;

type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

const COUNTRIES = [
  { code: "IT", name: "Italy", flag: IT },
  { code: "US", name: "United States", flag: US },
  { code: "GB", name: "United Kingdom", flag: GB },
  { code: "CH", name: "Switzerland", flag: CH },
  { code: "AT", name: "Austria", flag: AT },
  { code: "FR", name: "France", flag: FR },
  { code: "DE", name: "Germany", flag: DE },
  { code: "ES", name: "Spain", flag: ES },
  { code: "CA", name: "Canada", flag: CA },
  { code: "AU", name: "Australia", flag: AU },
  { code: "JP", name: "Japan", flag: JP },
  { code: "CN", name: "China", flag: CN },
  { code: "IN", name: "India", flag: IN },
  { code: "BR", name: "Brazil", flag: BR },
  { code: "RU", name: "Russia", flag: RU },
];

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get("companyName") as string;
    const country = formData.get("country") as string;
    const industry = formData.get("industry") as BusinessCategory;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create merchant with coordinates
      const merchantData: any = {
        name: companyName,
        country: country,
        industry: industry,
        address: address,
        profile_id: user.id
      };

      // Aggiungi le coordinate se disponibili
      if (coordinates) {
        merchantData.latitude = coordinates.latitude;
        merchantData.longitude = coordinates.longitude;
      }

      const { error: merchantError } = await supabase
        .from('merchants')
        .insert([merchantData]);

      if (merchantError) throw merchantError;

      toast.success("Registrazione completata con successo!");
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : "Error during business registration";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
  };

  const handleCoordinatesChange = (latitude: number, longitude: number) => {
    setCoordinates({ latitude, longitude });
    toast.success("Coordinate trovate e salvate!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            Registra il tuo Negozio
          </h1>
          <p className="text-gray-600">
            Completa la registrazione per iniziare a utilizzare ReTap
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-[#1A1A1A]">
              Informazioni Negozio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-[#1A1A1A]">Nome Negozio</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  placeholder="es. Pizzeria da Mario"
                  className="rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-[#1A1A1A]">Paese</Label>
                <Select name="country" required>
                  <SelectTrigger className="rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all">
                    <SelectValue placeholder="Seleziona il paese" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => {
                      const FlagComponent = country.flag;
                      return (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <FlagComponent className="w-4 h-3" />
                            {country.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-[#1A1A1A]">Categoria</Label>
                <Select name="industry" required>
                  <SelectTrigger className="rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all">
                    <SelectValue placeholder="Seleziona la categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <AddressInput
                value={address}
                onChange={handleAddressChange}
                onCoordinatesChange={handleCoordinatesChange}
                label="Indirizzo Negozio"
                placeholder="es. Via Roma 123, Milano, Italia"
                required
                className="rounded-lg"
              />

              {coordinates && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Coordinate trovate:</strong><br />
                    Lat: {coordinates.latitude.toFixed(6)}<br />
                    Lon: {coordinates.longitude.toFixed(6)}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-[#1A1A1A] hover:bg-[#FF3131] text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Completa Registrazione
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}