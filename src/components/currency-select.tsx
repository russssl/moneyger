import { currencies } from "@/hooks/currencies";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CurrencySelectProps {
  selectedCurrency: string | undefined | null;
  setSelectedCurrency: (currencyCode: string | undefined | null) => void;
  className?: string;
}

export default function CurrencySelect({ selectedCurrency, setSelectedCurrency, className }: CurrencySelectProps) {
  const currencyOptions = currencies();
  const t = useTranslations("currency-select");

  const value = selectedCurrency ?? "";

  return (
    <>
      <Label>{t("currency")}</Label>
      <Select
        onValueChange={(value) => setSelectedCurrency(value)}
        value={value}
      >
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue placeholder={t("select_currency")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{t("currency")}</SelectLabel>
            {currencyOptions.map((currency) => {
              return (
                <SelectItem key={currency.code} value={currency.code}>
                  {t(currency.name_code)} ({currency.code})
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
