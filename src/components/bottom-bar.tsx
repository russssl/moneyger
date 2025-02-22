import * as React from "react"
import { Home, User, Search, Wallet, Plus, ArrowRightLeft, Target, PiggyBank, ChartLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "./ui/drawer"

const bottomBarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: PiggyBank, label: "Savings", href: "/savings" },
  { icon: ChartLine, label: "Stats", href: "/stats" },
  { icon: User, label: "User", href: "/user" },
]

const actions = [
  {
    icon: Plus,
    label: "Add Transaction",
    color: "text-red-600",
    bg: "bg-red-50",
    description: "Add a new transaction",
    gradient: "from-rose-500/20 to-violet-500/20 hover:from-rose-500/30 hover:to-red-500/30",
    iconColor: "text-primary",
    onClick: () => console.log("Add Transaction"),
  },
  {
    icon: ArrowRightLeft,
    label: "Transfer",
    color: "text-green-600",
    bg: "bg-green-50",
    description: "Transfer money between wallets",
    gradient: "from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30",
    iconColor: "text-green",
    onClick: () => console.log("Transfer"),
  },
  {
    icon: Wallet,
    label: "Add Wallet",
    color: "text-blue-600",
    bg: "bg-blue-50",
    description: "Add a new wallet",
    gradient: "from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30",
    iconColor: "text-primary",
    onClick: () => console.log("Add Wallet"),
  },
  {
    icon: Target,
    label: "Add Budget",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    description: "Add a new budget",
    gradient: "from-yellow-500/20 to-red-500/20 hover:from-yellow-500/30 hover:to-red-500/30",
    iconColor: "text-yellow",
    onClick: () => console.log("Add Budget"),
  },
  {
    icon: PiggyBank,
    label: "Add Saving Goal",
    color: "text-purple-600",
    bg: "bg-purple-50",
    description: "Add a new saving goal",
    gradient: "from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30",
    iconColor: "text-purple",
    onClick: () => console.log("Add Goal"),
  },
]

export function BottomBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background md:hidden">
      <div className="safe-area-bottom">
        <div className="h-16 border-t relative">
          <div className="grid h-full grid-cols-[1fr,1fr,auto,1fr,1fr] items-center px-1">
            {bottomBarItems.slice(0, 2).map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground active:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </a>
            ))}

            <div className="relative flex justify-center items-center mx-4">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button
                    size="icon"
                    className="h-16 w-16 rounded-full shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 absolute -top-12"
                  >
                    <Plus className="h-7 w-7" />
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
                          onClick={action.onClick}
                          className={`group w-full rounded-2xl bg-gradient-to-r p-4 text-left transition-all duration-300 
                            ${action.gradient} hover:shadow-md`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.bg} 
                                transition-all duration-300 group-hover:scale-105`}
                            >
                              <action.icon className={`h-6 w-6 ${action.color}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold">{action.label}</span>
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
            </div>

            {bottomBarItems.slice(2).map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground active:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
