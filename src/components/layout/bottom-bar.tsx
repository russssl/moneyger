import * as React from "react"
import Link from "next/link"

import { Home, PiggyBank, ChartLine, Settings, Menu, ReceiptText } from "lucide-react"
import { BottomBarActionButton } from "./bottom-bar-action-button"
import { useTranslations } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function BottomBar({ updateList }: { updateList: () => void }) {
  const t = useTranslations("navbar")
  const tBreadcrumbs = useTranslations("breadcrumbs")
  const itemStyle = "flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground active:text-foreground"
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background md:hidden">
      <div className="safe-area-bottom">
        <div className="h-16 border-t relative">
          <div className="grid h-full grid-cols-[1fr,1fr,auto,1fr,1fr] items-center px-1">
            <Link href="/" className={itemStyle}>
              <Home className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Home</span>
            </Link>
            <Link href="/savings" className={itemStyle}>
              <PiggyBank className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Savings</span>
            </Link>
            <div className="relative flex justify-center items-center mx-4 -mt-[50%]">
              <BottomBarActionButton updateList={updateList}/>
            </div>
            <Link href="/stats" className={itemStyle}>
              <ChartLine className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Stats</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={itemStyle}>
                  <Menu className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5 font-medium">More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="mb-2">
                <DropdownMenuItem asChild>
                  <Link href="/transactions">
                    <ReceiptText className="h-5 w-5" />
                    {tBreadcrumbs("transactions")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/categories">
                    <Settings className="h-5 w-5" />
                    {t("settings")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
