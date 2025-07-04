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
import { Target, Award, Gift, Star, Trophy, Medal, Crown, Flag } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ICONS = [
  { value: "target", label: "Target", icon: Target },
  { value: "award", label: "Award", icon: Award },
  { value: "gift", label: "Gift", icon: Gift },
  { value: "star", label: "Star", icon: Star },
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "medal", label: "Medal", icon: Medal },
  { value: "crown", label: "Crown", icon: Crown },
  { value: "flag", label: "Flag", icon: Flag },
]

export interface CreateCheckpointDialogProps {
  children: React.ReactNode
  totalSteps: number
  defaultStep: number
  offerId: string
  onSuccess?: () => void
}

export function CreateCheckpointDialog({ 
  children,
  totalSteps,
  defaultStep,
  offerId,
  onSuccess
}: CreateCheckpointDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState("gift")
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
        throw new Error("Authentication error")
      }

      if (!user) {
        throw new Error("User not authenticated")
      }

      const { data: merchant, error: merchantError } = await supabase
        .from("merchants")
        .select("id")
        .eq("profile_id", user.id)
        .single()

      if (merchantError) {
        console.error("Merchant error:", merchantError)
        throw new Error("Error retrieving merchant data")
      }

      if (!merchant) {
        throw new Error("No merchant associated with your account")
      }

      // 2. Get form data
      if (!formRef.current) {
        throw new Error("Form not found")
      }

      const formData = new FormData(formRef.current)
      const name = formData.get("name") as string
      const description = formData.get("description") as string

      // Validate inputs
      if (!name || !description) {
        throw new Error("All fields are required")
      }

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
        throw new Error("Error saving reward")
      }

      if (!reward) {
        throw new Error("No reward created")
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
        // Se c'è un errore nel creare lo step, elimina il reward appena creato
        await supabase
          .from("checkpoint_rewards")
          .delete()
          .eq("id", reward.id)
        
        console.error("Step error:", stepError)
        throw stepError
      }

      toast.success("Checkpoint created successfully")
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error details:", error)
      toast.error(error instanceof Error ? error.message : "Error during operation")
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
              Add Reward for Step {defaultStep}
            </DialogTitle>
            <DialogDescription>
              Add a reward for step {defaultStep} of {totalSteps}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Reward Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex. Free Ice Cream"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Ex. A free ice cream of any flavor"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Icon</Label>
              <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 