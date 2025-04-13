"use client"

import * as React from "react"
import { Computer, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle({ ...props }) {
  const { setTheme } = useTheme()
  const t = useTranslations("theme-toggle")
  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("theme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ThemeSwitch() {
  const { setTheme, theme } = useTheme()
  return (
    <div className="grid grid-cols-3 gap-2">
      <div
        className={`flex flex-col items-center justify-center p-2 border rounded-md cursor-pointer ${theme === "light" ? "border-primary bg-secondary" : "border-muted"}`}
        onClick={() => setTheme("light")}
      >
        <Sun className="h-5 w-5 mb-1" />
        <span className="text-sm">Light</span>
      </div>
      <div
        className={`flex flex-col items-center justify-center p-2 border rounded-md cursor-pointer ${theme === "dark" ? "border-primary bg-secondary" : "border-muted"}`}
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-5 w-5 mb-1" />
        <span className="text-sm">Dark</span>
      </div>
      <div
        className={`flex flex-col items-center justify-center p-2 border rounded-md cursor-pointer ${theme === "system" ? "border-primary bg-secondary" : "border-muted"}`}
        onClick={() => setTheme("system")}
      >
        <Computer className="h-5 w-5 mb-1" />
        <span className="text-sm">System</span>
      </div>
    </div>
  )
}