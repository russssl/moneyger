"use client";
import { useMemo, useReducer } from "react";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";
import { api } from "@/trpc/react";
import CurrencySelect from "../currency-select";
interface WalletFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (wallet: any) => void;
  isEditing?: boolean;
  id?: string;
  walletName?: string;
  currency?: string;
  initialBalance?: number;
  isSavingAccount?: boolean;
  savingAccountGoal?: number;
}

type WalletFormState = {
  walletName: string;
  currency: string;
  balance: number | null;
};

type WalletFormAction =
  | { type: "SET_WALLET_NAME"; payload: string }
  | { type: "SET_CURRENCY"; payload: string }
  | { type: "SET_BALANCE"; payload: number | null }

const initialState: WalletFormState = {
  walletName: "",
  currency: "",
  balance: null,
};

function walletFormReducer(state: WalletFormState, action: WalletFormAction): WalletFormState {
  switch (action.type) {
  case "SET_WALLET_NAME":
    return { ...state, walletName: action.payload };
  case "SET_CURRENCY":
    return { ...state, currency: action.payload };
  case "SET_BALANCE":
    return { ...state, balance: action.payload };
  default:
    return state;
  }
}

export default function AddNewWalletModal({
  open,
  onOpenChange,
  onSave,
  isEditing = false,
  id,
  walletName: initialName = "",
  currency: initialCurrency = "",
  initialBalance,
}: WalletFormModalProps) {
  const createWallet = api.wallets.createWallet.useMutation();
  const updateWallet = api.wallets.updateWallet.useMutation();

  const [state, dispatch] = useReducer(walletFormReducer, {
    ...initialState,
    walletName: initialName,
    currency: initialCurrency,
    balance: initialBalance ?? null,
  });

  const canSave = useMemo(() => {
    const hasValidName = state.walletName.trim().length > 0;
    const hasValidCurrency = state.currency.length > 0;
    return hasValidName && hasValidCurrency;
  }, [state.walletName, state.currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: state.walletName,
      currency: state.currency,
      ...(isEditing ? {} : { initialBalance: state.balance ?? undefined }),
    };

    try {
      if (!canSave) {
        return;
      }

      const result = isEditing
        ? await updateWallet.mutateAsync({ ...payload, id: id! })
        : await createWallet.mutateAsync(payload);

      onSave(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving wallet:", error);
    }
  };

  const handleModalClose = () => {
    onOpenChange(false);
    dispatch({ type: "SET_WALLET_NAME", payload: "" });
    dispatch({ type: "SET_CURRENCY", payload: "" });
    dispatch({ type: "SET_BALANCE", payload: null });
  }

  return (
    <Modal open={open} onOpenChange={handleModalClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{isEditing ? "Edit Wallet" : "Create Wallet"}</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Label htmlFor="wallet-name">Wallet Name</Label>
          <Input
            id="wallet-name"
            placeholder="Wallet Name"
            value={state.walletName}
            onChange={(e) => dispatch({ type: "SET_WALLET_NAME", payload: e.target.value })}
            required
          />
          <CurrencySelect
            selectedCurrency={state.currency}
            setSelectedCurrency={(currency) =>
              dispatch({ type: "SET_CURRENCY", payload: currency ?? "" })
            }
          />
          {!isEditing && (
            <>
              <Label htmlFor="initial-balance">Initial Balance</Label>
              <Input
                id="initial-balance"
                placeholder="Initial Balance"
                type="number"
                value={state.balance ?? ""}
                onChange={(e) => dispatch({ type: "SET_BALANCE", payload: parseFloat(e.target.value) })}
              />
            </>
          )}

          <Button type="submit" disabled={!canSave || createWallet.isPending || updateWallet.isPending}>
            {isEditing ? "Update" : "Create"}
          </Button>
        </form>
      </ModalContent>
    </Modal>
  );
}
