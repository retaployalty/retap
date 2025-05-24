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
import Image from "next/image"

interface Reward {
  id: string
  name: string
  description: string
  price_coins: number
  image_path: string
  is_active: boolean
}

interface EditRewardDialogProps {
  reward: Reward
  children: React.ReactNode
}

export function EditRewardDialog({ reward, children }: EditRewardDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const formRef = useRef<HTMLFormElement>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      if (!formRef.current) {
        throw new Error("Form non trovato")
      }

      const formData = new FormData(formRef.current)
      const name = formData.get("name") as string
      const description = formData.get("description") as string
      const price = parseInt(formData.get("price") as string)
      const imageFile = formData.get("image") as File | null
      const is_active = formData.get("is_active") === "true"

      // Validate inputs
      if (!name || !description || !price) {
        throw new Error("Tutti i campi sono obbligatori")
      }

      if (price < 1) {
        throw new Error("Il prezzo deve essere maggiore di 0")
      }

      let imagePath = reward.image_path

      // Se è stata caricata una nuova immagine
      if (imageFile && imageFile.size > 0) {
        if (!imageFile.type.startsWith("image/")) {
          throw new Error("Il file deve essere un'immagine")
        }

        // Elimina l'immagine precedente
        const { error: deleteError } = await supabase.storage
          .from("rewards")
          .remove([reward.image_path])

        if (deleteError) {
          console.error("Error deleting old image:", deleteError)
        }

        // Carica la nuova immagine
        imagePath = `${Date.now()}-${imageFile.name}`
        const { error: uploadError } = await supabase.storage
          .from("rewards")
          .upload(imagePath, imageFile)

        if (uploadError) {
          console.error("Storage error:", uploadError)
          throw new Error("Errore durante il caricamento dell'immagine")
        }
      }

      // Aggiorna il reward nel database
      const { error: updateError } = await supabase
        .from("rewards")
        .update({
          name,
          description,
          price_coins: price,
          image_path: imagePath,
          is_active,
        })
        .eq("id", reward.id)

      if (updateError) {
        console.error("Update error:", updateError)
        throw new Error("Errore durante l'aggiornamento del reward")
      }

      toast.success("Reward aggiornato con successo")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error details:", error)
      toast.error(error instanceof Error ? error.message : "Errore durante l'aggiornamento del reward")
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
            <DialogTitle>Modifica Reward</DialogTitle>
            <DialogDescription>
              Modifica i dettagli del reward. Lascia vuoto il campo immagine se non vuoi cambiarla.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                defaultValue={reward.name}
                placeholder="Es. Sconto 10%"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={reward.description}
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
                defaultValue={reward.price_coins}
                placeholder="Es. 100"
                required
                min="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Immagine</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rewards/${reward.image_path}`}
                    alt={reward.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="is_active">Stato</Label>
              <select
                id="is_active"
                name="is_active"
                defaultValue={reward.is_active.toString()}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="true">Attivo</option>
                <option value="false">Inattivo</option>
              </select>
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
              {loading ? "Aggiornamento..." : "Aggiorna Reward"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 