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

interface CreateRewardDialogProps {
  children: React.ReactNode
}

export function CreateRewardDialog({ children }: CreateRewardDialogProps) {
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
      const price = parseInt(formData.get("price") as string)
      const imageFile = formData.get("image") as File

      // Validate inputs
      if (!name || !description || !price || !imageFile) {
        throw new Error("Tutti i campi sono obbligatori")
      }

      if (price < 1) {
        throw new Error("Il prezzo deve essere maggiore di 0")
      }

      if (!imageFile.type.startsWith("image/")) {
        throw new Error("Il file deve essere un'immagine")
      }

      // 3. Upload image to Supabase Storage
      const imagePath = `${Date.now()}-${imageFile.name}`
      const { error: uploadError } = await supabase.storage
        .from("rewards")
        .upload(imagePath, imageFile)

      if (uploadError) {
        console.error("Storage error:", uploadError)
        throw new Error("Errore durante il caricamento dell'immagine")
      }

      // 4. Create reward in database
      const { error: insertError } = await supabase.from("rewards").insert({
        name,
        description,
        price_coins: price,
        image_path: imagePath,
        merchant_id: merchant.id,
      })

      if (insertError) {
        console.error("Insert error:", insertError)
        throw new Error("Errore durante il salvataggio del reward")
      }

      toast.success("Reward creato con successo")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error details:", error)
      toast.error(error instanceof Error ? error.message : "Errore durante la creazione del reward")
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
            <DialogTitle>Nuovo Reward</DialogTitle>
            <DialogDescription>
              Crea un nuovo reward per i tuoi clienti. Compila tutti i campi richiesti.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" placeholder="Es. Sconto 10%" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Es. Sconto del 10% su qualsiasi prodotto"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Prezzo (coins)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="Es. 100"
                required
                min="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Immagine</Label>
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
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creazione..." : "Crea Reward"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 