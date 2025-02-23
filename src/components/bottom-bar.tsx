import * as React from "react"
import Link from "next/link"

import { Home, PiggyBank, ChartLine, Settings } from "lucide-react"
import {BottomBarActionButton} from "./bottom-bar-action-button"
import SettingsModal from "./user/settings-modal"
import { useTranslations } from "next-intl"

export function BottomBar({ updateList }: { updateList: () => void }) {
  const t = useTranslations("navbar")
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background md:hidden">
      <div className="safe-area-bottom">
        <div className="h-16 border-t relative">
          <div className="grid h-full grid-cols-[1fr,1fr,auto,1fr,1fr] items-center px-1">
            <Link href="/" className="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground active:text-foreground">
              <Home className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Home</span>
            </Link>
            <Link href="/savings" className="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground active:text-foreground">
              <PiggyBank className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Savings</span>
            </Link>
            <div className="relative flex justify-center items-center mx-4 -mt-[50%]">
              <BottomBarActionButton updateList={updateList}/>
            </div>
            <Link href="/stats" className="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground active:text-foreground">
              <ChartLine className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Stats</span>
            </Link>
            <div>
              <div className="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground active:text-foreground">
                <SettingsModal trigger={
                  <Settings className="h-5 w-5" />
                }/>
                <span className="text-[10px] mt-0.5 font-medium">{t("settings")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
