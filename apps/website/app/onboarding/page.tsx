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
import { GB, US, IT, CH, AT, FR, DE, ES, CA, AU, JP, CN, IN, BR, RU, PT, BE, NL, IE, DK, SE, NO, FI, PL, CZ, SK, HU, SI, HR, RO, BG, GR, EE, LV, LT, LU, MT, CY } from 'country-flag-icons/react/3x2';
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
  { code: "PT", name: "Portugal", flag: PT },
  { code: "BE", name: "Belgium", flag: BE },
  { code: "NL", name: "Netherlands", flag: NL },
  { code: "IE", name: "Ireland", flag: IE },
  { code: "DK", name: "Denmark", flag: DK },
  { code: "SE", name: "Sweden", flag: SE },
  { code: "NO", name: "Norway", flag: NO },
  { code: "FI", name: "Finland", flag: FI },
  { code: "PL", name: "Poland", flag: PL },
  { code: "CZ", name: "Czech Republic", flag: CZ },
  { code: "SK", name: "Slovakia", flag: SK },
  { code: "HU", name: "Hungary", flag: HU },
  { code: "SI", name: "Slovenia", flag: SI },
  { code: "HR", name: "Croatia", flag: HR },
  { code: "RO", name: "Romania", flag: RO },
  { code: "BG", name: "Bulgaria", flag: BG },
  { code: "GR", name: "Greece", flag: GR },
  { code: "EE", name: "Estonia", flag: EE },
  { code: "LV", name: "Latvia", flag: LV },
  { code: "LT", name: "Lithuania", flag: LT },
  { code: "LU", name: "Luxembourg", flag: LU },
  { code: "MT", name: "Malta", flag: MT },
  { code: "CY", name: "Cyprus", flag: CY },
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

      toast.success("Registration completed successfully!");
      
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
    toast.success("Coordinates found and saved!");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            Register your Business
          </h1>
          <p className="text-gray-600">
            Complete the registration to start using ReTap
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-[#1A1A1A]">
              Business Information
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
                <Label htmlFor="companyName" className="text-[#1A1A1A]">Business Name <span className="text-red-500">*</span></Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  placeholder="e.g. Mario's Pizzeria"
                  className="rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-[#1A1A1A]">Country <span className="text-red-500">*</span></Label>
                <Select name="country" required>
                  <SelectTrigger className="rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                          {country.flag ? <country.flag className="w-4 h-3" /> : null}
                          {country.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-[#1A1A1A]">Category <span className="text-red-500">*</span></Label>
                <Select name="industry" required>
                  <SelectTrigger className="rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all">
                    <SelectValue placeholder="Select category" />
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
                label="Business Address"
                placeholder="e.g. 123 Main St, Milan, Italy"
                required
                className="rounded-lg"
              />

              {coordinates && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Coordinates found:</strong><br />
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
                    Complete Registration
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