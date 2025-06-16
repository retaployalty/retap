"use client"

import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { CreateCheckpointDialog } from "./create-checkpoint-dialog"

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

interface EditCheckpointDialogProps {
  children: React.ReactNode
  step: CheckpointStep
  onSuccess?: () => void
}

export function EditCheckpointDialog({ children, step, onSuccess }: EditCheckpointDialogProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  async function handleDelete() {
    if (!step.reward) return

    if (!confirm("Are you sure you want to delete this reward? This action cannot be undone.")) {
      return
    }

    setLoading(true)

    try {
      // Delete step first
      const { error: deleteStepError } = await supabase
        .from("checkpoint_steps")
        .delete()
        .eq("id", step.id)

      if (deleteStepError) {
        console.error("Delete step error:", deleteStepError)
        throw new Error("Error deleting step")
      }

      // Then delete reward
      const { error: deleteRewardError } = await supabase
        .from("checkpoint_rewards")
        .delete()
        .eq("id", step.reward.id)

      if (deleteRewardError) {
        console.error("Delete reward error:", deleteRewardError)
        throw new Error("Error deleting reward")
      }

      toast.success("Reward deleted successfully")
      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Error deleting reward")
    } finally {
      setLoading(false)
    }
  }

  return (
    <CreateCheckpointDialog
      totalSteps={step.total_steps}
      defaultStep={step.step_number}
      offerId={step.offer_id}
      existingReward={step.reward ? {
        id: step.reward.id,
        name: step.reward.name,
        description: step.reward.description,
        icon: step.reward.icon
      } : undefined}
      onDelete={handleDelete}
    >
      {children}
    </CreateCheckpointDialog>
  )
} 