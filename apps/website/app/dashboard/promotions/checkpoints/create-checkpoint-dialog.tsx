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
  Gift, 
  Coffee, 
  Pizza, 
  IceCream, 
  ShoppingBag, 
  Percent, 
  Ticket, 
  Star,
  Trash2
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ICONS = [
  { value: "gift", label: "Regalo", icon: Gift },
  { value: "coffee", label: "Caffè", icon: Coffee },
  { value: "pizza", label: "Pizza", icon: Pizza },
  { value: "ice-cream", label: "Gelato", icon: IceCream },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "percent", label: "Sconto", icon: Percent },
  { value: "ticket", label: "Biglietto", icon: Ticket },
  { value: "star", label: "Stella", icon: Star },
]

interface CreateCheckpointDialogProps {
  children: React.ReactNode
  totalSteps: number
  defaultStep: number
  offerId: string
  onSuccess?: () => void
  existingReward?: {
    id: string
    name: string
    description: string
    icon: string
  }
  onDelete?: () => void
}

export function CreateCheckpointDialog({ 
  children, 
  totalSteps, 
  defaultStep,
  offerId,
  onSuccess,
  existingReward,
  onDelete
}: CreateCheckpointDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(existingReward?.icon || "gift")
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

      if (existingReward) {
        // Update existing reward
        const { error: updateError } = await supabase
          .from("checkpoint_rewards")
          .update({
            name,
            description,
            icon: selectedIcon
          })
          .eq("id", existingReward.id)

        if (updateError) {
          console.error("Update error:", updateError)
          throw new Error("Errore durante l'aggiornamento del premio")
        }

        toast.success("Premio aggiornato con successo")
      } else {
        // Create new reward
        const { data: reward, error: rewardError } = await supabase
          .from("checkpoint_rewards")
          .insert({
            name,
            description,
            icon: selectedIcon,
            merchant_id: merchant.id
          })
          .select()
          .single()

        if (rewardError) {
          console.error("Reward error:", rewardError)
          throw new Error("Errore durante il salvataggio del premio")
        }

        // Create step with reward
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
          console.error("Step error:", stepError)
          throw new Error("Errore durante il salvataggio dello step")
        }

        toast.success("Premio creato con successo")
      }

      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error details:", error)
      toast.error(error instanceof Error ? error.message : "Errore durante l'operazione")
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
            <DialogTitle>
              {existingReward ? "Modifica Premio" : `Aggiungi Premio per Step ${defaultStep}`}
            </DialogTitle>
            <DialogDescription>
              {existingReward 
                ? "Modifica i dettagli del premio esistente."
                : `Aggiungi un premio per lo step ${defaultStep} di ${totalSteps}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Premio</Label>
              <Input
                id="name"
                name="name"
                placeholder="Es. Gelato Gratis"
                defaultValue={existingReward?.name}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Es. Un gelato gratuito di qualsiasi gusto"
                defaultValue={existingReward?.description}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Icona</Label>
              <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un'icona" />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((icon) => {
                    const IconComponent = icon.icon
                    return (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{icon.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {existingReward && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvataggio..." : existingReward ? "Salva Modifiche" : "Crea Premio"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 