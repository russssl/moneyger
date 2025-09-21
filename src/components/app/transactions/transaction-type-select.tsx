import { ArrowUpIcon, ArrowDownIcon, ArrowLeftRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/use-mobile";
type TransactionType = "income" | "expense" | "transfer";
export default function TransactionTypeSelect({ value, setValue }: { value: TransactionType, setValue: (value: TransactionType) => void}) {
  const t = useTranslations("general");

  const keyIndicators = {
    expense: "E",
    income: "I",
    transfer: "T",
  };

  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={value === "expense" ? "destructive" : "ghost"}
        className="flex-1 gap-2 relative"
        onClick={() => setValue("expense")}
        type="button"
      >
        <ArrowUpIcon className="h-4 w-4" />
        {t("expense")}
        {!useIsMobile() && <span
          className="absolute top-1 right-2 text-xs bg-muted-foreground/10 text-muted-foreground rounded px-1 pointer-events-none"
          aria-label="Shortcut E"
        >
          {keyIndicators.expense}
        </span>}
      </Button>
      <Button
        variant={value === "income" ? "success" : "ghost"}
        className="flex-1 gap-2 relative"
        onClick={() => setValue("income")}
        type="button"
      >
        <ArrowDownIcon className="h-4 w-4" />
        {t("income")}
        {!useIsMobile() && <span
          className="absolute top-1 right-2 text-xs bg-muted-foreground/10 text-muted-foreground rounded px-1 pointer-events-none"
          aria-label="Shortcut I"
        >
          {keyIndicators.income}
        </span>}
      </Button>
      <Button
        variant={value === "transfer" ? "darkBlue" : "ghost"}
        className="flex-1 gap-2 relative"
        onClick={() => setValue("transfer")}
        type="button"
      >
        <ArrowLeftRightIcon className="h-4 w-4" />
        {t("transfer")}
        {!useIsMobile() && <span
          className="absolute top-1 right-2 text-xs bg-muted-foreground/10 text-muted-foreground rounded px-1 pointer-events-none"
          aria-label="Shortcut T"
        >
          {keyIndicators.transfer}
        </span>}
      </Button>
    </div>
  );
}