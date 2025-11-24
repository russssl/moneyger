import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Wallet, Plus, ArrowRightLeft, Target, PiggyBank } from "lucide-react"
import { cn } from "@/lib/utils"
import EditTransactionModal from "@/components/transactions/edit-transaction-modal"
import { useState } from "react"
import EditWalletModal from "@/components/wallets/edit-wallet-modal"
import { useTranslations } from "next-intl"

type Action = {
  icon: any
  id: string
  label: string | ((t: any) => string)
  color: string
  bg: string
  description: string | ((t: any) => string)
  gradient: string 
  iconColor: string
  stateName: "isTransactionModalOpen" | "isWalletModalOpen"
  defaultTab?: "income" | "expense" | "transfer"
  disabled?: boolean
}
const actions = [
  {
    icon: Plus,
    id: "trasaction",
    label: (t: any) => t("add_transaction"),
    color: "text-red-600",
    bg: "bg-red-50",
    description: (t: any) => t("add_transaction_description"),
    gradient: "from-rose-500/20 to-violet-500/20 hover:from-rose-500/30 hover:to-red-500/30",
    iconColor: "text-primary",
    stateName: "isTransactionModalOpen",
    defaultTab: "expense",
  },
  {
    icon: ArrowRightLeft,
    id: "transfer",
    label: (t: any) => t("add_transfer"),
    color: "text-green-600",
    bg: "bg-green-50",
    description: (t: any) => t("add_transfer_description"),
    gradient: "from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30",
    iconColor: "text-green",
    stateName: "isTransactionModalOpen",
    defaultTab: "transfer",
  },
  {
    icon: Wallet,
    id: "wallet",
    label: (t: any) => t("add_wallet"),
    color: "text-blue-600",
    bg: "bg-blue-50",
    description: (t: any) => t("add_wallet_description"),
    gradient: "from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30",
    iconColor: "text-primary",
    stateName: "isWalletModalOpen",
  },
  {
    icon: PiggyBank,
    label: (t: any) => t("add_saving"),
    id: "saving",
    color: "text-purple-600",
    bg: "bg-purple-50",
    description: (t: any) => t("add_saving_description"),
    gradient: "from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30",
    iconColor: "text-purple",
    stateName: "isWalletModalOpen",
    disabled: false,
  },
  {
    icon: Target,
    id: "budget",
    label: (t: any) => t("add_budget"),
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    description: (t: any) => t("add_budget_description"),
    gradient: "from-yellow-500/20 to-red-500/20 hover:from-yellow-500/30 hover:to-red-500/30",
    iconColor: "text-yellow",
    disabled: true,
  },
] as Action[]

export function BottomBarActionButton({ updateList }: { updateList: () => void }) {
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false)
  const [isWalletModalOpen, setWalletModalOpen] = useState(false)
  const [transactionTab, setTransactionTab] = useState<"income" | "expense" | "transfer">("expense")
  const [defaultIsSavingAccount, setDefaultIsSavingAccount] = useState(false)

  const handleActionClick = (action: Action) => {
    if (action.disabled) return
    if (action.stateName === "isTransactionModalOpen") {
      if (!action.defaultTab) return
      setTransactionTab(action.defaultTab)
      setTransactionModalOpen(true)
    } else if (action.stateName === "isWalletModalOpen") {
      if (action.id === "saving") {
        setDefaultIsSavingAccount(true)
        setWalletModalOpen(true)
      } else {
        setDefaultIsSavingAccount(false)
        setWalletModalOpen(true)
      }
    }
  }
  const t = useTranslations("quick_actions")
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
            <DrawerTitle className="text-xl font-semibold">{t("title")}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <div className="grid gap-3">
              {actions.map((action) => (
                <button
                  key={action.id}
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
                      {t("coming_soon")}
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
                        {typeof action.label === "function" ? action.label(t) : action.label}
                      </span>
                      <span className="text-sm text-muted-foreground">{typeof action.description === "function" ? action.description(t) : action.description}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="border-t p-4 mt-auto">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                {t("cancel")}
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
      <EditTransactionModal 
        open={isTransactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        onSave={updateList}
        defaultTab={transactionTab}
      />
      <EditWalletModal
        open={isWalletModalOpen}
        onOpenChange={setWalletModalOpen}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onDelete={() => {}} // TODO: Add delete function
        onSave={updateList}
        defaultIsSavingAccount={defaultIsSavingAccount}
      />
    </>
  )
}