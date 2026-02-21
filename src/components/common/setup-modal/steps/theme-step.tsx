"use client";
import { useTranslations } from "next-intl";
import { Palette, Sun, Moon, Computer } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeStepProps = {
  selectedTheme: string | undefined;
  onThemeSelect: (theme: string) => void;
};

export function ThemeStep({ selectedTheme, onThemeSelect }: ThemeStepProps) {
  const t = useTranslations("setup-modal");
  return (
    <div className="flex flex-col gap-4 duration-300 animate-in fade-in slide-in-from-right-4">
      <div className="mb-2 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Palette className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">{t("theme_step_title")}</h3>
          <p className="text-sm text-muted-foreground">{t("theme_step_description")}</p>
        </div>
      </div>
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
        {[
          { id: "light", Icon: Sun, label: t("light_theme"), desc: t("light_theme_desc") },
          { id: "dark", Icon: Moon, label: t("dark_theme"), desc: t("dark_theme_desc") },
          { id: "system", Icon: Computer, label: t("system_theme"), desc: t("system_theme_desc") },
        ].map(({ id, Icon, label, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => onThemeSelect(id)}
            className={cn(
              "flex w-full flex-row items-center justify-start gap-3 rounded-lg border-2 p-3 transition-colors duration-200 sm:flex-col sm:justify-center sm:gap-0 sm:p-6",
              selectedTheme === id ? "border-primary bg-primary/10 shadow-md" : "border-muted hover:border-muted-foreground/50",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0 transition-colors sm:mb-3 sm:h-6 sm:w-6", selectedTheme === id ? "text-primary" : "text-muted-foreground")} />
            <div className="flex flex-1 flex-col items-start text-left sm:flex-none sm:items-center sm:text-center">
              <span className={cn("text-sm font-medium", selectedTheme === id ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              <span className="hidden text-xs text-muted-foreground sm:mt-1 sm:block">{desc}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="mt-2 hidden text-center text-xs text-muted-foreground sm:block">{t("theme_note")}</p>
    </div>
  );
}
