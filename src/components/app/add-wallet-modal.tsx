"use client";
import { useEffect, useMemo, useReducer, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";
import { api } from "@/trpc/react";
import CurrencySelect from "../currency-select";
import { LoadingSpinner } from "../ui/loading";
import DeleteButton from "../ui/delete-button";

interface WalletFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (wallet: any) => void;
  id?: string;
  onDelete: () => void;
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
  | { type: "RESET"; payload: WalletFormState };

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
  case "RESET":
    return { ...action.payload };
  default:
    return state;
  }
}

export default function AddNewWalletModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  id,
}: WalletFormModalProps) {
  const createWallet = api.wallets.createWallet.useMutation();
  const updateWallet = api.wallets.updateWallet.useMutation();
  const deleteWallet = api.wallets.deleteWallet.useMutation();

  const { data: walletData } = api.wallets.getWalletById.useQuery(
    { id: id ?? null },
    { enabled: !!id }
  );
  // Initialize form state, updating when walletData or open changes
  const [state, dispatch] = useReducer(walletFormReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (open) {
      if (id && walletData) {
        dispatch({
          type: "RESET",
          payload: {
            walletName: walletData.name ?? "",
            currency: walletData.currency ?? "",
            balance: walletData.balance ?? null,
          },
        });
        setIsInitialized(true);
      } else if (id && !walletData) {
        // edit mode but data not yet loaded
        setIsInitialized(false);
      } else if (!id) {
        // Reset to initial state when creating a new wallet
        dispatch({
          type: "RESET",
          payload: {
            walletName: "",
            currency: "",
            balance: null,
          },
        });
        setIsInitialized(true);
      }
    }
    // Only run when modal is opened, id changes, or walletData changes
  }, [open, id, walletData]);

  const canSave = useMemo(() => {
    const hasValidName = state.walletName.trim().length > 0;
    const hasValidCurrency = state.currency.length > 0;
    return hasValidName && hasValidCurrency;
  }, [state.walletName, state.currency]);

  const handleDeleteWallet = async (id: string) => {
    await deleteWallet.mutateAsync({ id });
    onDelete();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: state.walletName,
      currency: state.currency,
      ...(id ? {} : { balance: state.balance ?? undefined }),
    };

    try {
      if (!canSave) {
        return;
      }

      const result = id
        ? await updateWallet.mutateAsync({ ...payload, id })
        : await createWallet.mutateAsync(payload);

      onSave(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving wallet:", error);
    }
  };

  const handleModalClose = () => {
    onOpenChange(false);
    // Do not reset state here; let useEffect handle it on open
  };

  return (
    <Modal open={open} onOpenChange={handleModalClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{id ? "Edit Wallet" : "Create Wallet"}</ModalTitle>
        </ModalHeader>
        {!isInitialized ? 
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner />
          </div>
          : <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            {!id && (
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

            {id ? (
              <div className="flex flex-col md:flex-row gap-3 sm:flex-row sm:items-center sm:justify-between mt-2 mb-2">
                <Button
                  type="submit"
                  disabled={!canSave || createWallet.isPending || updateWallet.isPending}
                  className="w-full md:w-28 order-1 md:order-2"
                >
                  Update
                </Button>
                <DeleteButton
                  onClick={() => handleDeleteWallet(id)}
                />
              </div>
            ) : (
              <Button
                type="submit"
                disabled={!canSave || createWallet.isPending || updateWallet.isPending}
                className="w-full sm:w-28 self-end"
              >
                Create
              </Button>
            )}
          </form>}
      </ModalContent>
    </Modal>
  );
}
