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

export interface CreateOfferDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function CreateOfferDialog({ 
  children,
  onSuccess
}: CreateOfferDialogProps) {
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
      const totalSteps = parseInt(formData.get("total_steps") as string) || 8

      // Validate inputs
      if (!name || !description) {
        throw new Error("All fields are required")
      }

      // Create new checkpoint offer
      const { data: offer, error: offerError } = await supabase
        .from("checkpoint_offers")
        .insert({
          name,
          description,
          total_steps: totalSteps,
          merchant_id: merchant.id
        })
        .select()
        .single()

      if (offerError) {
        console.error("Offer error:", offerError)
        throw new Error("Error creating offer")
      }

      toast.success("Checkpoint offer created successfully")
      setOpen(false)
      
      // Refresh the data in the parent component
      if (onSuccess) {
        onSuccess()
      }
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
            <DialogTitle>Create New Checkpoint Offer</DialogTitle>
            <DialogDescription>
              Create a new milestone journey for your customers. You can add rewards to each step later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Summer Loyalty Program"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Collect stamps and get rewards at each milestone"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total_steps">Total Steps</Label>
              <Input
                id="total_steps"
                name="total_steps"
                type="number"
                min="2"
                max="12"
                defaultValue="8"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 