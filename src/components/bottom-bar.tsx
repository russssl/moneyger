import * as React from "react"
import Link from "next/link"

import { Home, User, PiggyBank, ChartLine } from "lucide-react"
import {BottomBarActionButton} from "./bottom-bar-action-button"

const bottomBarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: PiggyBank, label: "Savings", href: "/savings" },
  { icon: ChartLine, label: "Stats", href: "/stats" },
  { icon: User, label: "User", href: "/user" },
]

export function BottomBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background md:hidden">
      <div className="safe-area-bottom">
        <div className="h-16 border-t relative">
          <div className="grid h-full grid-cols-[1fr,1fr,auto,1fr,1fr] items-center px-1">
            {bottomBarItems.slice(0, 2).map((item) => (
              <Link key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground active:text-foreground">
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </Link>
            ))}

            <div className="relative flex justify-center items-center mx-4">
              <BottomBarActionButton />
            </div>

            {bottomBarItems.slice(2).map((item) => (
              <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground active:text-foreground">
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
