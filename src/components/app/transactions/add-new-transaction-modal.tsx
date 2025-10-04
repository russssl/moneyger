import {
  Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle,
} from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "@/components/date-picker";
import { useReducer, useEffect } from "react";
import AutogrowingTextarea from "@/components/autogrowing-textarea";
import { currencies, type Currency } from "@/hooks/currencies";
import AddonInput from "@/components/AddonInput";
import TransactionTypeSelect from "./transaction-type-select";
import { useTranslations } from "next-intl";
import { useFetch, useMutation } from "@/hooks/use-api";
import CurrencySelect from "../currency-select";

type TransactionType = "income" | "expense" | "transfer";

interface AddNewTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: any) => void;
  defaultTab?: TransactionType;
}

type State = {
  date?: Date;
  transactionType: TransactionType;
  amount: number;
  description: string;
  selectedFirstWallet?: string;
  selectedSecondWallet?: string;
  selectedCategory?: string;
};

type Action =
  | { type: "reset"; payload: TransactionType }
  | { type: "set"; field: keyof State; value: any };

const initialState = (defaultTab: TransactionType): State => ({
  date: undefined,
  transactionType: defaultTab,
  amount: 0,
  description: "",
  selectedFirstWallet: undefined,
  selectedSecondWallet: undefined,
  selectedCategory: undefined,
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
  case "reset":
    return initialState(action.payload);
  case "set":
    return { ...state, [action.field]: action.value };
  default:
    return state;
  }
}

export default function AddNewTransactionModal({
  open,
  onOpenChange,
  onSave,
  defaultTab = "expense",
}: AddNewTransactionModalProps) {
  const t = useTranslations("finances");
  const tService = useTranslations("service");
  const tGeneral = useTranslations("general");
  const tCategory = useTranslations("categories");
  const [state, dispatch] = useReducer(reducer, initialState(defaultTab));
  const {
    date,
    transactionType,
    amount,
    description,
    selectedFirstWallet,
    selectedSecondWallet,
    selectedCategory,
  } = state;

  const { data: walletsData, isLoading: isLoadingWallets } = useFetch<{id: string, name: string, currency: string}[]>(open ? "/api/wallets" : null);

  const createTransaction = useMutation<{walletId: string, toWalletId: string | undefined, amount: number, transaction_date: Date, description: string, category: string, type: TransactionType}, any>("/api/transactions", "POST");
  
  const sameWallet = selectedFirstWallet && selectedSecondWallet && selectedFirstWallet === selectedSecondWallet;
  const canSave = selectedFirstWallet && date && amount !== 0 && !sameWallet;
  
  const wallets = walletsData ?? [];
  const firstWallet = wallets.find((w) => w.id === selectedFirstWallet);
  const secondWallet = wallets.find((w) => w.id === selectedSecondWallet);
  
  const currencyData: Currency | undefined = firstWallet?.currency ? currencies(firstWallet.currency) : undefined;
  const toCurrencyCode = secondWallet?.currency;
  const fromCurrencyCode = firstWallet?.currency;
  
  const shouldFetchExchangeRate = open && transactionType === "transfer" && fromCurrencyCode && toCurrencyCode && fromCurrencyCode !== toCurrencyCode;
  const { data: exchangeRateData } = useFetch<number>(shouldFetchExchangeRate ? `/api/wallets/exchange-rate?from=${fromCurrencyCode}&to=${toCurrencyCode}` : null);
  const exchangeRate = exchangeRateData ?? 1;

  useEffect(() => {
    if (!open) {
      dispatch({ type: "reset", payload: defaultTab });
    }
  }, [open, defaultTab]);

  const addTransaction = () => {
    if (!selectedFirstWallet || !date) return;

    createTransaction.mutate(
      {
        walletId: selectedFirstWallet,
        toWalletId: transactionType === "transfer" ? selectedSecondWallet : undefined,
        amount,
        transaction_date: date,
        description,
        category: transactionType === "transfer" ? "Transfer" : selectedCategory ?? "other",
        type: transactionType,
      },
      {
        onSuccess: (result) => {
          onSave(result);
          onOpenChange(false);
        },
      }
    );
  };

  const setTransactionType = (value: TransactionType) => {
    dispatch({ type: "set", field: "transactionType", value });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keyToType: Record<string, TransactionType> = {
      e: "expense",
      i: "income",
      t: "transfer",
    };

    const pressedKey = event.key.toLowerCase();
    // Only trigger if the event target is not an input, textarea, or contenteditable element
    const target = event.target as HTMLElement;
    const isInputLike =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;

    if (!isInputLike && keyToType[pressedKey]) {
      setTransactionType(keyToType[pressedKey]);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent onKeyDown={handleKeyDown}>
        <ModalHeader>
          <ModalTitle>{t("add_transaction")}</ModalTitle>
          <ModalDescription>{t("transaction_description")}</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="grid gap-3">
            {wallets.length === 0 && !isLoadingWallets && open && (
              <div className="p-4 bg-red-100 text-red-800 rounded-lg">{t("no_wallet_warning")}</div>
            )}

            <TransactionTypeSelect
              value={transactionType}
              setValue={setTransactionType}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{tGeneral("date")}</Label>
                <DatePicker
                  value={date}
                  onChange={(value) => dispatch({ type: "set", field: "date", value })}
                  placeholder={tGeneral("select_date")}
                />
              </div>
              <div>
                <Label>{tGeneral("amount")}</Label>
                <AddonInput
                  value={amount}
                  setValue={(value) => dispatch({ type: "set", field: "amount", value: Number(value) })}
                  addonText={currencyData?.symbol}
                  type="number"
                  placeholder={tGeneral("enter_amount")}
                />
              </div>
            </div>

            {wallets.length > 0 && (
              <CurrencySelect
                wallets={wallets}
                selectedCurrency={fromCurrencyCode}
                label={transactionType === "transfer" ? tGeneral("from_wallet") : tGeneral("wallet")}
                onSelect={(value) => dispatch({ type: "set", field: "selectedFirstWallet", value })}
              />
            )}

            {transactionType === "transfer" && selectedFirstWallet && selectedSecondWallet && exchangeRate !== 1 && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md text-blue-700 text-sm font-medium">
                <p>
                  1 {fromCurrencyCode} = {exchangeRate} {toCurrencyCode}
                </p>
                {amount > 0 && (
                  <p>
                    {t("you_will_receive")}: {(amount * exchangeRate).toFixed(2)} {toCurrencyCode}
                  </p>
                )}
              </div>
            )}

            {transactionType === "transfer" && (
              <CurrencySelect
                wallets={wallets}
                selectedCurrency={toCurrencyCode}
                label={tGeneral("to_wallet")}
                onSelect={(value) => dispatch({ type: "set", field: "selectedSecondWallet", value })}
              />
            )}

            {sameWallet && transactionType === "transfer" && (
              <div className="p-2 bg-yellow-50 text-yellow-800 rounded-md text-sm font-medium">
                {t("same_wallet_warning")}
              </div>
            )}

            <div>
              <Label>{tGeneral("description")}</Label>
              <Input
                placeholder={tGeneral("enter_description")}
                value={description}
                onChange={(e) => dispatch({ type: "set", field: "description", value: e.target.value })}
              />
            </div>

            {transactionType !== "transfer" && (
              <div>
                <Label>{tGeneral("category")}</Label>
                <Select onValueChange={(value) => dispatch({ type: "set", field: "selectedCategory", value })}>
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
            )}

            <div>
              <Label>{tGeneral("notes")}</Label>
              <AutogrowingTextarea placeholder={tGeneral("notes_description")} />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tService("cancel")}
          </Button>
          <Button onClick={addTransaction} disabled={!canSave} variant="success">
            {tService("save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
