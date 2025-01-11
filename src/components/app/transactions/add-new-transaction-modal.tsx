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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowDownIcon, ArrowUpIcon, ArrowLeftRightIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import AutogrowingTextarea from "@/components/autogrowing-textarea";

type TransactionType = "income" | "expense" | "transfer";

interface AddNewTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddNewTransactionModal({ open, onOpenChange }: AddNewTransactionModalProps) {
  const [date, setDate] = useState<Date>();
  const [transactionType, setTransactionType] = useState<TransactionType>("expense");

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
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="text-right"
                />
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
