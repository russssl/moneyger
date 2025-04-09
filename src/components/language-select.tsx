
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "./ui/select";
import { Label } from "./ui/label";

interface LanguageSelectProps {
  language: string | undefined | null;
  setLanguage: (languageCode: string | undefined | null) => void;
}


export function LanguageSelect({language, setLanguage}: LanguageSelectProps) {
  const t = useTranslations("settings");
  return (
    <>
      <Label>{t("language")}</Label>
      <Select onValueChange={setLanguage} value={language ?? undefined}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("select_language")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="en">{t("english")}</SelectItem>
            <SelectItem value="pl">{t("polish")}</SelectItem>
            <SelectItem value="ua">{t("ukrainian")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  )
}

export function LanguageToggle() {

  const setLocale = (locale: string) => {
    document.cookie = `locale=${locale}; path=/; max-age=31536000`;
    window.location.reload();
  };
  
  const t = useTranslations("settings");
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