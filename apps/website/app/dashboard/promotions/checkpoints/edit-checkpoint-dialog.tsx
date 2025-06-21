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
import { useState } from "react"
import { toast } from "sonner"
import { Target, Award, Gift, Star, Trophy, Medal, Crown, Flag, Trash2 } from "lucide-react"
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

interface CheckpointStep {
  id: string
  reward: {
    id: string
    name: string
    description: string
    icon: string
  } | null
}

interface EditCheckpointDialogProps {
  children: React.ReactNode
  step: CheckpointStep
  onSuccess?: () => void
}

export function EditCheckpointDialog({ children, step, onSuccess }: EditCheckpointDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: step.reward?.name || "",
    description: step.reward?.description || "",
    icon: step.reward?.icon || "gift",
  })

  const supabase = createClientComponentClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleIconChange = (value: string) => {
    setFormData((prev) => ({ ...prev, icon: value }))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!step.reward) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from("checkpoint_rewards")
        .update({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
        })
        .eq("id", step.reward.id)

      if (error) throw error

      toast.success("Reward updated successfully")
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error("Error updating reward")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!step.reward) return
    setLoading(true)

    try {
      const { error: stepError } = await supabase
        .from("checkpoint_steps")
        .delete()
        .eq("id", step.id)

      if (stepError) throw stepError

      const { error: rewardError } = await supabase
        .from("checkpoint_rewards")
        .delete()
        .eq("id", step.reward.id)

      if (rewardError) throw rewardError

      toast.success("Checkpoint deleted successfully")
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error("Error deleting checkpoint")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Reward</DialogTitle>
          <DialogDescription>
            Make changes to the reward for this step.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={formData.icon} onValueChange={handleIconChange}>
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
          <DialogFooter className="justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 