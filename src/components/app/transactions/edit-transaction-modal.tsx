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
import { useTranslations, useLocale } from "next-intl";
import { useFetch, useMutation } from "@/hooks/use-api";
import CurrencySelect from "../currency-select";
import { type Wallet as WalletType } from "@/server/db/wallet";
import { type NewTransaction } from "@/server/db/transaction";
import LoadingButton from "@/components/loading-button";
import { LoadingSpinner } from "@/components/ui/loading";
import { DateTime } from "luxon";
type TransactionType = "income" | "expense" | "transfer";

interface EditTransactionModalProps {
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

export default function EditTransactionModal({
  open,
  onOpenChange,
  onSave,
  defaultTab = "expense",
}: EditTransactionModalProps) {
  const t = useTranslations("finances");
  const tService = useTranslations("service");
  const tGeneral = useTranslations("general");
  const tCategory = useTranslations("categories");
  const locale = useLocale();
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

  const { data: walletsData, isLoading: isLoadingWallets } = useFetch<WalletType[]>(open ? "/api/wallets" : null);

  const createTransaction = useMutation<any, NewTransaction>("/api/transactions", "POST");
  
  const sameWallet = selectedFirstWallet && selectedSecondWallet && selectedFirstWallet === selectedSecondWallet;
  const canSave = selectedFirstWallet && date && amount !== 0 && !sameWallet;
  
  const wallets = walletsData ?? [];
  const firstWallet = wallets.find((w) => w.id === selectedFirstWallet);
  const secondWallet = wallets.find((w) => w.id === selectedSecondWallet);
  
  const currencyData: Currency | undefined = firstWallet?.currency ? currencies(firstWallet.currency) : undefined;
  const toCurrencyCode = secondWallet?.currency;
  const fromCurrencyCode = firstWallet?.currency;
  
  const shouldFetchExchangeRate = open && transactionType === "transfer" && fromCurrencyCode && toCurrencyCode && fromCurrencyCode !== toCurrencyCode;
  const { data: exchangeRateData } = useFetch<{ rate: number; timestamp: number; isStale: boolean }>(shouldFetchExchangeRate ? `/api/wallets/exchange-rate?from=${fromCurrencyCode}&to=${toCurrencyCode}` : null);
  const { rate, timestamp, isStale } = exchangeRateData ?? { rate: 1, timestamp: 0, isStale: false };
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
          <div className="grid gap-3 w-full min-w-0">
            {!open ? null : (
              isLoadingWallets ? (
                <div className="p-4 flex justify-center items-center h-full">
                  <LoadingSpinner />
                </div>
              ) : wallets.length === 0 ? (
                <div className="p-4 bg-red-100 text-red-800 rounded-lg">{t("no_wallet_warning")}</div>
              ) : (
                <>
                  <TransactionTypeSelect
                    value={transactionType}
                    setValue={setTransactionType}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                    <div className="min-w-0">
                      <Label>{tGeneral("date")}</Label>
                      <DatePicker
                        value={date}
                        onChange={(value) => dispatch({ type: "set", field: "date", value })}
                        placeholder={tGeneral("select_date")}
                      />
                    </div>
                    <div className="min-w-0">
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
                  <CurrencySelect
                    wallets={wallets}
                    selectedCurrency={fromCurrencyCode}
                    label={transactionType === "transfer" ? tGeneral("from_wallet") : tGeneral("wallet")}
                    onSelect={(value) => dispatch({ type: "set", field: "selectedFirstWallet", value })}
                  />
                  {transactionType === "transfer" && selectedFirstWallet && selectedSecondWallet && rate !== 1 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md text-blue-700 text-sm font-medium">
                      <p>
                        {`1 ${fromCurrencyCode} = ${rate} ${toCurrencyCode}`}
                      </p>
                      {amount > 0 && (
                        <p>
                          {t("you_will_receive")}: {(amount * rate).toFixed(2)} {toCurrencyCode}
                        </p>
                      )}
                      {isStale && timestamp && (
                        <p className="text-xs text-blue-600 mt-1">
                          {t("last_updated")}: {DateTime.fromMillis(timestamp).setLocale(locale).toFormat("LLL dd, y 'at' HH:mm")}
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
                  <div className="min-w-0">
                    <Label>{tGeneral("description")}</Label>
                    <Input
                      placeholder={tGeneral("enter_description")}
                      value={description}
                      onChange={(e) => dispatch({ type: "set", field: "description", value: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  {transactionType !== "transfer" && (
                    <div className="min-w-0">
                      <Label>{tGeneral("category")}</Label>
                      <Select onValueChange={(value) => dispatch({ type: "set", field: "selectedCategory", value })}>
                        <SelectTrigger className="w-full">
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

                  <div className="min-w-0 w-full">
                    <Label>{tGeneral("notes")}</Label>
                    <AutogrowingTextarea placeholder={tGeneral("notes_description")} />
                  </div>
                </>
              )
            )}
          </div>
        </ModalBody>
        <ModalFooter className="flex flex-row justify-between items-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
            {tService("cancel")}
          </Button>
          {wallets.length > 0 && (
            <LoadingButton 
              onClick={addTransaction} 
              disabled={!canSave} 
              loading={createTransaction.isPending} 
              variant="success"
              className="flex-1 sm:flex-initial sm:min-w-28"
            >
              {tService("save")}
            </LoadingButton>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
