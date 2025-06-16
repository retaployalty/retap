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

export default function PromotionsPage() {
  const [totalSteps, setTotalSteps] = useState(8) // Default to 8 steps
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadTotalSteps() {
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

    loadTotalSteps()
  }, [supabase])

  if (loading) {
    return <div>Loading...</div>
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
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Gift className="h-6 w-6 text-[#f8494c]" /> Rewards
            </CardTitle>
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

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Flag className="h-6 w-6 text-[#f8494c]" /> Checkpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CheckpointsList />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 