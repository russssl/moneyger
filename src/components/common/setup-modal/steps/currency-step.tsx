"use client";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import CurrencySelect from "@/components/common/currency-select";

type CurrencyStepProps = {
  currency: string | undefined;
  setCurrency: (currency: string | undefined) => void;
};

export function CurrencyStep({ currency, setCurrency }: CurrencyStepProps) {
  const t = useTranslations("setup-modal");
  return (
    <div className="flex flex-col gap-4 duration-300 animate-in fade-in slide-in-from-right-4">
      <div className="mb-2 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Globe className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">{t("currency_step_title")}</h3>
          <p className="text-sm text-muted-foreground">{t("currency_step_description")}</p>
        </div>
      </div>
      <CurrencySelect selectedCurrency={currency} setSelectedCurrency={(c) => setCurrency(c ?? undefined)} />
    </div>
  );
}
