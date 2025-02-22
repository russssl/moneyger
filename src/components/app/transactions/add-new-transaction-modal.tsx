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
import { api } from "@/trpc/react";
import { useEffect } from "react";
import {currencies, type Currency} from "@/hooks/currencies";
import AddonInput from "@/components/AddonInput";
import TransactionTypeSelect from "./transaction-type-select";
type TransactionType = "income" | "expense" | "transfer";

interface AddNewTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: any) => void;
  defaultTab?: "income" | "expense" | "transfer";
}

export default function AddNewTransactionModal({ open, onOpenChange, onSave, defaultTab = "expense" }: AddNewTransactionModalProps) {

  const [date, setDate] = useState<Date>();
  const [transactionType, setTransactionType] = useState<TransactionType>(defaultTab);
  const [amount, setAmount] = useState<number>(0);
  const [wallets, setWallets] = useState<any[]>([]);

  const [selectedFirstWallet, setSelectedWallet] = useState<string>();
  const [selectedSecondWallet, setSelectedSecondWallet] = useState<string>();

  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [currencyData, setCurrencyData] = useState<Currency | undefined>(undefined);
  const [description, setDescription] = useState<string>("");

  const updateTransactionMutation = api.transactions.updateTransaction.useMutation();
  const canSave = selectedFirstWallet && date && selectedCategory && amount !== 0;
  
  const { data: walletsData } = api.wallets.getWallets.useQuery(undefined, { enabled: open,});
  useEffect(() => {
    if (walletsData) {
      setWallets(walletsData);
    }
  }, [walletsData]);
  
  useEffect(() => {
    if (!open) {
      setSelectedWallet(undefined);
      setCurrencyData(undefined);
      setAmount(0);
      setDate(undefined);
      setDescription("");
    }
  }, [open]);

  function addTransaction() {
    if (!selectedFirstWallet || !date || !selectedCategory) {
      return;
    }

    updateTransactionMutation.mutate({
      walletId: selectedFirstWallet,
      amount: amount,
      transaction_date: date,
      description: description,
      category: selectedCategory,
      type: transactionType,
    }, {
      onSuccess: (result) => {
        onSave(result);
        onOpenChange(false);
      },
    });
  }

  function selectWalletAndSetCurrency(walletId: string) {
    setSelectedWallet(walletId);
    const curr: string | null = wallets.find((wallet) => wallet.id === walletId).currency;
    setCurrencyData(currencies(curr));
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Add New Transaction</CredenzaTitle>
          <CredenzaDescription>
            Fill in the details below to add a new transaction.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="grid gap-3">
            {wallets.length === 0 && (
              <div className="p-4 bg-red-100 text-red-800 rounded-lg">
                You need to create a wallet before you can add a transaction.
              </div>
            )}
            <TransactionTypeSelect value={transactionType} setValue={setTransactionType} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <DatePicker label="Date" value={date} onChange={setDate} />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <AddonInput 
                  value={amount}
                  setValue={(value) => setAmount(Number(value))}
                  addonText={currencyData?.symbol}
                  type="number"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            { wallets.length > 0 ? <div>
              <Label htmlFor="wallet">
                {transactionType === "transfer" ? "From Wallet" : "Wallet"}
              </Label>
              <Select onValueChange={(value) => selectWalletAndSetCurrency(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> : null }

            { wallets.length > 0 && transactionType == "transfer" ? <div>
              <Label htmlFor="wallet">To Wallet</Label>
              <Select onValueChange={(value) => setSelectedSecondWallet(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> : null }

            <div>
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                placeholder="Enter transaction description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setSelectedCategory(value)}>
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

            <div>
              <Label htmlFor="notes">Notes</Label>
              <AutogrowingTextarea placeholder="Add any additional notes"/>
            </div>
          </div>
        </CredenzaBody>
        <CredenzaFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => addTransaction()} disabled={!canSave}>
            Add Transaction
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
