"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RewardsList } from "./rewards/rewards-list"
import { CreateRewardDialog } from "./rewards/create-reward-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Gift, Flag } from "lucide-react"
import { CheckpointsList } from "./checkpoints/checkpoints-list"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateOfferDialog } from "./checkpoints/create-offer-dialog"

export default function PromotionsPage() {
  const [totalSteps, setTotalSteps] = useState(8) // Default to 8 steps
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const refreshData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("profile_id", user.id)
        .single()

      if (!merchant) return

      const { data: steps, error } = await supabase
        .from("checkpoint_steps")
        .select("total_steps")
        .eq("merchant_id", merchant.id)
        .limit(1)

      if (error) throw error

      if (steps && steps.length > 0) {
        setTotalSteps(steps[0].total_steps)
      }
    } catch (error) {
      console.error("Error loading total steps:", error)
      toast.error("Error loading data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f8494c] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promotions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-extrabold">Promotions</h1>
          <p className="text-lg text-[#f8494c] font-semibold mt-1">Loyalty Program</p>
          <p className="text-muted-foreground text-sm mt-1">Manage rewards and checkpoints for your loyalty program</p>
        </div>
      </div>

      <div className="space-y-8">
        <Card className="hover:shadow-md transition-shadow border-t-4 border-t-[#f8494c]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Gift className="h-6 w-6 text-[#f8494c]" /> Rewards
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Reward loyal customers with gifts and discounts when they reach specific point thresholds
              </p>
            </div>
            <CreateRewardDialog totalSteps={totalSteps} defaultStep={1}>
              <Button className="bg-[#f8494c] hover:bg-[#f8494c]/90">
                <Plus className="mr-2 h-4 w-4" />
                New Reward
              </Button>
            </CreateRewardDialog>
          </CardHeader>
          <CardContent>
            <RewardsList />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-t-4 border-t-[#4c8ff8]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flag className="h-6 w-6 text-[#4c8ff8]" /> Checkpoints
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Create milestone-based journeys with intermediate rewards to boost customer loyalty
              </p>
            </div>
            <CreateOfferDialog onSuccess={refreshData}>
              <Button className="bg-[#4c8ff8] hover:bg-[#4c8ff8]/90">
                <Plus className="mr-2 h-4 w-4" />
                New Offer
              </Button>
            </CreateOfferDialog>
          </CardHeader>
          <CardContent>
            <CheckpointsList />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 