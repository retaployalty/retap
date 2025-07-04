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
import { AlertCircle, ArrowRight, Building2, User } from "lucide-react";
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
  "Electronics Store",
  "Home & Garden",
  "Pet Store",
  "Pharmacy",
  "Other"
] as const;

type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

const COUNTRIES = [
  { code: "IT", name: "Italy", flag: IT },
  { code: "US", name: "United States", flag: US },
  { code: "GB", name: "United Kingdom", flag: GB },
  { code: "DE", name: "Germany", flag: DE },
  { code: "FR", name: "France", flag: FR },
  { code: "ES", name: "Spain", flag: ES },
  { code: "CH", name: "Switzerland", flag: CH },
  { code: "AT", name: "Austria", flag: AT },
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
  { code: "PT", name: "Portugal", flag: PT },
] as const;

export default function MerchantSignupPage() {
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
    
    // Merchant data
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string;
    
    // Business data
    const companyName = formData.get("companyName") as string;
    const country = formData.get("country") as string;
    const industry = formData.get("industry") as BusinessCategory;

    try {
      let userId: string;

      // 1. Check if user already exists
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (existingUser.user) {
        // User exists and password is correct
        userId = existingUser.user.id;
        
        // Check if user is already a merchant
        const { data: existingMerchant } = await supabase
          .from('merchants')
          .select('id')
          .eq('profile_id', userId)
          .single();

        if (existingMerchant) {
          setError('This email is already registered as a merchant. Please use a different email or contact support.');
          return;
        }

        // Check if user has a profile, create one if not
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (!existingProfile) {
          // Create profile for existing user
          const { error: profileCreateError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                first_name: firstName,
                last_name: lastName,
                phone_number: phone,
                email: email
              }
            ]);

          if (profileCreateError) throw profileCreateError;
        } else {
          // Update existing profile with new information
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: userId,
                first_name: firstName,
                last_name: lastName,
                phone_number: phone,
                email: email
              }
            ]);

          if (profileError) throw profileError;
        }

      } else {
        // User doesn't exist, register new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone_number: phone
            }
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            setError('This email is already registered. Please try logging in with your password or use a different email address.');
            return;
          }
          throw authError;
        }
        
        if (!authData.user) throw new Error("Error during user registration");
        userId = authData.user.id;

        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: userId,
              first_name: firstName,
              last_name: lastName,
              phone_number: phone,
              email: email
            }
          ]);

        if (profileError) throw profileError;
      }

      // 2. Create merchant with coordinates
      const merchantData: any = {
        name: companyName,
        country: country,
        industry: industry,
        address: address,
        profile_id: userId
      };

      if (coordinates) {
        merchantData.latitude = coordinates.latitude;
        merchantData.longitude = coordinates.longitude;
      }

      const { error: merchantError } = await supabase
        .from('merchants')
        .insert([merchantData]);

      if (merchantError) throw merchantError;

      // 3. Create Stripe checkout session for monthly subscription
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'BASIC',
          billingDetails: {
            email: email,
            firstName: firstName,
            lastName: lastName,
            company: companyName,
            supabase_id: userId
          },
          isAnnual: false, // Monthly subscription
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/merchant-signup?error=payment_cancelled`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(`Failed to create checkout session: ${errorData.error || response.statusText}`);
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout for monthly subscription
      window.location.href = url;

    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : "Error during registration";
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-3 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Join ReTap Business Network
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 px-2">
            Start accepting ReTap cards and grow your customer loyalty program
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
              Business Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Merchant Information */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-200">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Merchant Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your email address"
                  />
                  <p className="text-xs text-gray-500">
                    If you already have an account, we'll use your existing credentials
                  </p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password *
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Create a password (min 6 characters)"
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-200">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Business Information
                </h3>

                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                    Business Name *
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your business name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                      Country *
                    </Label>
                    <Select name="country" required>
                      <SelectTrigger className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => {
                          const FlagIcon = country.flag;
                          return (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center gap-2">
                                <FlagIcon className="h-4 w-4" />
                                {country.name}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                      Business Category *
                    </Label>
                    <Select name="industry" required>
                      <SelectTrigger className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <AddressInput
                    value={address}
                    onChange={handleAddressChange}
                    onCoordinatesChange={handleCoordinatesChange}
                    label="Business Address"
                    placeholder="e.g. 123 Main St, Milan, Italy"
                    required
                    className="h-11 sm:h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {coordinates && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Coordinates found:</strong><br />
                      Lat: {coordinates.latitude.toFixed(6)}<br />
                      Lon: {coordinates.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5">
                <p className="text-sm text-blue-700">
                  <strong>Subscription Required:</strong> After registration, you'll be redirected to complete your monthly subscription (€49/month + €99 activation fee).
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 sm:h-14 bg-[#1A1A1A] hover:bg-[#FF3131] text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 group text-base sm:text-lg font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Complete Registration & Proceed to Payment</span>
                    <span className="sm:hidden">Register & Pay</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
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