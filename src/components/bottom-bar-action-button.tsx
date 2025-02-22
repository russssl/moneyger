import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "./ui/drawer"
import { Button } from "./ui/button"
import { Wallet, Plus, ArrowRightLeft, Target, PiggyBank } from "lucide-react"
import { cn } from "@/lib/utils"
import AddNewTransactionModal from "./app/transactions/add-new-transaction-modal"
import { useState, useEffect } from "react"
import AddNewWalletModal from "./app/add-wallet-modal"

type Action = {
  icon: any
  label: string
  color: string
  bg: string
  description: string
  gradient: string
  iconColor: string
  stateName: "isTransactionModalOpen" | "isWalletModalOpen"
  defaultTab?: "income" | "expense" | "transfer"
  disabled?: boolean
}
const actions = [
  {
    icon: Plus,
    label: "Add Transaction",
    color: "text-red-600",
    bg: "bg-red-50",
    description: "Add a new transaction",
    gradient: "from-rose-500/20 to-violet-500/20 hover:from-rose-500/30 hover:to-red-500/30",
    iconColor: "text-primary",
    stateName: "isTransactionModalOpen",
    defaultTab: "expense",
  },
  {
    icon: ArrowRightLeft,
    label: "Transfer",
    color: "text-green-600",
    bg: "bg-green-50",
    description: "Transfer money between wallets",
    gradient: "from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30",
    iconColor: "text-green",
    stateName: "isTransactionModalOpen",
    defaultTab: "transfer",
  },
  {
    icon: Wallet,
    label: "Add Wallet",
    color: "text-blue-600",
    bg: "bg-blue-50",
    description: "Add a new wallet",
    gradient: "from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30",
    iconColor: "text-primary",
    stateName: "isWalletModalOpen",
  },
  {
    icon: Target,
    label: "Add Budget",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    description: "Add a new budget",
    gradient: "from-yellow-500/20 to-red-500/20 hover:from-yellow-500/30 hover:to-red-500/30",
    iconColor: "text-yellow",
    disabled: true,
  },
  {
    icon: PiggyBank,
    label: "Add Saving Goal",
    color: "text-purple-600",
    bg: "bg-purple-50",
    description: "Add a new saving goal",
    gradient: "from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30",
    iconColor: "text-purple",
    disabled: true,
  },
] as Action[]

export function BottomBarActionButton({ updateList }: { updateList: () => void }) {
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false)
  const [isWalletModalOpen, setWalletModalOpen] = useState(false)
  const [transactionTab, setTransactionTab] = useState<"income" | "expense" | "transfer">("expense")

  const handleActionClick = (action: Action) => {
    if (action.disabled) return
    if (action.stateName === "isTransactionModalOpen") {
      if (!action.defaultTab) return
      setTransactionTab(action.defaultTab)
      setTransactionModalOpen(true)
    } else if (action.stateName === "isWalletModalOpen") {
      setWalletModalOpen(true)
    }
  }

  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Open quick add menu</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="flex flex-col">
          <DrawerHeader className="border-b px-4 py-4">
            <DrawerTitle className="text-xl font-semibold">Quick Add</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <div className="grid gap-3">
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={cn(
                    "group relative w-full rounded-2xl bg-gradient-to-r p-4 text-left transition-all duration-300",
                    action.gradient,
                    action.disabled ? "cursor-not-allowed opacity-75" : "hover:shadow-md",
                  )}
                >
                  {action.disabled && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
                      Coming Soon
                    </span>
                  )}
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
                        action.bg,
                        !action.disabled && "group-hover:scale-105",
                      )}
                    >
                      <action.icon className={cn("h-6 w-6", action.disabled ? "text-muted-foreground" : action.color)} />
                    </div>
                    <div className="flex flex-col">
                      <span className={cn("font-semibold", action.disabled && "text-muted-foreground")}>
                        {action.label}
                      </span>
                      <span className="text-sm text-muted-foreground">{action.description}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="border-t p-4 mt-auto">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
      <AddNewTransactionModal 
        open={isTransactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        onSave={updateList}
        defaultTab={transactionTab}
      />
      <AddNewWalletModal
        open={isWalletModalOpen}
        onOpenChange={setWalletModalOpen}
        onSave={updateList}
      />
    </>
  )
}