"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "adminAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/admin-panel/login");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configura le impostazioni dell'admin panel
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Notifiche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Ricevi notifiche via email per nuove transazioni
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-gray-500">
                  Ricevi notifiche push per nuove transazioni
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value="danieloneinnazionale@retapcard.com"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Cambia Password</Label>
              <Input type="password" placeholder="Nuova password" />
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferenze</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-gray-500">
                  Attiva la modalità scura
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-refresh</Label>
                <p className="text-sm text-gray-500">
                  Aggiorna automaticamente i dati ogni 5 minuti
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 