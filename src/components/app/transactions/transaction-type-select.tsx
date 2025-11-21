import { ArrowUpIcon, ArrowDownIcon, ArrowLeftRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/use-mobile";
type TransactionType = "income" | "expense" | "transfer";

const ShortcutBadge = ({ shortcut, ariaLabel }: { shortcut: string; ariaLabel: string }) => {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  
  return (
    <span
      className="absolute top-1 right-2 text-xs bg-foreground/10 text-foreground rounded px-1 pointer-events-none border-2 border-foreground/50"
      aria-label={ariaLabel}
    >
      {shortcut}
    </span>
  );
};

export default function TransactionTypeSelect({ value, setValue }: { value: TransactionType, setValue: (value: TransactionType) => void}) {
  const t = useTranslations("general");

  const keyIndicators = {
    expense: "E",
    income: "I",
    transfer: "T",
  };

  const isMobile = useIsMobile();

  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg w-full min-w-0">
      <Button
        variant={value === "expense" ? "destructive" : "ghost"}
        className="flex-1 gap-1 sm:gap-2 relative min-w-0 flex-col sm:flex-row"
        onClick={() => setValue("expense")}
        type="button"
        aria-label={t("expense")}
      >
        <ArrowUpIcon className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs sm:text-sm">
          {isMobile ? t("expense_short") : t("expense")}
        </span>
        {!isMobile && <ShortcutBadge shortcut={keyIndicators.expense} ariaLabel="Shortcut E" />}
      </Button>
      <Button
        variant={value === "income" ? "success" : "ghost"}
        className="flex-1 gap-1 sm:gap-2 relative min-w-0 flex-col sm:flex-row"
        onClick={() => setValue("income")}
        type="button"
        aria-label={t("income")}
      >
        <ArrowDownIcon className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs sm:text-sm">
          {isMobile ? t("income_short") : t("income")}
        </span>
        {!isMobile && <ShortcutBadge shortcut={keyIndicators.income} ariaLabel="Shortcut I" />}
      </Button>
      <Button
        variant={value === "transfer" ? "darkBlue" : "ghost"}
        className="flex-1 gap-1 sm:gap-2 relative min-w-0 flex-col sm:flex-row"
        onClick={() => setValue("transfer")}
        type="button"
        aria-label={t("transfer")}
      >
        <ArrowLeftRightIcon className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs sm:text-sm">
          {isMobile ? t("transfer_short") : t("transfer")}
        </span>
        {!isMobile && <ShortcutBadge shortcut={keyIndicators.transfer} ariaLabel="Shortcut T" />}
      </Button>
    </div>
  );
}