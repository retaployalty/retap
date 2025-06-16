"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Image as ImageIcon, Phone, Store, Calendar, X, Eye, Upload, Settings, ImagePlus, Pencil, ArrowLeft, ArrowRight } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BusinessProfile, BusinessHours, AnnualClosure } from "./types";
import { motion, AnimatePresence } from "framer-motion";

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function BusinessProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
      }
    };

    fetchMerchant();
  }, []);

  const handleInputChange = (field: keyof BusinessProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
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
  };

  const handleAddClosure = () => {
    if (!newClosure.name) {
      toast.error("Error", {
        description: "Please enter at least the closure name",
      });
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

    toast.success("Closure added", {
      description: "New annual closure added successfully",
    });
  };

  const handleRemoveClosure = (id: string) => {
    setProfile(prev => ({
      ...prev,
      annualClosures: prev.annualClosures.filter(closure => closure.id !== id)
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `merchants/${user.id}/logo.${file.name.split('.').pop()}`;
      
      console.log("Attempting to upload logo:", fileName);

      // Prima rimuoviamo il vecchio logo se esiste
      if (profile.logoUrl) {
        const oldFileName = profile.logoUrl.split('/').pop();
        if (oldFileName) {
          const { error: removeError } = await supabase.storage
            .from('business-media')
            .remove([`merchants/${user.id}/${oldFileName}`]);
          
          if (removeError) {
            console.warn("Error removing old logo:", removeError);
          }
        }
      }

      const { data, error: uploadError } = await supabase.storage
        .from('business-media')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw uploadError;
      }

      if (!data?.path) {
        throw new Error("Nessun percorso restituito dopo l'upload");
      }

      const { data: { publicUrl } } = supabase.storage
        .from('business-media')
        .getPublicUrl(data.path);

      console.log("Logo uploaded successfully:", publicUrl);

      setProfile(prev => ({ ...prev, logoUrl: publicUrl }));
      toast.success("Logo aggiornato", {
        description: "Il logo del negozio è stato aggiornato con successo.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto durante il caricamento";
      toast.error("Errore", {
        description: `Si è verificato un errore durante il caricamento del logo: ${errorMessage}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          const fileExt = file.name.split('.').pop();
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const fileName = `merchants/${user.id}/covers/${timestamp}-${randomString}.${fileExt}`;
          
          console.log("Attempting to upload file:", fileName);

          const { data, error: uploadError } = await supabase.storage
            .from('business-media')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error("Upload error details:", uploadError);
            throw uploadError;
          }

          if (!data?.path) {
            throw new Error("Nessun percorso restituito dopo l'upload");
          }

          const { data: { publicUrl } } = supabase.storage
            .from('business-media')
            .getPublicUrl(data.path);

          console.log("File uploaded successfully:", publicUrl);
          return publicUrl;
        } catch (fileError) {
          console.error("Error uploading single file:", fileError);
          throw fileError;
        }
      });

      const newUrls = await Promise.all(uploadPromises);
      
      if (newUrls.length === 0) {
        throw new Error("Nessuna immagine è stata caricata con successo");
      }

      setProfile(prev => ({
        ...prev,
        coverImages: [...(prev.coverImages || []), ...newUrls].slice(0, 6)
      }));

      toast.success("Immagini caricate", {
        description: "Le immagini di copertina sono state caricate con successo.",
      });
    } catch (error) {
      console.error("Error uploading cover images:", error);
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto durante il caricamento";
      toast.error("Errore", {
        description: `Si è verificato un errore durante il caricamento delle immagini: ${errorMessage}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCoverImage = async (index: number) => {
    try {
      const imageUrl = profile.coverImages[index];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = imageUrl.split('/').pop();
      
      if (fileName) {
        const { error } = await supabase.storage
          .from('business-media')
          .remove([`merchants/${user.id}/covers/${fileName}`]);

        if (error) throw error;
      }

      setProfile(prev => ({
        ...prev,
        coverImages: prev.coverImages.filter((_, i) => i !== index)
      }));

      toast.success("Immagine rimossa", {
        description: "L'immagine di copertina è stata rimossa con successo.",
      });
    } catch (error) {
      console.error("Error removing cover image:", error);
      toast.error("Errore", {
        description: "Si è verificato un errore durante la rimozione dell'immagine.",
      });
    }
  };

  const moveCoverImage = (from: number, to: number) => {
    setProfile(prev => {
      const images = [...(prev.coverImages || [])];
      if (to < 0 || to >= images.length) return prev;
      const [moved] = images.splice(from, 1);
      images.splice(to, 0, moved);
      return { ...prev, coverImages: images };
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (merchantError || !merchant) throw new Error("Merchant not found");

      const merchantId = merchant.id;

      const { error } = await supabase
        .from('merchants')
        .update({
          name: profile.name,
          phone: profile.phone,
          google_maps_url: profile.googleMapsUrl,
          logo_url: profile.logoUrl,
          cover_image_url: profile.coverImages,
          hours: profile.hours,
          annual_closures: profile.annualClosures,
          gallery_images: profile.galleryImages,
        })
        .eq('id', merchantId);

      if (error) throw error;

      toast.success("Profile saved", {
        description: "Store profile updated successfully.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Error", {
        description: "There was a problem saving the profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 min-h-screen p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-4"
      >
        <div>
          <h1 className="text-4xl font-extrabold">Business Profile</h1>
          <p className="text-lg text-[#f8494c] font-semibold mt-1">Store Settings</p>
          <p className="text-muted-foreground text-sm mt-1">Manage your store information and settings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-[#f8494c] hover:bg-[#f8494c]/90"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </motion.div>

      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-[#f8494c]" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Main details about your store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="flex flex-col items-center gap-4 w-full">
                    <Label className="text-base font-semibold">Logo del Negozio</Label>
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full border border-gray-200 shadow-md flex items-center justify-center bg-white overflow-hidden">
                        {profile.logoUrl ? (
                          <img
                            src={profile.logoUrl}
                            alt="Logo"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <ImagePlus className="h-10 w-10 text-muted-foreground" />
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
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-0 right-0 bg-white border border-gray-200 shadow hover:bg-gray-100"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Pencil className="h-5 w-5 text-[#f8494c]" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center w-full gap-2">
                    <Label className="text-base font-semibold mb-2">Immagini di Copertina</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-md">
                      {profile.coverImages && profile.coverImages.length > 0 ? (
                        profile.coverImages.map((image, index) => (
                          <div key={index} className="relative group w-[120px] h-[80px] md:w-[140px] md:h-[90px] rounded-lg overflow-hidden border shadow-sm bg-white flex items-center justify-center">
                            <img
                              src={image}
                              alt={`Cover ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="bg-white/80 hover:bg-white"
                                onClick={() => handleRemoveCoverImage(index)}
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                            <div className="absolute bottom-1 left-1 flex gap-1">
                              {index > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="bg-white/80 hover:bg-white p-1"
                                  onClick={() => moveCoverImage(index, index - 1)}
                                  disabled={isUploading}
                                  aria-label="Sposta a sinistra"
                                >
                                  <ArrowLeft className="h-4 w-4 text-[#f8494c]" />
                                </Button>
                              )}
                              {index < profile.coverImages.length - 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="bg-white/80 hover:bg-white p-1"
                                  onClick={() => moveCoverImage(index, index + 1)}
                                  disabled={isUploading}
                                  aria-label="Sposta a destra"
                                >
                                  <ArrowRight className="h-4 w-4 text-[#f8494c]" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 md:col-span-3 flex flex-col items-center justify-center h-[80px] md:h-[90px] rounded-lg border-2 border-dashed text-muted-foreground bg-white">
                          <ImagePlus className="h-8 w-8 mb-1" />
                          <span className="text-xs">Aggiungi immagine di copertina</span>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={coverInputRef}
                        onChange={handleCoverUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-dashed border-2 border-[#f8494c] bg-white hover:bg-[#f8494c]/10 flex items-center justify-center w-[120px] h-[80px] md:w-[140px] md:h-[90px]"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <ImagePlus className="h-6 w-6 text-[#f8494c]" />
                      </Button>
                    </div>
                    {profile.coverImages && profile.coverImages.length > 6 && (
                      <span className="text-xs text-muted-foreground mt-2">+{profile.coverImages.length - 6} altre</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-medium">Store Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your store name"
                        className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-medium">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="googleMapsUrl" className="font-medium">Google Maps Link</Label>
                      <Input
                        id="googleMapsUrl"
                        value={profile.googleMapsUrl}
                        onChange={(e) => handleInputChange('googleMapsUrl', e.target.value)}
                        placeholder="Enter Google Maps link"
                        className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="hours" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#f8494c]" />
                    Opening Hours
                  </CardTitle>
                  <CardDescription>Manage your store's opening hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {WEEKDAYS.map((day) => {
                      const hours = profile.hours[day];
                      return (
                        <motion.div
                          key={day}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-32">
                            <Label>{day}</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!hours.closed}
                              onCheckedChange={(checked) => handleHoursChange(day, 'closed', !checked)}
                              className="data-[state=checked]:bg-[#f8494c]"
                            />
                            <span className="text-sm text-muted-foreground">
                              {hours.closed ? 'Closed' : 'Open'}
                            </span>
                          </div>
                          {!hours.closed && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={hours.open}
                                onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                className="w-32 transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                              />
                              <span>to</span>
                              <Input
                                type="time"
                                value={hours.close}
                                onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                className="w-32 transition-all focus:ring-2 focus:ring-[#f8494c]/20"
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#f8494c]" />
                    Annual Closures
                  </CardTitle>
                  <CardDescription>Manage your store's closure periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={newClosure.date}
                          onChange={(e) => setNewClosure(prev => ({ ...prev, date: e.target.value }))}
                          className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={newClosure.name}
                          onChange={(e) => setNewClosure(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Summer Holidays"
                          className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newClosure.description}
                        onChange={(e) => setNewClosure(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter closure description"
                        className="transition-all focus:ring-2 focus:ring-[#f8494c]/20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newClosure.isRecurring}
                        onCheckedChange={(checked) => setNewClosure(prev => ({ ...prev, isRecurring: checked }))}
                        className="data-[state=checked]:bg-[#f8494c]"
                      />
                      <Label>Recurring annually</Label>
                    </div>
                    <Button onClick={handleAddClosure} className="w-full bg-[#f8494c] hover:bg-[#f8494c]/90">
                      Add Closure
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <AnimatePresence>
                      {profile.annualClosures.map((closure) => (
                        <motion.div
                          key={closure.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center justify-between p-4 bg-muted rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{closure.name}</h4>
                            <p className="text-sm text-muted-foreground">{closure.date}</p>
                            {closure.description && (
                              <p className="text-sm mt-1">{closure.description}</p>
                            )}
                            {closure.isRecurring && (
                              <span className="text-xs bg-[#f8494c]/10 text-[#f8494c] px-2 py-1 rounded-full mt-2 inline-block">
                                Recurring
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveClosure(closure.id)}
                            className="hover:bg-[#f8494c]/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
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