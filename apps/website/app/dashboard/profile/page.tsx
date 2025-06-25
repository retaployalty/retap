"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Clock, 
  Image as ImageIcon, 
  Phone, 
  Store, 
  Calendar, 
  X, 
  Eye, 
  Upload, 
  Settings, 
  ImagePlus, 
  Pencil, 
  ArrowLeft, 
  ArrowRight,
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BusinessProfile, BusinessHours, AnnualClosure } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { AddressInput } from "@/components/ui/address-input";

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function BusinessProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [newClosure, setNewClosure] = useState<Omit<AnnualClosure, 'id'>>({
    date: "",
    name: "",
    description: "",
    isRecurring: false,
  });
  const [profile, setProfile] = useState<BusinessProfile>({
    name: "",
    phone: "",
    googleMapsUrl: "",
    hours: {
      Monday: { open: "09:00", close: "18:00", closed: false },
      Tuesday: { open: "09:00", close: "18:00", closed: false },
      Wednesday: { open: "09:00", close: "18:00", closed: false },
      Thursday: { open: "09:00", close: "18:00", closed: false },
      Friday: { open: "09:00", close: "18:00", closed: false },
      Saturday: { open: "09:00", close: "18:00", closed: false },
      Sunday: { open: "09:00", close: "18:00", closed: true },
    },
    logoUrl: "",
    coverImages: [],
    annualClosures: [],
    galleryImages: [],
  });
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: merchant, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (merchant) {
        setProfile(prev => ({
          ...prev,
          name: merchant.name || "",
          phone: merchant.phone || "",
          googleMapsUrl: merchant.google_maps_url || "",
          logoUrl: merchant.logo_url || "",
          coverImages: merchant.cover_image_url || [],
          hours: merchant.hours || prev.hours,
          annualClosures: merchant.annual_closures || [],
          galleryImages: merchant.gallery_images || [],
        }));

        // Imposta l'indirizzo e le coordinate se disponibili
        if (merchant.address) {
          setAddress(merchant.address);
        }
        if (merchant.latitude && merchant.longitude) {
          setCoordinates({
            latitude: merchant.latitude,
            longitude: merchant.longitude
          });
        }
      }
    };

    fetchMerchant();
  }, []);

  const handleInputChange = (field: keyof BusinessProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleAddClosure = () => {
    if (!newClosure.name) {
      toast.error("Please enter at least the closure name");
      return;
    }

    setProfile(prev => ({
      ...prev,
      annualClosures: [
        ...prev.annualClosures,
        {
          ...newClosure,
          id: Math.random().toString(36).substr(2, 9),
        }
      ]
    }));

    setNewClosure({
      date: "",
      name: "",
      description: "",
      isRecurring: false,
    });

    setHasChanges(true);
    toast.success("Closure added successfully");
  };

  const handleRemoveClosure = (id: string) => {
    setProfile(prev => ({
      ...prev,
      annualClosures: prev.annualClosures.filter(closure => closure.id !== id)
    }));
    setHasChanges(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `merchants/${user.id}/logo.${file.name.split('.').pop()}`;
      
      // Remove old logo if exists
      if (profile.logoUrl) {
        const oldFileName = profile.logoUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('business-media')
            .remove([`merchants/${user.id}/${oldFileName}`]);
        }
      }

      const { data, error: uploadError } = await supabase.storage
        .from('business-media')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      if (!data?.path) {
        throw new Error("No path returned after upload");
      }

      const { data: { publicUrl } } = supabase.storage
        .from('business-media')
        .getPublicUrl(data.path);

      setProfile(prev => ({ ...prev, logoUrl: publicUrl }));
      setHasChanges(true);
      toast.success("Logo updated successfully");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Error uploading logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const uploadPromises = files.map(async (file, index) => {
        const fileName = `merchants/${user.id}/cover_${Date.now()}_${index}.${file.name.split('.').pop()}`;
        
        const { data, error } = await supabase.storage
          .from('business-media')
          .upload(fileName, file, { 
            cacheControl: '3600'
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('business-media')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      setProfile(prev => ({ 
        ...prev, 
        coverImages: [...(prev.coverImages || []), ...newUrls] 
      }));
      setHasChanges(true);
      toast.success(`${files.length} cover image(s) uploaded successfully`);
    } catch (error) {
      console.error("Error uploading cover images:", error);
      toast.error("Error uploading cover images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCoverImage = async (index: number) => {
    try {
      const imageUrl = profile.coverImages[index];
      const fileName = imageUrl.split('/').pop();
      
      if (fileName) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.storage
            .from('business-media')
            .remove([`merchants/${user.id}/${fileName}`]);
        }
      }

      setProfile(prev => ({
        ...prev,
        coverImages: prev.coverImages.filter((_, i) => i !== index)
      }));
      setHasChanges(true);
      toast.success("Cover image removed");
    } catch (error) {
      console.error("Error removing cover image:", error);
      toast.error("Error removing cover image");
    }
  };

  const moveCoverImage = (from: number, to: number) => {
    const newImages = [...profile.coverImages];
    const [movedImage] = newImages.splice(from, 1);
    newImages.splice(to, 0, movedImage);
    setProfile(prev => ({ ...prev, coverImages: newImages }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id, country, industry, address')
        .eq('profile_id', user.id)
        .single();

      if (merchantError) {
        console.error("Error fetching merchant:", merchantError);
        throw new Error(`Merchant fetch error: ${merchantError.message}`);
      }

      if (!merchant) throw new Error("Merchant not found");

      // Validate and clean data before sending
      const updateData: any = {
        name: profile.name || null,
        phone: profile.phone || null,
        google_maps_url: profile.googleMapsUrl || null,
        logo_url: profile.logoUrl || null,
        cover_image_url: profile.coverImages && profile.coverImages.length > 0 ? profile.coverImages : null,
        hours: profile.hours || null,
        annual_closures: profile.annualClosures && profile.annualClosures.length > 0 ? profile.annualClosures : null,
        address: address || null,
      };

      // Aggiungi le coordinate se disponibili
      if (coordinates) {
        updateData.latitude = coordinates.latitude;
        updateData.longitude = coordinates.longitude;
      }

      // Remove null values to avoid database constraints
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== null)
      );

      console.log("Updating merchant with cleaned data:", cleanedData);
      console.log("Merchant ID:", merchant.id);

      const { error } = await supabase
        .from('merchants')
        .update(cleanedData)
        .eq('id', merchant.id);

      if (error) {
        console.error("Supabase update error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        throw new Error(`Update error: ${error.message || 'Unknown database error'}`);
      }

      setHasChanges(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Error saving profile: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    setHasChanges(true);
  };

  const handleCoordinatesChange = (latitude: number, longitude: number) => {
    setCoordinates({ latitude, longitude });
    setHasChanges(true);
    toast.success("Coordinate aggiornate!");
  };

  return (
    <div className="space-y-6 min-h-screen p-6">
      {/* Header with Save Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Business Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your store information and settings</p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unsaved changes
            </Badge>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !hasChanges}
            className="bg-[#f8494c] hover:bg-[#f8494c]/90"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="closures" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Closures
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-[#f8494c]" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Main details about your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Store Name and Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-medium">Store Name *</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your store name"
                        className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                      />
                    </div>
                  </div>

                  {/* Address with Geocoding */}
                  <AddressInput
                    value={address}
                    onChange={handleAddressChange}
                    onCoordinatesChange={handleCoordinatesChange}
                    label="Indirizzo Negozio"
                    placeholder="es. Via Roma 123, Milano, Italia"
                    className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="googleMapsUrl" className="font-medium">Google Maps Link</Label>
                    <Input
                      id="googleMapsUrl"
                      value={profile.googleMapsUrl}
                      onChange={(e) => handleInputChange('googleMapsUrl', e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Help customers find your location easily
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Logo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-[#f8494c]" />
                    Store Logo
                  </CardTitle>
                  <CardDescription>Upload your business logo (recommended: 512x512px)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 shadow-sm flex items-center justify-center bg-gray-50 overflow-hidden hover:border-[#f8494c] transition-colors">
                        {profile.logoUrl ? (
                          <img
                            src={profile.logoUrl}
                            alt="Store Logo"
                            className="object-cover w-full h-full rounded-full"
                          />
                        ) : (
                          <ImagePlus className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute -bottom-2 -right-2 bg-white border-2 border-white shadow-md hover:bg-gray-50"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                    {isUploading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#f8494c]" />
                        Uploading...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cover Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-[#f8494c]" />
                    Cover Images
                  </CardTitle>
                  <CardDescription>Add up to 6 images to showcase your business (recommended: 1200x400px)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {profile.coverImages && profile.coverImages.length > 0 ? (
                        profile.coverImages.slice(0, 6).map((image, index) => (
                          <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border shadow-sm bg-white">
                            <img
                              src={image}
                              alt={`Cover ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              {index > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="bg-white/90 hover:bg-white h-7 w-7"
                                  onClick={() => moveCoverImage(index, index - 1)}
                                  disabled={isUploading}
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="bg-white/90 hover:bg-white h-7 w-7"
                                onClick={() => handleRemoveCoverImage(index)}
                                disabled={isUploading}
                              >
                                <X className="h-3 w-3 text-red-500" />
                              </Button>
                              {index < profile.coverImages.length - 1 && index < 5 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="bg-white/90 hover:bg-white h-7 w-7"
                                  onClick={() => moveCoverImage(index, index + 1)}
                                  disabled={isUploading}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))
                      ) : null}
                      
                      {(!profile.coverImages || profile.coverImages.length < 6) && (
                        <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 hover:border-[#f8494c] transition-colors cursor-pointer">
                          <input
                            type="file"
                            ref={coverInputRef}
                            onChange={handleCoverUpload}
                            accept="image/*"
                            multiple
                            className="hidden"
                          />
                          <Button
                            variant="ghost"
                            onClick={() => coverInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex flex-col items-center gap-2 h-full w-full"
                          >
                            <ImagePlus className="h-6 w-6 text-gray-400" />
                            <span className="text-xs text-gray-500">Add Image</span>
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {profile.coverImages && profile.coverImages.length > 6 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Showing first 6 of {profile.coverImages.length} images
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="hours" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#f8494c]" />
                    Opening Hours
                  </CardTitle>
                  <CardDescription>Set your business operating hours for each day of the week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {WEEKDAYS.map((day, index) => {
                      const hours = profile.hours[day];
                      return (
                        <motion.div
                          key={day}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-24 font-medium text-sm">
                            {day}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={!hours.closed}
                              onCheckedChange={(checked) => handleHoursChange(day, 'closed', !checked)}
                              className="data-[state=checked]:bg-[#f8494c]"
                            />
                            <span className="text-sm text-muted-foreground min-w-[60px]">
                              {hours.closed ? 'Closed' : 'Open'}
                            </span>
                          </div>
                          
                          {!hours.closed && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={hours.open}
                                onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                className="w-28 transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                              />
                              <span className="text-sm text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={hours.close}
                                onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                className="w-28 transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                              />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="closures" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#f8494c]" />
                    Annual Closures
                  </CardTitle>
                  <CardDescription>Manage holidays and closure periods for your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Closure */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-4">Add New Closure</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={newClosure.date}
                          onChange={(e) => setNewClosure(prev => ({ ...prev, date: e.target.value }))}
                          className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={newClosure.name}
                          onChange={(e) => setNewClosure(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Summer Holidays"
                          className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label>Description</Label>
                      <Textarea
                        value={newClosure.description}
                        onChange={(e) => setNewClosure(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description of the closure"
                        className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Switch
                        checked={newClosure.isRecurring}
                        onCheckedChange={(checked) => setNewClosure(prev => ({ ...prev, isRecurring: checked }))}
                        className="data-[state=checked]:bg-[#f8494c]"
                      />
                      <Label className="text-sm">Recurring annually</Label>
                    </div>
                    <Button 
                      onClick={handleAddClosure} 
                      className="mt-4 bg-[#f8494c] hover:bg-[#f8494c]/90"
                      disabled={!newClosure.name || !newClosure.date}
                    >
                      Add Closure
                    </Button>
                  </div>

                  <Separator />

                  {/* Existing Closures */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Existing Closures</h4>
                    {profile.annualClosures.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No closures added yet</p>
                        <p className="text-sm">Add your first closure above</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {profile.annualClosures.map((closure) => (
                          <motion.div
                            key={closure.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium">{closure.name}</h5>
                                {closure.isRecurring && (
                                  <Badge variant="secondary" className="text-xs">
                                    Recurring
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{closure.date}</p>
                              {closure.description && (
                                <p className="text-sm mt-1 text-gray-600">{closure.description}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveClosure(closure.id)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}