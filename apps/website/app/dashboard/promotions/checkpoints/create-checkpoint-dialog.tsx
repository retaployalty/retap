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

interface CreateCheckpointDialogProps {
  children: React.ReactNode
  totalSteps: number
  defaultStep: number
  offerId: string
}

export function CreateCheckpointDialog({ 
  children, 
  totalSteps, 
  defaultStep,
  offerId 
}: CreateCheckpointDialogProps) {
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
      const name = formData.get("name") as string
      const description = formData.get("description") as string

      // Validate inputs
      if (!name || !description) {
        throw new Error("Tutti i campi sono obbligatori")
      }

      // Create reward in database
      console.log("Creating reward with data:", {
        name,
        description,
        icon: "gift",
        merchant_id: merchant.id
      });

      const { data: reward, error: rewardError } = await supabase
        .from("checkpoint_rewards")
        .insert({
          name,
          description,
          icon: "gift",
          merchant_id: merchant.id
        })
        .select()
        .single()

      if (rewardError) {
        console.error("Reward error details:", {
          code: rewardError.code,
          message: rewardError.message,
          details: rewardError.details,
          hint: rewardError.hint
        })
        throw new Error("Errore durante il salvataggio del premio")
      }

      console.log("Reward created successfully:", reward)

      // Create step with reward
      console.log("Creating step with data:", {
        step_number: defaultStep,
        total_steps: totalSteps,
        reward_id: reward.id,
        merchant_id: merchant.id,
        offer_id: offerId
      });

      const { error: stepError } = await supabase
        .from("checkpoint_steps")
        .insert({
          step_number: defaultStep,
          total_steps: totalSteps,
          reward_id: reward.id,
          merchant_id: merchant.id,
          offer_id: offerId
        })

      if (stepError) {
        console.error("Step error details:", {
          code: stepError.code,
          message: stepError.message,
          details: stepError.details,
          hint: stepError.hint
        })
        throw new Error("Errore durante il salvataggio dello step")
      }

      console.log("Step created successfully")

      toast.success("Premio aggiunto con successo")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error details:", error)
      toast.error(error instanceof Error ? error.message : "Errore durante la creazione del premio")
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
            <DialogTitle>Aggiungi Premio per Step {defaultStep}</DialogTitle>
            <DialogDescription>
              Aggiungi un premio per lo step {defaultStep} di {totalSteps}. Compila tutti i campi richiesti.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Premio</Label>
              <Input
                id="name"
                name="name"
                placeholder="Es. Gelato Gratis"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Es. Un gelato gratuito di qualsiasi gusto"
                required
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
              {loading ? "Creazione..." : "Crea Premio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 