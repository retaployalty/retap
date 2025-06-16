"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditCheckpointDialog } from "./edit-checkpoint-dialog"
import { Plus, MoreVertical } from "lucide-react"
import { CreateCheckpointDialog } from "./create-checkpoint-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CheckpointOffer {
  id: string
  name: string
  description: string
  total_steps: number
  merchant_id: string
  created_at: string
  updated_at: string
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

export function CheckpointsList() {
  const [offers, setOffers] = useState<CheckpointOffer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<CheckpointOffer | null>(null)
  const [steps, setSteps] = useState<CheckpointStep[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    total_steps: "8"
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    console.log("Component mounted")
    loadOffers()
  }, [])

  async function loadOffers() {
    console.log("Loading offers...")
    setLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error("Auth error:", userError)
        return
      }

      if (!user) {
        console.error("No user found")
        return
      }

      console.log("User found:", user.id)

      const { data: merchant, error: merchantError } = await supabase
        .from("merchants")
        .select("id")
        .eq("profile_id", user.id)
        .single()

      if (merchantError) {
        console.error("Error fetching merchant:", merchantError)
        return
      }

      if (!merchant) {
        console.error("No merchant found")
        return
      }

      console.log("Merchant found:", merchant.id)

      const { data: offers, error: offersError } = await supabase
        .from("checkpoint_offers")
        .select("*")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false })

      if (offersError) {
        console.error("Error fetching offers:", offersError)
        throw offersError
      }

      console.log("Loaded offers:", offers)
      setOffers(offers || [])
      
      if (offers && offers.length > 0) {
        console.log("Setting selected offer:", offers[0])
        setSelectedOffer(offers[0])
        await loadSteps(offers[0].id)
      }
    } catch (error) {
      console.error("Error loading offers:", error)
      toast.error("Error loading offers")
    } finally {
      setLoading(false)
    }
  }

  async function loadSteps(offerId: string) {
    console.log("Loading steps for offer:", offerId)
    try {
      const { data: steps, error } = await supabase
        .from("checkpoint_steps")
        .select(`
          *,
          reward:checkpoint_rewards(*)
        `)
        .eq("offer_id", offerId)
        .order("step_number", { ascending: true })

      if (error) {
        console.error("Error loading steps:", error)
        throw error
      }

      console.log("Loaded steps:", steps)

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
        console.log("Created empty steps:", emptySteps)
        setSteps(emptySteps)
      }
    } catch (error) {
      console.error("Error loading steps:", error)
      toast.error("Error loading checkpoints")
    }
  }

  const refreshData = async () => {
    if (selectedOffer) {
      await loadSteps(selectedOffer.id)
    }
  }

  async function createOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("profile_id", user.id)
        .single()

      if (!merchant) return

      const { name, description, total_steps } = formData
      const totalSteps = parseInt(total_steps)

      if (!name || !description || !totalSteps) {
        throw new Error("All fields are required")
      }

      const { data: offer, error } = await supabase
        .from("checkpoint_offers")
        .insert({
          name,
          description,
          total_steps: totalSteps,
          merchant_id: merchant.id
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Offer created successfully")
      setCreateDialogOpen(false)
      setFormData({ name: "", description: "", total_steps: "8" })
      loadOffers()
    } catch (error) {
      console.error("Error creating offer:", error)
      toast.error(error instanceof Error ? error.message : "Error creating offer")
    } finally {
      setLoading(false)
    }
  }

  async function updateOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      if (!selectedOffer) return

      const { name, description, total_steps } = formData
      const totalSteps = parseInt(total_steps)

      if (!name || !description || !totalSteps) {
        throw new Error("All fields are required")
      }

      const { error } = await supabase
        .from("checkpoint_offers")
        .update({
          name,
          description,
          total_steps: totalSteps
        })
        .eq("id", selectedOffer.id)

      if (error) throw error

      toast.success("Offer updated successfully")
      setEditDialogOpen(false)
      loadOffers()
    } catch (error) {
      console.error("Error updating offer:", error)
      toast.error(error instanceof Error ? error.message : "Error updating offer")
    } finally {
      setLoading(false)
    }
  }

  async function deleteOffer() {
    if (!selectedOffer) return

    if (!confirm("Are you sure you want to delete this offer? This action cannot be undone.")) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from("checkpoint_offers")
        .delete()
        .eq("id", selectedOffer.id)

      if (error) throw error

      toast.success("Offer deleted successfully")
      setSelectedOffer(null)
      loadOffers()
    } catch (error) {
      console.error("Error deleting offer:", error)
      toast.error("Error deleting offer")
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function handleEditClick() {
    if (selectedOffer) {
      setFormData({
        name: selectedOffer.name,
        description: selectedOffer.description,
        total_steps: selectedOffer.total_steps.toString()
      })
      setEditDialogOpen(true)
    }
  }

  if (loading) {
    return <div>Caricamento...</div>
  }

  console.log("Rendering with state:", { offers, selectedOffer, steps })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Checkpoint Offers</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage your checkpoint offers. Each offer has a specific number of steps.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Offer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={createOffer}>
              <DialogHeader>
                <DialogTitle>Create New Offer</DialogTitle>
                <DialogDescription>
                  Create a new checkpoint offer with multiple steps.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex. Summer Promotion"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Ex. Complete all steps to get a free ice cream"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="total_steps">Total Steps</Label>
                  <Input
                    id="total_steps"
                    name="total_steps"
                    type="number"
                    value={formData.total_steps}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Offer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {offers.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">Select Offer:</Label>
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
              <option value="">Select an offer</option>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.name} ({offer.total_steps} step)
                </option>
              ))}
            </select>
          </div>

          {selectedOffer && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedOffer.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{selectedOffer.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleEditClick}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={deleteOffer}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: selectedOffer.total_steps }, (_, i) => {
                      const stepNumber = i + 1;
                      const step = steps.find(s => s.step_number === stepNumber);
                      
                      return (
                        <Card key={`step-${stepNumber}`} className="relative overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-center text-lg">Step {stepNumber}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {step?.reward ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-center">
                                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl">{step.reward.icon}</span>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">{step.reward.name}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {step.reward.description}
                                  </div>
                                </div>
                                <EditCheckpointDialog step={step} onSuccess={refreshData}>
                                  <Button variant="outline" className="w-full">
                                    Edit Reward
                                  </Button>
                                </EditCheckpointDialog>
                              </div>
                            ) : (
                              <CreateCheckpointDialog 
                                totalSteps={selectedOffer.total_steps} 
                                defaultStep={stepNumber}
                                offerId={selectedOffer.id}
                                onSuccess={refreshData}
                              >
                                <Button variant="outline" className="w-full gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add Reward
                                </Button>
                              </CreateCheckpointDialog>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <p className="text-lg font-medium mb-2">No checkpoint offer created</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Create your first offer to start managing your checkpoint program.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <form onSubmit={updateOffer}>
            <DialogHeader>
              <DialogTitle>Edit Offer</DialogTitle>
              <DialogDescription>
                Edit the details of your checkpoint offer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex. Summer Promotion"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ex. Complete all steps to get a free ice cream"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total_steps">Total Steps</Label>
                <Input
                  id="total_steps"
                  name="total_steps"
                  type="number"
                  value={formData.total_steps}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Offer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 