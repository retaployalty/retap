"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"

interface CheckpointStep {
  id: string
  step_number: number
  total_steps: number
  reward_id: string | null
  reward: {
    id: string
    name: string
    description: string
    image_path: string
  } | null
}

interface EditCheckpointDialogProps {
  children: React.ReactNode
  step: CheckpointStep
}

export function EditCheckpointDialog({ children, step }: EditCheckpointDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const formRef = useRef<HTMLFormElement>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      // 1. Get current user and merchant data first
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error("Auth error:", userError)
        throw new Error("Errore di autenticazione")
      }

      if (!user) {
        throw new Error("Utente non autenticato")
      }

      const { data: merchant, error: merchantError } = await supabase
        .from("merchants")
        .select("id")
        .eq("profile_id", user.id)
        .single()

      if (merchantError) {
        console.error("Merchant error:", merchantError)
        throw new Error("Errore durante il recupero dei dati del merchant")
      }

      if (!merchant) {
        throw new Error("Nessun merchant associato al tuo account")
      }

      // 2. Get form data
      if (!formRef.current) {
        throw new Error("Form non trovato")
      }

      const formData = new FormData(formRef.current)
      const hasReward = formData.get("has_reward") === "true"
      const name = formData.get("name") as string
      const description = formData.get("description") as string
      const imageFile = formData.get("image") as File

      // Validate inputs
      if (hasReward && (!name || !description)) {
        throw new Error("Tutti i campi sono obbligatori per il premio")
      }

      if (hasReward && imageFile && !imageFile.type.startsWith("image/")) {
        throw new Error("Il file deve essere un'immagine")
      }

      let rewardId = step.reward_id

      // 3. Handle reward
      if (hasReward) {
        if (step.reward) {
          // Update existing reward
          const updateData: any = {
            name,
            description,
          }

          if (imageFile) {
            // Delete old image
            if (step.reward.image_path) {
              const { error: deleteError } = await supabase.storage
                .from("rewards")
                .remove([step.reward.image_path])

              if (deleteError) {
                console.error("Delete image error:", deleteError)
              }
            }

            // Upload new image
            const imagePath = `${Date.now()}-${imageFile.name}`
            const { error: uploadError } = await supabase.storage
              .from("rewards")
              .upload(imagePath, imageFile)

            if (uploadError) {
              console.error("Storage error:", uploadError)
              throw new Error("Errore durante il caricamento dell'immagine")
            }

            updateData.image_path = imagePath
          }

          const { error: updateRewardError } = await supabase
            .from("checkpoint_rewards")
            .update(updateData)
            .eq("id", step.reward.id)

          if (updateRewardError) {
            console.error("Update reward error:", updateRewardError)
            throw new Error("Errore durante l'aggiornamento del premio")
          }
        } else {
          // Create new reward
          if (!imageFile) {
            throw new Error("L'immagine è obbligatoria per creare un nuovo premio")
          }

          const imagePath = `${Date.now()}-${imageFile.name}`
          const { error: uploadError } = await supabase.storage
            .from("rewards")
            .upload(imagePath, imageFile)

          if (uploadError) {
            console.error("Storage error:", uploadError)
            throw new Error("Errore durante il caricamento dell'immagine")
          }

          const { data: reward, error: insertRewardError } = await supabase
            .from("checkpoint_rewards")
            .insert({
              name,
              description,
              image_path: imagePath,
              merchant_id: merchant.id,
            })
            .select()
            .single()

          if (insertRewardError) {
            console.error("Insert reward error:", insertRewardError)
            throw new Error("Errore durante il salvataggio del premio")
          }

          rewardId = reward.id
        }
      } else if (step.reward) {
        // Delete existing reward
        if (step.reward.image_path) {
          const { error: deleteError } = await supabase.storage
            .from("rewards")
            .remove([step.reward.image_path])

          if (deleteError) {
            console.error("Delete image error:", deleteError)
          }
        }

        const { error: deleteRewardError } = await supabase
          .from("checkpoint_rewards")
          .delete()
          .eq("id", step.reward.id)

        if (deleteRewardError) {
          console.error("Delete reward error:", deleteRewardError)
          throw new Error("Errore durante l'eliminazione del premio")
        }

        rewardId = null
      }

      // 4. Update checkpoint step
      const { error: updateStepError } = await supabase
        .from("checkpoint_steps")
        .update({
          reward_id: rewardId,
        })
        .eq("id", step.id)

      if (updateStepError) {
        console.error("Update step error:", updateStepError)
        throw new Error("Errore durante l'aggiornamento del checkpoint")
      }

      toast.success("Checkpoint aggiornato con successo")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error details:", error)
      toast.error(error instanceof Error ? error.message : "Errore durante l'aggiornamento del checkpoint")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef} onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Modifica Checkpoint</DialogTitle>
            <DialogDescription>
              Modifica il checkpoint e il suo premio. Compila tutti i campi richiesti.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Step {step.step_number} di {step.total_steps}</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="has_reward">Premio</Label>
              <Select name="has_reward" defaultValue={step.reward ? "true" : "false"}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona se vuoi assegnare un premio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sì, assegna un premio</SelectItem>
                  <SelectItem value="false">No, nessun premio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Premio</Label>
              <Input
                id="name"
                name="name"
                placeholder="Es. Gelato Gratis"
                defaultValue={step.reward?.name}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione Premio</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Es. Un gelato gratuito a scelta"
                defaultValue={step.reward?.description}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Immagine Premio</Label>
              {step.reward?.image_path && (
                <div className="relative h-24 w-24 mb-2">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rewards/${step.reward.image_path}`}
                    alt={step.reward.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              )}
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Aggiornamento..." : "Aggiorna Checkpoint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 