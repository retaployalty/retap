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
  Flag
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const ICONS = [
  { value: "gift", label: "Gift", icon: Gift },
  { value: "coffee", label: "Coffee", icon: Coffee },
  { value: "pizza", label: "Pizza", icon: Pizza },
  { value: "ice-cream", label: "Ice Cream", icon: IceCream },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "percent", label: "Discount", icon: Percent },
  { value: "ticket", label: "Ticket", icon: Ticket },
  { value: "star", label: "Star", icon: Star },
]

interface CreateRewardDialogProps {
  children: React.ReactNode
  totalSteps?: number
  defaultStep?: number
}

export function CreateRewardDialog({ 
  children,
  totalSteps = 8,
  defaultStep = 1
}: CreateRewardDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState("gift")
  const [createCheckpoint, setCreateCheckpoint] = useState(false)
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
      const price = parseInt(formData.get("price") as string)
      const imageFile = formData.get("image") as File
      const checkpointName = formData.get("checkpointName") as string
      const checkpointDescription = formData.get("checkpointDescription") as string

      // Validate inputs
      if (!name || !description || !price || !imageFile) {
        throw new Error("All fields are required")
      }

      if (price < 1) {
        throw new Error("Price must be greater than 0")
      }

      if (!imageFile.type.startsWith("image/")) {
        throw new Error("File must be an image")
      }

      if (createCheckpoint && (!checkpointName || !checkpointDescription)) {
        throw new Error("All checkpoint fields are required")
      }

      // 3. Upload image to Supabase Storage
      const filename = `${Date.now()}-${imageFile.name}`
      const { data, error: uploadError } = await supabase.storage
        .from("rewards")
        .upload(filename, imageFile)

      if (uploadError) {
        console.error("Storage error:", uploadError)
        throw new Error("Error uploading image")
      }

      // 4. Create reward in database
      const { data: reward, error: insertError } = await supabase
        .from("rewards")
        .insert({
          name,
          description,
          price_coins: price,
          image_path: filename,
          merchant_id: merchant.id,
          is_active: true,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Insert error:", insertError)
        throw new Error("Error saving reward")
      }

      // 5. Create checkpoint if requested
      if (createCheckpoint) {
        // Create checkpoint reward
        const { data: checkpointReward, error: rewardError } = await supabase
          .from("checkpoint_rewards")
          .insert({
            name: checkpointName,
            description: checkpointDescription,
            icon: selectedIcon,
            merchant_id: merchant.id
          })
          .select()
          .single()

        if (rewardError) {
          console.error("Reward error:", rewardError)
          throw new Error("Error saving checkpoint reward")
        }

        // Create step with reward
        const { error: stepError } = await supabase
          .from("checkpoint_steps")
          .insert({
            step_number: defaultStep,
            total_steps: totalSteps,
            reward_id: checkpointReward.id,
            merchant_id: merchant.id,
            offer_id: reward.id
          })

        if (stepError) {
          console.error("Step error:", stepError)
          throw new Error("Error saving step")
        }
      }

      toast.success("Reward created successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error details:", error)
      toast.error(error instanceof Error ? error.message : "Error creating reward")
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
            <DialogTitle>New Reward</DialogTitle>
            <DialogDescription>
              Create a new reward for your customers. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Ex. 10% Discount" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Ex. 10% discount on any product"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (coins)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="Ex. 100"
                required
                min="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
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
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Reward"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 