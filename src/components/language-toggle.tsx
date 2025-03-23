"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function LanguageToggle() {
  const t = useTranslations("settings");

  const setLocale = (locale: string) => {
    document.cookie = `locale=${locale}; path=/; max-age=31536000`;
    window.location.reload();
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe />
          <span className="sr-only">{t("language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale("en")}>
          {t("english")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("pl")}>
          {t("polish")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("ua")}>
          {t("ukrainian")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
