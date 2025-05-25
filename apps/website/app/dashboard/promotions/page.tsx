"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RewardsList } from "./rewards/rewards-list"
import { CreateRewardDialog } from "./rewards/create-reward-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CheckpointsList } from "./checkpoints/checkpoints-list"
import { CreateCheckpointDialog } from "./checkpoints/create-checkpoint-dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function PromotionsPage() {
  const [totalSteps, setTotalSteps] = useState(8) // Default a 8 steps
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
        toast.error("Errore durante il caricamento dei dati")
      } finally {
        setLoading(false)
      }
    }

    loadTotalSteps()
  }, [supabase])

  if (loading) {
    return <div>Caricamento...</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Promozioni</h3>
        <p className="text-sm text-muted-foreground">
          Gestisci i rewards e i checkpoint del tuo programma fedeltà.
        </p>
      </div>
      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
        </TabsList>
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Gestisci i rewards che i clienti possono riscattare con i loro punti.
              </p>
            </div>
            <CreateRewardDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuovo Reward
              </Button>
            </CreateRewardDialog>
      </div>
          <RewardsList />
        </TabsContent>
        <TabsContent value="checkpoints" className="space-y-4">
          <CheckpointsList />
        </TabsContent>
      </Tabs>
    </div>
  )
} 