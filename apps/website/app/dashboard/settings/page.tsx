"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CreditCard, 
  Lock, 
  Bell, 
  Globe,
  Key,
  Mail,
  User,
  Building,
  Phone,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Loader2,
  CheckCircle
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  plan_type: string;
  billing_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  days_remaining: number | null;
  stripe_subscription_id: string | null;
}

interface Merchant {
  id: string;
  name: string;
  country: string;
  industry: string;
  address: string;
  logo_url: string | null;
  phone: string | null;
  hours: any;
  created_at: string;
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [showUpdatePaymentDialog, setShowUpdatePaymentDialog] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a success parameter in the URL
    const success = searchParams.get('success');
    if (success === 'true') {
      setShowSuccessMessage(true);
      // Remove the parameter from the URL without reloading the page
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Show a success toast
      toast.success("Payment completed!", {
        description: "Your subscription has been successfully updated.",
      });
      
      // Reload data after a short delay
    setTimeout(() => {
        fetchUserData();
        setShowSuccessMessage(false);
      }, 1000);
    } else {
      fetchUserData();
    }
  }, [searchParams]);

  // Fetch payment method when subscription is available
  useEffect(() => {
    if (hasStripeSubscription(subscription)) {
      fetchPaymentMethod();
    }
  }, [subscription]);

  // Helper function to check if subscription has Stripe ID
  const hasStripeSubscription = (sub: Subscription | null) => {
    return sub && sub.stripe_subscription_id && sub.stripe_subscription_id.trim() !== '';
  };

  async function fetchUserData() {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      setCurrentUserId(user.id);

      // Get user profile
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error retrieving profile:', profileError);
      }

      // Get current subscription using a direct query
      const { data: subscriptionData, error: subscriptionError } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subscriptionError) {
        // PGRST116 means no rows returned, which is normal if user has no subscription
        if (subscriptionError.code === 'PGRST116') {
          console.log('No active subscription found for user');
        } else {
          console.error('Error retrieving subscription:', subscriptionError);
        }
      }

      // Calculate remaining days if there's an end date
      let subscriptionWithDays = null;
      if (subscriptionData) {
        console.log('Subscription data found:', subscriptionData);
        const daysRemaining = subscriptionData.end_date 
          ? Math.ceil((new Date(subscriptionData.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null;
        
        subscriptionWithDays = {
          ...subscriptionData,
          days_remaining: daysRemaining
        };
      } else {
        console.log('No subscription data found');
      }

      // Get user's merchants
      const { data: merchantsData, error: merchantsError } = await (supabase as any)
        .from('merchants')
        .select('*')
        .eq('profile_id', user.id);

      if (merchantsError) {
        console.error('Error retrieving merchants:', merchantsError);
      }

      setUserProfile(profile);
      setSubscription(subscriptionWithDays);
      setMerchants(merchantsData || []);
      setIsLoading(false);

    } catch (error) {
      console.error('Error retrieving user data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
    }
  }

  const handleCreateTestSubscription = async () => {
    setIsCreatingTest(true);
    try {
      const response = await fetch('/api/test-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        // Reload data
        await fetchUserData();
        toast.success('Test subscription created successfully!');
      } else {
        toast.error('Error creating subscription: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error creating test subscription');
    } finally {
      setIsCreatingTest(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        // Reload data
        await fetchUserData();
        toast.success('Subscription cancelled successfully!', {
          description: result.message,
        });
        setShowCancelDialog(false);
      } else {
        toast.error('Error cancelling: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error cancelling subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const fetchPaymentMethod = async () => {
    if (!hasStripeSubscription(subscription)) return;
    
    setIsLoadingPayment(true);
    try {
      const response = await fetch('/api/get-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription!.stripe_subscription_id }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentMethod(result.paymentMethod);
      } else {
        console.error('Error fetching payment method:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    if (!hasStripeSubscription(subscription)) return;
    
    try {
      // Redirect to Stripe Customer Portal for payment method update
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: subscription!.stripe_subscription_id,
          returnUrl: window.location.href 
        }),
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = result.url;
      } else {
        toast.error('Error updating payment method: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error updating payment method');
    }
  };

  const handleSave = async () => {
    // Reset error
    setPasswordError(null);

    // Validazione
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Password updated successfully!');
        // Reset form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordError(result.error);
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError('An error occurred while updating password');
      toast.error('An error occurred while updating password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case 'base': return 'ReTap Base';
      case 'premium': return 'ReTap Premium';
      case 'top': return 'ReTap Top';
      default: return planType;
    }
  };

  const getPlanPrice = (planType: string, billingType: string) => {
    const prices = {
      base: { monthly: 49.99, annual: 499.99 },
      premium: { monthly: 99.99, annual: 999.99 },
      top: { monthly: 199.99, annual: 1999.99 }
    };
    
    const planPrices = prices[planType as keyof typeof prices] || prices.base;
    const price = billingType === 'monthly' ? planPrices.monthly : planPrices.annual;
    return `${price}€/${billingType === 'monthly' ? 'month' : 'year'}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800">Payment completed successfully!</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={userProfile?.first_name || ''}
                    onChange={(e) => setUserProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={userProfile?.last_name || ''}
                    onChange={(e) => setUserProfile(prev => prev ? {...prev, last_name: e.target.value} : null)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userProfile?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={userProfile?.phone_number || ''}
                  onChange={(e) => setUserProfile(prev => prev ? {...prev, phone_number: e.target.value} : null)}
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
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
                        <p className="font-semibold">
                          {subscription ? getPlanDisplayName(subscription.plan_type) : 'No active subscription'}
                        </p>
                        {subscription && (
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status === 'active' ? 'Active' : subscription.status}
                          </Badge>
                        )}
                    </div>
                      {subscription ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Billing cycle:</span>
                            <span className="font-medium">
                              {subscription.billing_type === 'monthly' ? 'Monthly' : 'Annual'}
                            </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price:</span>
                            <span className="font-medium">
                              {getPlanPrice(subscription.plan_type, subscription.billing_type)}
                            </span>
                      </div>
                      <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Start date:</span>
                            <span className="font-medium">
                              {new Date(subscription.start_date).toLocaleDateString('en-US')}
                            </span>
                          </div>
                          {subscription.end_date && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">End date:</span>
                              <span className="font-medium">
                                {new Date(subscription.end_date).toLocaleDateString('en-US')}
                              </span>
                            </div>
                          )}
                          {subscription.days_remaining !== null && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Days remaining:</span>
                              <span className="font-medium">
                                {subscription.days_remaining} days
                              </span>
                            </div>
                          )}
                      </div>
                      ) : (
                        <p className="text-muted-foreground">No active subscription found</p>
                      )}
                    </div>
                  </div>
                  
                  {/* User Profile Info */}
                <div>
                  <div className="p-4 border rounded-lg">
                    <div className="space-y-4">
                      <div>
                          <p className="text-sm font-medium mb-2">Account Information</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {userProfile?.first_name && userProfile?.last_name 
                                  ? `${userProfile.first_name} ${userProfile.last_name}`
                                  : 'Nome non specificato'
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{userProfile?.email || 'Email non specificata'}</span>
                            </div>
                            {userProfile?.phone_number && (
                        <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{userProfile.phone_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {merchants.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Your Stores</p>
                            <div className="space-y-2">
                              {merchants.map((merchant) => (
                                <div key={merchant.id} className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{merchant.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  {hasStripeSubscription(subscription) && (
                    <div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium">Payment Method</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUpdatePaymentMethod}
                            disabled={isLoadingPayment}
                            className="text-xs"
                          >
                            {isLoadingPayment ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CreditCard className="h-3 w-3 mr-1" />
                            )}
                            Update
                          </Button>
                        </div>
                        
                        {isLoadingPayment ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading payment method...</span>
                          </div>
                        ) : paymentMethod ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {paymentMethod.card?.brand?.toUpperCase()} •••• {paymentMethod.card?.last4}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Expires {paymentMethod.card?.exp_month}/{paymentMethod.card?.exp_year}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">No payment method found</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
              <div className="flex gap-4 mt-6">
                <Button 
                  onClick={() => router.push('/checkout')}
                  className="bg-[#f8494c] hover:bg-[#f8494c]/90"
                >
                    {subscription ? 'Change Plan' : 'Activate Subscription'}
                </Button>
                  {subscription && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCancelDialog(true)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                  Cancel Subscription
                </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            {subscription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#f8494c]" /> Usage Statistics
                  </CardTitle>
                  <CardDescription>
                    Monitor your subscription usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Active Stores</span>
                      </div>
                      <p className="text-2xl font-bold">{merchants.length}</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Member since</span>
                      </div>
                      <p className="text-sm font-medium">
                        {userProfile?.created_at 
                          ? new Date(userProfile.created_at).toLocaleDateString('en-US')
                          : 'N/A'
                        }
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Current Plan</span>
                      </div>
                      <p className="text-sm font-medium">
                        {getPlanDisplayName(subscription.plan_type)}
                      </p>
                    </div>
              </div>
            </CardContent>
          </Card>
            )}
          </TabsContent>

        <TabsContent value="security" className="space-y-6">
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
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  disabled={isUpdatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  disabled={isUpdatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={isUpdatingPassword}
                />
              </div>
              <Button onClick={handleSave} disabled={isUpdatingPassword}>
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
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

      {/* Dialog di conferma per la cancellazione */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-600" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">What happens when you cancel:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your subscription will remain active until the end of the billing period</li>
                <li>• <strong>YOU WILL NOT BE CHARGED</strong> for future periods</li>
                <li>• You can always reactivate the subscription in the future</li>
                <li>• Your data and stores will remain intact</li>
              </ul>
            </div>
            
            {subscription && (
              <div className="p-4 bg-gray-50 border rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Current plan:</strong> {getPlanDisplayName(subscription.plan_type)} ({subscription.billing_type === 'monthly' ? 'Monthly' : 'Annual'})
                </p>
                {subscription.days_remaining !== null && (
                  <p className="text-sm text-gray-600">
                    <strong>Days remaining:</strong> {subscription.days_remaining} days
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
} 