"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditCheckpointDialog } from "./edit-checkpoint-dialog"
import { Plus, MoreVertical, Target, Award, Gift, Star, Trophy, Medal, Crown, Flag } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EditOfferDialog } from "./edit-offer-dialog"

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

  // Add realtime subscription for offers
  useEffect(() => {
    const channel = supabase
      .channel('checkpoint_offers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkpoint_offers'
        },
        () => {
          loadOffers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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

  const getStepIcon = (step: CheckpointStep | null | undefined) => {
    if (!step?.reward) {
      return Gift // Icona di default per gli step vuoti
    }
    // Mappa delle icone disponibili
    const iconMap: { [key: string]: any } = {
      target: Target,
      award: Award,
      gift: Gift,
      star: Star,
      trophy: Trophy,
      medal: Medal,
      crown: Crown,
      flag: Flag
    }
    // Ritorna l'icona selezionata o l'icona di default se l'icona selezionata non esiste
    return iconMap[step.reward.icon.toLowerCase()] || Gift
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f8494c] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {offers.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Select
              value={selectedOffer?.id}
              onValueChange={(value) => {
                const offer = offers.find(o => o.id === value);
                if (offer) {
                  setSelectedOffer(offer);
                  loadSteps(offer.id);
                }
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select an offer to manage" />
              </SelectTrigger>
              <SelectContent>
                {offers.map((offer) => (
                  <SelectItem key={offer.id} value={offer.id}>
                    <span className="font-medium">{offer.name}</span>
                    <span className="ml-2 text-muted-foreground">({offer.total_steps} steps)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {selectedOffer && (
                  <EditOfferDialog offer={selectedOffer} onSuccess={loadOffers}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Edit Offer
                    </DropdownMenuItem>
                  </EditOfferDialog>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={deleteOffer}
                >
                  Delete Offer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {selectedOffer && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedOffer.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Steps Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                  {Array.from({ length: selectedOffer.total_steps }, (_, i) => {
                    const stepNumber = i + 1;
                    const step = steps.find(s => s.step_number === stepNumber);
                    const StepIcon = getStepIcon(step);
                    const hasReward = step?.reward;
                    const isLastStep = stepNumber === selectedOffer.total_steps;
                    
                    return (
                      <div 
                        key={`step-${stepNumber}`} 
                        className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                          hasReward 
                            ? 'border-[#f8494c] bg-white' 
                            : 'border-dashed border-gray-300 bg-gray-50 hover:border-[#f8494c]/50'
                        }`}
                      >
                        {/* Progress Line */}
                        {!isLastStep && (
                          <div className="absolute -right-5 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-gray-200" />
                        )}

                        {/* Step Number Badge */}
                        <div className={`absolute -top-3 -left-1 h-6 px-2 rounded-full flex items-center justify-center text-xs font-medium ${
                          hasReward 
                            ? 'bg-[#f8494c] text-white' 
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}>
                          Step {stepNumber}
                        </div>

                        {/* Icon and Content */}
                        <div className="mt-4 space-y-3">
                          <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                            hasReward 
                              ? 'bg-[#f8494c]/10 text-[#f8494c]' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <StepIcon className="h-5 w-5" />
                          </div>
                          
                          {hasReward ? (
                            <div className="text-center space-y-2">
                              <div className="font-medium text-sm line-clamp-2" title={step.reward?.name}>
                                {step.reward?.name}
                              </div>
                              <div className="text-xs text-gray-500 line-clamp-1" title={step.reward?.description}>
                                {step.reward?.description}
                              </div>
                              <EditCheckpointDialog step={step} onSuccess={refreshData}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full text-xs font-medium hover:text-[#f8494c] hover:bg-[#f8494c]/5"
                                >
                                  Edit
                                </Button>
                              </EditCheckpointDialog>
                            </div>
                          ) : (
                            <div className="text-center space-y-2">
                              <p className="text-sm text-gray-500">No reward</p>
                              <CreateCheckpointDialog 
                                totalSteps={selectedOffer.total_steps} 
                                defaultStep={stepNumber}
                                offerId={selectedOffer.id}
                                onSuccess={refreshData}
                              >
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="w-full text-xs font-medium hover:text-[#f8494c] hover:bg-[#f8494c]/5"
                                >
                                  Add Reward
                                </Button>
                              </CreateCheckpointDialog>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Flag className="h-12 w-12 text-[#4c8ff8] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No checkpoint offers</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first checkpoint offer to build customer loyalty journeys. Set up milestone-based rewards to keep customers engaged.
          </p>
        </div>
      )}

      {/* Edit Dialog */}
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