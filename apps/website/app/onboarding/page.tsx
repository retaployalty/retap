"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GB, US, IT, CH, AT, FR, DE, ES, CA, AU, JP, CN, IN, BR, RU } from 'country-flag-icons/react/3x2';

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

interface Country {
  code: string;
  name: string;
  flag: React.ComponentType<{ className?: string }>;
}

const COUNTRIES: Country[] = [
  { code: "IT", name: "Italy", flag: IT },
  { code: "CH", name: "Switzerland", flag: CH },
  { code: "AT", name: "Austria", flag: AT },
  { code: "FR", name: "France", flag: FR },
  { code: "DE", name: "Germany", flag: DE },
  { code: "ES", name: "Spain", flag: ES },
  { code: "GB", name: "United Kingdom", flag: GB },
  { code: "US", name: "United States", flag: US },
  { code: "CA", name: "Canada", flag: CA },
  { code: "AU", name: "Australia", flag: AU },
  { code: "JP", name: "Japan", flag: JP },
  { code: "CN", name: "China", flag: CN },
  { code: "IN", name: "India", flag: IN },
  { code: "BR", name: "Brazil", flag: BR },
  { code: "RU", name: "Russia", flag: RU }
].sort((a, b) => a.name.localeCompare(b.name));

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    const address = formData.get("address") as string;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create merchant
      const { error: merchantError } = await supabase
        .from('merchants')
        .insert([
          {
            name: companyName,
            country: country,
            industry: industry,
            address: address,
            profile_id: user.id
          }
        ]);

      if (merchantError) throw merchantError;

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : "Error during business registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Register your business</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Business Name</Label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                required
                placeholder="e.g. Bella Napoli Pizzeria"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select name="country" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => {
                    const Flag = country.flag;
                    return (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                          <Flag className="w-5 h-4" />
                          <span>{country.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Business Category</Label>
              <Select name="industry" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                type="text"
                required
                placeholder="e.g. 123 Main St, City"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Registering..." : "Complete Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 