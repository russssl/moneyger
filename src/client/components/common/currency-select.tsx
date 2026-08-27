import { currencies } from "@/client/hooks/currencies";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/client/components/ui/select";
import { Label } from "@/client/components/ui/label";
import { cn } from "@/client/lib/utils";

interface CurrencySelectProps {
  selectedCurrency: string | undefined | null;
  setSelectedCurrency: (currencyCode: string | undefined | null) => void;
  className?: string;
}

export default function CurrencySelect({ selectedCurrency, setSelectedCurrency, className }: CurrencySelectProps) {
  const currencyOptions = currencies();
  const { t } = useTranslation("currency-select");

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
