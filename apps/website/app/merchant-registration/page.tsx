'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const industries = [
  'Ristorante',
  'Bar',
  'Caffè',
  'Pizzeria',
  'Gelateria',
  'Panificio',
  'Farmacia',
  'Parrucchiere',
  'Estetista',
  'Palestra',
  'Negozio di abbigliamento',
  'Negozio di calzature',
  'Gioielleria',
  'Ottica',
  'Fioraio',
  'Libreria',
  'Cartoleria',
  'Altro'
];

const countries = [
  'Italia',
  'Svizzera',
  'Austria',
  'Germania',
  'Francia',
  'Spagna',
  'Portogallo',
  'Belgio',
  'Paesi Bassi',
  'Lussemburgo',
  'Altro'
];

export default function MerchantRegistrationPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    // Dati personali
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    
    // Dati del negozio
    businessName: '',
    industry: '',
    country: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    googleMapsUrl: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phoneNumber', 'password',
      'businessName', 'industry', 'country', 'address', 'city', 'zipCode'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        setError(`Il campo ${field === 'firstName' ? 'Nome' : 
                  field === 'lastName' ? 'Cognome' :
                  field === 'businessName' ? 'Nome attività' :
                  field === 'phoneNumber' ? 'Telefono personale' :
                  field === 'password' ? 'Password' :
                  field === 'zipCode' ? 'CAP' :
                  field} è obbligatorio`);
        return false;
      }
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Inserisci un indirizzo email valido');
      return false;
    }

    // Validazione password
    if (formData.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Registrare l'utente
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber
          }
        }
      });

      if (authError) {
        throw new Error(`Errore nella registrazione: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Errore durante la registrazione dell\'utente');
      }

      // 2. Creare il profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phoneNumber
        });

      if (profileError) {
        throw new Error(`Errore nella creazione del profilo: ${profileError.message}`);
      }

      // 3. Creare il merchant
      const { error: merchantError } = await supabase
        .from('merchants')
        .insert({
          name: formData.businessName,
          profile_id: authData.user.id,
          country: formData.country,
          industry: formData.industry,
          address: `${formData.address}, ${formData.city} ${formData.zipCode}`,
          phone: formData.phone || formData.phoneNumber,
          google_maps_url: formData.googleMapsUrl || null
        });

      if (merchantError) {
        throw new Error(`Errore nella creazione del merchant: ${merchantError.message}`);
      }

      setSuccess(true);
      
      // Reindirizza dopo 3 secondi
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (err) {
      console.error('Errore durante la registrazione:', err);
      setError(err instanceof Error ? err.message : 'Errore durante la registrazione');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Registrazione Completata!
              </h2>
              <p className="text-gray-600 mb-4">
                Il tuo negozio è stato registrato con successo. 
                Verrai reindirizzato alla dashboard tra pochi secondi.
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Reindirizzamento...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Registrazione Negozio
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Unisciti a ReTap e inizia a gestire i tuoi clienti con le carte NFC
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sezione Dati Personali */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Dati Personali
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Il tuo nome"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Cognome *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Il tuo cognome"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="la-tua-email@esempio.com"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Telefono Personale *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="+39 123 456 7890"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Sezione Dati Attività */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Dati dell'Attività
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Nome Attività *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Il nome del tuo negozio"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Settore *</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => handleInputChange('industry', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona il settore" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Paese *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => handleInputChange('country', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona il paese" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Indirizzo *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Via/Piazza e numero civico"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Città *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Nome della città"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CAP *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="Codice postale"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono Attività (opzionale)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+39 123 456 7890"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleMapsUrl">Link Google Maps (opzionale)</Label>
                  <Input
                    id="googleMapsUrl"
                    type="url"
                    value={formData.googleMapsUrl}
                    onChange={(e) => handleInputChange('googleMapsUrl', e.target.value)}
                    placeholder="https://maps.google.com/..."
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrazione in corso...
                    </>
                  ) : (
                    'Registra il Negozio'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 