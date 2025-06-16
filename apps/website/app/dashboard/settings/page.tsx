"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Lock, 
  Bell, 
  Globe,
  Shield,
  Key,
  Mail,
  User,
  Building,
  Phone,
  MapPin
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-lg text-[#f8494c] font-semibold">Manage your account</p>
          <p className="text-muted-foreground">Update your preferences and security settings</p>
        </div>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Subscription
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#f8494c]" /> Subscription Plan
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold">ReTap Business</p>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Active
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Billing Cycle:</span>
                        <span className="font-medium">Annual</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">€499.99/year</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Next Billing:</span>
                        <span className="font-medium">March 1, 2025</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="p-4 border rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Payment Method</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                            <p className="text-xs text-muted-foreground">Expires 12/25</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Billing Address</p>
                        <p className="text-sm text-muted-foreground">
                          Via Roma 123<br />
                          20100 Milano<br />
                          Italy
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <Button 
                  onClick={() => router.push('/checkout')}
                  className="bg-[#f8494c] hover:bg-[#f8494c]/90"
                >
                  Change Plan
                </Button>
                <Button variant="outline">
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#f8494c]" /> Password
                </CardTitle>
                <CardDescription>
                  Update your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#f8494c]" /> Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Protect your account with two-factor authentication
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#f8494c]" /> Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about your account activity
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and promotions
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about security-related events
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 