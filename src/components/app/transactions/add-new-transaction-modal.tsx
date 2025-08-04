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
import { api } from "@/trpc/react";
import { currencies, type Currency } from "@/hooks/currencies";
import AddonInput from "@/components/AddonInput";
import TransactionTypeSelect from "./transaction-type-select";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

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

  const { data: walletsData } = api.wallets.getWallets.useQuery(undefined, { enabled: open });
  const createTransaction = api.transactions.createTransaction.useMutation();

  const sameWallet = selectedFirstWallet && selectedSecondWallet && selectedFirstWallet === selectedSecondWallet;
  const canSave = selectedFirstWallet && date && amount !== 0 && !sameWallet;

  const wallets = walletsData ?? [];
  const firstWallet = wallets.find((w) => w.id === selectedFirstWallet);
  const secondWallet = wallets.find((w) => w.id === selectedSecondWallet);

  const currencyData: Currency | undefined = firstWallet?.currency ? currencies(firstWallet.currency) : undefined;
  const toCurrencyCode = secondWallet?.currency;

  const currencyQueryEnabled = selectedFirstWallet !== undefined && selectedSecondWallet !== undefined;
  const { data: exchangeRate = 1 } = api.wallets.getExchangeRate.useQuery(
    { from: firstWallet?.currency ?? "", to: secondWallet?.currency ?? "" },
    { enabled: currencyQueryEnabled }
  );

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

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{t("add_transaction")}</ModalTitle>
          <ModalDescription>{t("transaction_description")}</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="grid gap-3">
            {wallets.length === 0 && (
              <div className="p-4 bg-red-100 text-red-800 rounded-lg">{t("no_wallet_warning")}</div>
            )}

            <TransactionTypeSelect
              value={transactionType}
              setValue={(value) => dispatch({ type: "set", field: "transactionType", value })}
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
              <div>
                <Label>
                  {transactionType === "transfer" ? tGeneral("from_wallet") : tGeneral("wallet")}
                </Label>
                <div className="flex rounded-lg shadow-xs">
                  <Select onValueChange={(value) => dispatch({ type: "set", field: "selectedFirstWallet", value })}>
                    <SelectTrigger className={cn("shadow-none", currencyData ? "rounded-e-none" : "rounded")}>
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
                  {currencyData && (
                    <span className="border-input bg-background text-muted-foreground inline-flex items-center rounded-e-lg border px-3 text-sm">
                      {currencyData.symbol}
                    </span>
                  )}
                </div>
              </div>
            )}

            {transactionType === "transfer" && selectedFirstWallet && selectedSecondWallet && exchangeRate !== 1 && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md text-blue-700 text-sm font-medium">
                <p>
                  1 {currencyData?.code} = {exchangeRate} {toCurrencyCode}
                </p>
                {amount > 0 && (
                  <p>
                    {t("you_will_receive")}: {(amount * exchangeRate).toFixed(2)} {toCurrencyCode}
                  </p>
                )}
              </div>
            )}

            {transactionType === "transfer" && (
              <div>
                <Label>{tGeneral("to_wallet")}</Label>
                <div className="flex rounded-lg shadow-xs">
                  <Select onValueChange={(value) => dispatch({ type: "set", field: "selectedSecondWallet", value })}>
                    <SelectTrigger className={cn("shadow-none", currencyData ? "rounded-e-none" : "rounded")}>
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
                  {toCurrencyCode && (
                    <span className="border-input bg-background text-muted-foreground inline-flex items-center rounded-e-lg border px-3 text-sm">
                      {currencies(toCurrencyCode)?.symbol}
                    </span>
                  )}
                </div>
              </div>
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
