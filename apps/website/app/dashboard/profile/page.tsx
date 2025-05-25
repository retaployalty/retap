"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapPin, Clock, Image as ImageIcon, Phone, Store, Calendar, X, Eye } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BusinessProfile, BusinessHours, AnnualClosure } from "./types";

export default function BusinessProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newClosure, setNewClosure] = useState<Omit<AnnualClosure, 'id'>>({
    date: "",
    name: "",
    description: "",
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
    if (!newClosure.date || !newClosure.name) {
      toast.error("Error", {
        description: "Please fill in all required fields",
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
    });

    toast.success("Closure added", {
      description: "New annual closure has been added",
    });
  };

  const handleRemoveClosure = (id: string) => {
    setProfile(prev => ({
      ...prev,
      annualClosures: prev.annualClosures.filter(closure => closure.id !== id)
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Recupera l'id del merchant associato all'utente
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (merchantError || !merchant) throw new Error("Merchant non trovato");

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

      toast.success("Profilo salvato", {
        description: "Il profilo del negozio è stato aggiornato con successo.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Errore", {
        description: "C'è stato un problema nel salvataggio del profilo. Riprova.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Business Profile</h1>
        <p className="text-sm text-muted-foreground">
          Set up your business profile that customers will see
        </p>
      </div>

      {/* Immagini del Negozio - ORA PRIMA CARD */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Immagini del Negozio</CardTitle>
              <CardDescription className="text-xs">Carica il logo e l'immagine di copertina del tuo negozio</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Label className="text-sm">Logo del Negozio</Label>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer group">
                {profile.logoUrl ? (
                  <img 
                    src={profile.logoUrl} 
                    alt="Logo" 
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground group-hover:text-primary mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground group-hover:text-primary">Carica logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">
                  Il logo del tuo negozio. Verrà mostrato ai clienti.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  id="logo-upload"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const filePath = `logos/${file.name}-${Date.now()}`;
                    const { data, error } = await supabase.storage
                      .from("business-media")
                      .upload(filePath, file, { upsert: true });
                    console.log("LOGO UPLOAD", { data, error });
                    if (error) {
                      toast.error("Errore upload logo: " + (error.message || JSON.stringify(error)));
                      return;
                    }
                    if (!data) {
                      toast.error("Upload fallito: nessun dato restituito");
                      return;
                    }
                    const { data: publicUrlData } = supabase.storage
                      .from("business-media")
                      .getPublicUrl(filePath);
                    console.log("LOGO PUBLIC URL", publicUrlData);
                    if (!publicUrlData?.publicUrl) {
                      toast.error("Errore nel recupero URL pubblico");
                      return;
                    }
                    setProfile((prev) => ({ ...prev, logoUrl: publicUrlData.publicUrl }));
                    toast.success("Logo caricato!");
                  }}
                />
                <Button
                  variant="outline"
                  className="h-8"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                >
                  Scegli File
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3">
            <Label className="text-sm">Immagini di Copertina</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.coverImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`Copertina ${idx + 1}`}
                    className="aspect-[21/9] w-full object-cover rounded-lg border"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1 right-1 z-10"
                    onClick={() =>
                      setProfile((prev) => ({
                        ...prev,
                        coverImages: prev.coverImages.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {/* Placeholder per aggiungere nuove immagini */}
              <label className="aspect-[21/9] flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files) return;
                    let urls: string[] = [];
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      const filePath = `covers/${file.name}-${Date.now()}`;
                      const { data, error } = await supabase.storage
                        .from("business-media")
                        .upload(filePath, file, { upsert: true });
                      console.log("Upload result:", { data, error });
                      if (error) {
                        toast.error("Errore upload copertina: " + (error.message || JSON.stringify(error)));
                        continue;
                      }
                      if (!data) {
                        toast.error("Upload fallito: nessun dato restituito");
                        continue;
                      }
                      const { data: publicUrlData } = supabase.storage
                        .from("business-media")
                        .getPublicUrl(filePath);
                      if (!publicUrlData?.publicUrl) {
                        toast.error("Errore nel recupero URL pubblico");
                        continue;
                      }
                      urls.push(publicUrlData.publicUrl);
                    }
                    setProfile((prev) => ({
                      ...prev,
                      coverImages: [...prev.coverImages, ...urls],
                    }));
                    toast.success("Immagini di copertina caricate!");
                  }}
                />
                <span className="text-xs text-muted-foreground">Aggiungi immagini</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Puoi caricare più immagini panoramiche del tuo negozio. Verranno mostrate in alto nel profilo.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Basic Information</CardTitle>
                <CardDescription className="text-xs">Your business details and contact information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm">Business Name</Label>
                <Input 
                  id="businessName" 
                  placeholder="Enter your business name"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="Enter your business phone number"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="h-9" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleMaps" className="text-sm">Google Maps Location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input 
                  id="googleMaps" 
                  placeholder="Paste your Google Maps location link"
                  value={profile.googleMapsUrl}
                  onChange={(e) => handleInputChange('googleMapsUrl', e.target.value)}
                  className="h-9" 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be used to show your business location and calculate distance for customers
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Business Hours</CardTitle>
                <CardDescription className="text-xs">Set your opening and closing times</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(profile.hours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-20">
                    <Label className="text-sm font-medium">{day}</Label>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Input 
                      type="time" 
                      className="w-28 h-8"
                      value={hours.open}
                      onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input 
                      type="time" 
                      className="w-28 h-8"
                      value={hours.close}
                      onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id={`${day}-closed`}
                      checked={hours.closed}
                      onCheckedChange={(checked) => handleHoursChange(day, 'closed', checked)}
                      className="h-4 w-7"
                    />
                    <Label htmlFor={`${day}-closed`} className="text-xs text-muted-foreground">Closed</Label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Annual Closures */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Annual Closures</CardTitle>
                <CardDescription className="text-xs">Add dates when your business will be closed</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Date</Label>
                  <Input
                    type="date"
                    value={newClosure.date}
                    onChange={(e) => setNewClosure(prev => ({ ...prev, date: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Name</Label>
                  <Input
                    placeholder="e.g., Christmas Day"
                    value={newClosure.name}
                    onChange={(e) => setNewClosure(prev => ({ ...prev, name: e.target.value }))}
                    className="h-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Description (Optional)</Label>
                <Textarea
                  placeholder="Add any additional details about this closure"
                  value={newClosure.description}
                  onChange={(e) => setNewClosure(prev => ({ ...prev, description: e.target.value }))}
                  className="h-16 text-sm"
                />
              </div>
              <Button 
                onClick={handleAddClosure}
                className="h-8"
              >
                Add Closure
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm">Added Closures</Label>
              {profile.annualClosures.length === 0 ? (
                <p className="text-xs text-muted-foreground">No closures added yet</p>
              ) : (
                <div className="space-y-2">
                  {profile.annualClosures.map((closure) => (
                    <div 
                      key={closure.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-card"
                    >
                      <div>
                        <p className="text-sm font-medium">{closure.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(closure.date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {closure.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{closure.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClosure(closure.id)}
                        className="h-7 w-7"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          className="h-9 px-6"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button 
          className="h-9 px-6"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
} 