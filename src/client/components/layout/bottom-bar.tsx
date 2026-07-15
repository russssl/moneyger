
import * as React from "react"
import { Link } from "@tanstack/react-router"

import { Home, PiggyBank, ChartLine, Settings, Menu, ReceiptText } from "lucide-react"
import { BottomBarActionButton } from "./bottom-bar-action-button"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu"

export function BottomBar({ updateList }: { updateList: () => void }) {
  const { t } = useTranslation("navbar")
  const { t: tBreadcrumbs } = useTranslation("breadcrumbs")
  const itemStyle = "flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground active:text-foreground"
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background md:hidden">
      <div className="safe-area-bottom">
        <div className="h-16 border-t relative">
          <div className="grid h-full grid-cols-[1fr,1fr,auto,1fr,1fr] items-center px-1">
            <Link to="/" className={itemStyle}>
              <Home className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Home</span>
            </Link>
            <Link to="/savings" className={itemStyle}>
              <PiggyBank className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Savings</span>
            </Link>
            <div className="relative flex justify-center items-center mx-4 -mt-[50%]">
              <BottomBarActionButton updateList={updateList}/>
            </div>
            <Link to="/dashboard" className={itemStyle}>
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
                  <Link to="/transactions">
                    <ReceiptText className="h-5 w-5" />
                    {tBreadcrumbs("transactions")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" search={{ category: "categories" }}>
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
