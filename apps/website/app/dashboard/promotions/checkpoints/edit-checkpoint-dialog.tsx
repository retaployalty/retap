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

    if (!confirm("Sei sicuro di voler eliminare questo premio? Questa azione non può essere annullata.")) {
      return
    }

    setLoading(true)

    try {
      // Delete reward
      const { error: deleteRewardError } = await supabase
        .from("checkpoint_rewards")
        .delete()
        .eq("id", step.reward.id)

      if (deleteRewardError) {
        console.error("Delete reward error:", deleteRewardError)
        throw new Error("Errore durante l'eliminazione del premio")
      }

      // Update step to remove reward reference
      const { error } = await supabase
        .from("checkpoint_steps")
        .update({ reward_id: null })
        .eq("id", step.id)

      if (error) throw error

      toast.success("Premio eliminato con successo")
      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Errore durante l'eliminazione del premio")
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