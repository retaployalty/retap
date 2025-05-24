"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditRewardDialog } from "./edit-reward-dialog"
import { toast } from "sonner"

interface Reward {
  id: string
  name: string
  description: string
  price_coins: number
  image_path: string
  is_active: boolean
  created_at: string
}

export function RewardsList() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  async function loadRewards() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("profile_id", user.id)
        .single()

      if (!merchant) return

      const { data: rewards, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setRewards(rewards || [])
    } catch (error) {
      console.error("Error loading rewards:", error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteReward(reward: Reward) {
    try {
      // Elimina l'immagine dallo storage
      const { error: deleteImageError } = await supabase.storage
        .from("rewards")
        .remove([reward.image_path])

      if (deleteImageError) {
        console.error("Error deleting image:", deleteImageError)
      }

      // Elimina il reward dal database
      const { error: deleteRewardError } = await supabase
        .from("rewards")
        .delete()
        .eq("id", reward.id)

      if (deleteRewardError) {
        throw deleteRewardError
      }

      toast.success("Reward eliminato con successo")
      loadRewards() // Ricarica la lista
    } catch (error) {
      console.error("Error deleting reward:", error)
      toast.error("Errore durante l'eliminazione del reward")
    }
  }

  useEffect(() => {
    loadRewards()
  }, [supabase])

  if (loading) {
    return <div>Caricamento rewards...</div>
  }

  if (rewards.length === 0) {
    return <div>Nessun reward trovato. Crea il tuo primo reward!</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Immagine</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Descrizione</TableHead>
            <TableHead>Prezzo</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rewards.map((reward) => (
            <TableRow key={reward.id}>
              <TableCell>
                <div className="relative h-12 w-12">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rewards/${reward.image_path}`}
                    alt={reward.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">{reward.name}</TableCell>
              <TableCell>{reward.description}</TableCell>
              <TableCell>{reward.price_coins} coins</TableCell>
              <TableCell>
                <Badge variant={reward.is_active ? "default" : "secondary"}>
                  {reward.is_active ? "Attivo" : "Inattivo"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Apri menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <EditRewardDialog reward={reward}>
                      <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifica
                      </DropdownMenuItem>
                    </EditRewardDialog>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => deleteReward(reward)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Elimina
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 