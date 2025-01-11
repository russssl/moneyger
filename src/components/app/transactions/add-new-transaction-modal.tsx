import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "@/components/date-picker";
import { useState } from "react";
import AutogrowingTextarea from "@/components/autogrowing-textarea";
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftRightIcon } from "lucide-react";
import AmountPicker from "@/components/amount-picker";
type TransactionType = "income" | "expense" | "transfer";

interface AddNewTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddNewTransactionModal({ open, onOpenChange }: AddNewTransactionModalProps) {
  const [date, setDate] = useState<Date>();
  const [transactionType, setTransactionType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<number>(0);
  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Add New Transaction</CredenzaTitle>
          <CredenzaDescription>
            Fill in the details below to add a new transaction to your account.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="grid gap-6">
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button
                variant={transactionType === "expense" ? "default" : "ghost"}
                className="flex-1 gap-2"
                onClick={() => setTransactionType("expense")}
              >
                <ArrowUpIcon className="h-4 w-4" />
                Expense
              </Button>
              <Button
                variant={transactionType === "income" ? "default" : "ghost"}
                className="flex-1 gap-2"
                onClick={() => setTransactionType("income")}
              >
                <ArrowDownIcon className="h-4 w-4" />                
                Income
              </Button>
              <Button
                variant={transactionType === "transfer" ? "default" : "ghost"}
                className="flex-1 gap-2"
                onClick={() => setTransactionType("transfer")}
              >
                <ArrowLeftRightIcon className="h-4 w-4" />
                Transfer
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <DatePicker label="Date" value={date} onChange={setDate} />
              </div>
              <div className="space-y-2">
                <AmountPicker value={amount} onChange={setAmount} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                placeholder="Enter transaction description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food & Dining</SelectItem>
                  <SelectItem value="transport">Transportation</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <AutogrowingTextarea placeholder="Add any additional notes"/>
            </div>
          </div>
        </CredenzaBody>
        <CredenzaFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>
            Add Transaction
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
