import { ArrowUpIcon, ArrowDownIcon, ArrowLeftRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type TransactionType = "income" | "expense" | "transfer";
export default function TransactionTypeSelect({ value, setValue }: { value: TransactionType, setValue: (value: TransactionType) => void }) {
  const t = useTranslations("general");
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={value === "expense" ? "destructive" : "ghost"}
        className="flex-1 gap-2"
        onClick={() => setValue("expense")}
      >
        <ArrowUpIcon className="h-4 w-4" />
        {t("expense")}
      </Button>
      <Button
        variant={value === "income" ? "success" : "ghost"}
        className="flex-1 gap-2"
        onClick={() => setValue("income")}
      >
        <ArrowDownIcon className="h-4 w-4" />                
        {t("income")}
      </Button>
      <Button
        variant={value === "transfer" ? "warning" : "ghost"}
        className="flex-1 gap-2"
        onClick={() => setValue("transfer")}
      >
        <ArrowLeftRightIcon className="h-4 w-4" />
        {t("transfer")}
      </Button>
    </div>

  );
}