"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditCheckpointDialog } from "./edit-checkpoint-dialog"
import { Plus, Target, Award, Gift, Star, Trophy, Medal, Crown } from "lucide-react"
import { CreateCheckpointDialog } from "./create-checkpoint-dialog"

interface CheckpointOffer {
  id: string
  name: string
  description: string
  total_steps: number
}

interface CheckpointStep {
  id: string
  step_number: number
  total_steps: number
  reward_id: string | null
  reward: {
    id: string
    name: string
    description: string
    icon: string
  } | null
  offer_id: string
}

// Step icons based on step number
const getStepIcon = (stepNumber: number) => {
  const icons = [Target, Award, Gift, Star, Trophy, Medal, Crown]
  return icons[(stepNumber - 1) % icons.length]
}

export default function CheckpointsPage() {
  const [offers, setOffers] = useState<CheckpointOffer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<CheckpointOffer | null>(null)
  const [steps, setSteps] = useState<CheckpointStep[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  async function loadOffers() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("profile_id", user.id)
        .single()

      if (!merchant) return

      const { data: offers, error } = await supabase
        .from("checkpoint_offers")
        .select("*")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setOffers(offers || [])
      if (offers && offers.length > 0) {
        setSelectedOffer(offers[0])
        loadSteps(offers[0].id)
      }
    } catch (error) {
      console.error("Error loading offers:", error)
      toast.error("Error loading offers")
    } finally {
      setLoading(false)
    }
  }

  async function loadSteps(offerId: string) {
    try {
      const { data: steps, error } = await supabase
        .from("checkpoint_steps")
        .select(`
          *,
          reward:checkpoint_rewards(*)
        `)
        .eq("offer_id", offerId)
        .order("step_number", { ascending: true })

      if (error) throw error

      if (steps && steps.length > 0) {
        setSteps(steps)
      } else {
        const emptySteps = Array.from({ length: selectedOffer?.total_steps || 0 }, (_, i) => ({
          id: `empty-${i + 1}`,
          step_number: i + 1,
          total_steps: selectedOffer?.total_steps || 0,
          reward_id: null,
          reward: null,
          offer_id: offerId
        }))
        setSteps(emptySteps)
      }
    } catch (error) {
      console.error("Error loading steps:", error)
      toast.error("Error loading checkpoints")
    }
  }

  useEffect(() => {
    loadOffers()
  }, [supabase])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Checkpoints</h3>
          <p className="text-sm text-muted-foreground">
            Manage your loyalty program checkpoints. Each purchase advances the customer by one step.
          </p>
        </div>
      </div>

      {offers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Select Offer:</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedOffer?.id}
              onChange={(e) => {
                const offer = offers.find(o => o.id === e.target.value)
                if (offer) {
                  setSelectedOffer(offer)
                  loadSteps(offer.id)
                }
              }}
            >
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.name} ({offer.total_steps} steps)
                </option>
              ))}
            </select>
          </div>

          {selectedOffer && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step) => {
                const StepIcon = getStepIcon(step.step_number)
                return (
                  <Card key={step.id} className="relative hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-center flex items-center justify-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#f8494c]/10 flex items-center justify-center">
                          <StepIcon className="h-4 w-4 text-[#f8494c]" />
                        </div>
                        <span>Step {step.step_number}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {step.reward ? (
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="font-medium">{step.reward.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {step.reward.description}
                            </div>
                          </div>
                          <EditCheckpointDialog step={step}>
                            <Button variant="outline" className="w-full hover:bg-[#f8494c] hover:text-white transition-colors">
                              Edit Reward
                            </Button>
                          </EditCheckpointDialog>
                        </div>
                      ) : (
                        <CreateCheckpointDialog 
                          totalSteps={selectedOffer.total_steps} 
                          defaultStep={step.step_number}
                          offerId={selectedOffer.id}
                        >
                          <Button variant="outline" className="w-full hover:bg-[#f8494c] hover:text-white transition-colors">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Reward
                          </Button>
                        </CreateCheckpointDialog>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 