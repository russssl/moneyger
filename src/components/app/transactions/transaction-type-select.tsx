import { ArrowUpIcon, ArrowDownIcon, ArrowLeftRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type TransactionType = "income" | "expense" | "transfer";
export default function TransactionTypeSelect({ value, setValue }: { value: TransactionType, setValue: (value: TransactionType) => void }) {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={value === "expense" ? "destructive" : "ghost"}
        className="flex-1 gap-2"
        onClick={() => setValue("expense")}
      >
        <ArrowUpIcon className="h-4 w-4" />
      Expense
      </Button>
      <Button
        variant={value === "income" ? "success" : "ghost"}
        className="flex-1 gap-2"
        onClick={() => setValue("income")}
      >
        <ArrowDownIcon className="h-4 w-4" />                
      Income
      </Button>
      <Button
        variant={value === "transfer" ? "warning" : "ghost"}
        className="flex-1 gap-2"
        onClick={() => setValue("transfer")}
      >
        <ArrowLeftRightIcon className="h-4 w-4" />
      Transfer
      </Button>
    </div>

  );
}