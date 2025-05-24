"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateRewardDialog } from "./create-reward-dialog"
import { RewardsList } from "./rewards-list"

export default function RewardsPage() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rewards</h2>
          <p className="text-muted-foreground">
            Gestisci i rewards per i tuoi clienti
          </p>
        </div>
        <CreateRewardDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Reward
          </Button>
        </CreateRewardDialog>
      </div>
      <RewardsList />
    </div>
  )
} 