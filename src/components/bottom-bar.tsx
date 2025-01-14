import * as React from "react"
import { Home, Plus, Search, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

const bottomBarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: Search, label: "Search", href: "/search" },
  { icon: Plus, label: "Stats", href: "/stats" },
]

export function BottomBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background md:hidden">
      <div className="safe-area-bottom">
        <div className="h-16 border-t">
          <div className="grid h-full grid-cols-[1fr,1fr,auto,1fr,1fr] items-center px-2">
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
            
            {/* Center FAB */}
            <div className="-mt-6">
              <Button 
                size="icon" 
                className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 active:bg-primary/80"
              >
                <Plus className="h-6 w-6" />
                <span className="sr-only">Add new</span>
              </Button>
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

