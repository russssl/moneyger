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
import { useTranslations } from "next-intl";
type TransactionType = "income" | "expense" | "transfer";

interface AddNewTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: any) => void;
  defaultTab?: "income" | "expense" | "transfer";
}

export default function AddNewTransactionModal({ open, onOpenChange, onSave, defaultTab = "expense" }: AddNewTransactionModalProps) {

  const t = useTranslations("finances")
  const tService = useTranslations("service")
  const tGeneral = useTranslations("general")
  const tCategory = useTranslations("categories")

  const [date, setDate] = useState<Date>();
  const [transactionType, setTransactionType] = useState<TransactionType>(defaultTab);
  const [amount, setAmount] = useState<number>(0);
  const [wallets, setWallets] = useState<any[]>([]);

  const [selectedFirstWallet, setSelectedWallet] = useState<string>();
  const [selectedSecondWallet, setSelectedSecondWallet] = useState<string>();

  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [currencyData, setCurrencyData] = useState<Currency | undefined>(undefined);
  const [description, setDescription] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [toCurrencyCode, setToCurrencyCode] = useState<string | null>(null);
  const updateTransactionMutation = api.transactions.updateTransaction.useMutation();
  const canSave = selectedFirstWallet && date && selectedCategory && amount !== 0;
  
  const { data: walletsData } = api.wallets.getWallets.useQuery(undefined, { enabled: open,});

  const currencyConversionRateQueryEnabled = selectedFirstWallet !== undefined && selectedSecondWallet !== undefined;
  const {data: currency_conversion_res} = api.transactions.getCurrentExchangeRate.useQuery({
    from: selectedFirstWallet!,
    to: selectedSecondWallet!,
  }, { enabled: currencyConversionRateQueryEnabled });

  useEffect(() => {
    if (walletsData) {
      setWallets(walletsData);
    }
  }, [walletsData]);
  
  useEffect(() => {
    if (currency_conversion_res) {
      setExchangeRate(currency_conversion_res);
      const walletCurrency: string = wallets.find((wallet) => wallet.id === selectedSecondWallet)?.currency || "";
      setToCurrencyCode(walletCurrency)
    }
  }, [currency_conversion_res, selectedSecondWallet, wallets]);

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
          <CredenzaTitle>{t("add_transaction")}</CredenzaTitle>
          <CredenzaDescription>
            {t("transaction_description")}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="grid gap-3">
            {wallets.length === 0 && (
              <div className="p-4 bg-red-100 text-red-800 rounded-lg">
                {t("no_wallet_warning")}
              </div>
            )}
            <TransactionTypeSelect value={transactionType} setValue={setTransactionType} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">{tGeneral("date")}</Label>
                <DatePicker value={date} onChange={setDate} placeholder={tGeneral("select_date")}/>
              </div>
              <div>
                <Label htmlFor="amount">{tGeneral("amount")}</Label>
                <AddonInput 
                  value={amount}
                  setValue={(value) => setAmount(Number(value))}
                  addonText={currencyData?.symbol}
                  type="number"
                  placeholder={tGeneral("enter_amount")}
                />
              </div>
            </div>
            {wallets.length > 0 ? <div>
              <Label htmlFor="wallet">
                {transactionType === "transfer" ? tGeneral("from_wallet") : tGeneral("wallet")}
              </Label>
              <Select onValueChange={(value) => selectWalletAndSetCurrency(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={tGeneral("select_wallet")} />
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
            
            {exchangeRate !== 1 && transactionType === "transfer" && selectedFirstWallet && selectedSecondWallet && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {"1 " + currencyData?.code + " = " + exchangeRate + " " + toCurrencyCode}
                </p>
              </div>
            )}

            {wallets.length > 0 && transactionType == "transfer" ? <div>
              <Label htmlFor="wallet">{tGeneral("to_wallet")}</Label>
              <Select onValueChange={(value) => setSelectedSecondWallet(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={tGeneral("select_wallet")} />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> : null}

            <div>
              <Label htmlFor="description">{tGeneral("description")}</Label>
              <Input 
                id="description" 
                placeholder={tGeneral("enter_description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">{tGeneral("category")}</Label>
              <Select onValueChange={(value) => setSelectedCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={tGeneral("select_category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">{tCategory("food_and_dining")}</SelectItem>
                  <SelectItem value="transport">{tCategory("transportation")}</SelectItem>
                  <SelectItem value="utilities">{tCategory("utilities")}</SelectItem>
                  <SelectItem value="entertainment">{tCategory("entertainment")}</SelectItem>
                  <SelectItem value="other">{tCategory("other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">{tGeneral("notes")}</Label>
              <AutogrowingTextarea placeholder={tGeneral("notes_description")}/>
            </div>
          </div>
        </CredenzaBody>
        <CredenzaFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tService("cancel")}
          </Button>
          <Button onClick={() => addTransaction()} disabled={!canSave} variant="success">
            {tService("save")}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
