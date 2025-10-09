import { currencies } from "@/hooks/currencies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { type Wallet } from "@/server/db/wallet";

type CurrencySelectProps = {
  wallets: Wallet[];
  selectedCurrency: string | undefined | null;
  label: string;
  onSelect: (currency: string | undefined | null) => void;
}

export default function CurrencySelect({wallets, selectedCurrency, label, onSelect}: CurrencySelectProps) {
  return (
    <>
      <Label>{label}</Label>
      <div className="flex rounded-lg shadow-xs">
        <Select onValueChange={(value) => onSelect(value)}>
          <SelectTrigger className={cn("shadow-none", selectedCurrency ? "rounded-e-none" : "rounded")}>
            <SelectValue placeholder={label} />
          </SelectTrigger>
          <SelectContent>
            {wallets.map((wallet) => (
              <SelectItem key={wallet.id} value={wallet.id}>
                {wallet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCurrency && (
          <span className="border-input bg-background text-muted-foreground inline-flex items-center rounded-e-lg border px-3 text-sm">
            {currencies(selectedCurrency)?.symbol}
          </span>
        )}
      </div>
    </>
  );
}
