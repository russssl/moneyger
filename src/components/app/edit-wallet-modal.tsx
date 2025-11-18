"use client";
import { useEffect, useMemo, useReducer, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";
import CurrencySelect from "../currency-select";
import { LoadingSpinner } from "../ui/loading";
import DeleteButton from "../ui/delete-button";
import { useFetch, useMutation } from "@/hooks/use-api";
import { toast } from "sonner";
import { type NewWallet, type Wallet } from "@/server/db/wallet";
import LoadingButton from "../loading-button";
import { useTranslations } from "next-intl";
import { ErrorAlert } from "../error-alert";

interface EditWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  id?: string;
  onDelete?: (id: string) => void;
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

function walletFormReducer(
  state: WalletFormState,
  action: WalletFormAction,
): WalletFormState {
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

export default function EditWalletModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  id,
}: EditWalletModalProps) {
  // Create mutations for wallet operations
  const t = useTranslations("finances");
  const createWallet = useMutation<any, NewWallet>("/api/wallets");
  const updateWallet = useMutation<any, Wallet>(`/api/wallets/${id}`);
  const {
    mutateAsync: deleteWallet,
    error: deleteError,
    isPending: deletionIsPending,
  } = useMutation<any, void>(`/api/wallets/${id}`, "DELETE");
  const [state, dispatch] = useReducer(walletFormReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: walletData } = useFetch<Wallet>(
    id ? `/api/wallets/${id}` : null,
  );
  useEffect(() => {
    if (open) {
      if (id && walletData) {
        dispatch({
          type: "RESET",
          payload: {
            walletName: walletData.name,
            currency: walletData.currency,
            balance: walletData.balance,
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

  const handleDeleteWallet = async (walletId: string) => {
    try {
      await deleteWallet({ id: walletId });
      onDelete?.(walletId);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting wallet:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSave) {
      return;
    }

    const payload = {
      name: state.walletName,
      currency: state.currency,
      ...(id ? {} : { balance: state.balance ?? undefined }),
    };

    try {
      if (id) {
        toast.promise(updateWallet.mutateAsync({ ...payload, id }), {
          loading: t("updating_wallet"),
          success: t("wallet_updated_successfully"),
          error: (error) =>
            error instanceof Error
              ? error.message
              : t("failed_to_update_wallet"),
        });
      } else {
        toast.promise(
          createWallet.mutateAsync({ ...payload, balance: state.balance ?? 0 }),
          {
            loading: t("creating_wallet"),
            success: t("wallet_created_successfully"),
            error: (error) =>
              error instanceof Error
                ? error.message
                : t("failed_to_create_wallet"),
          },
        );
      }
      onSave();
      onOpenChange(false);
    } catch (error) {
      // Error is already handled by toast.promise
      console.error("Error saving wallet:", error);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{id ? t("edit_wallet") : t("create_wallet")}</ModalTitle>
        </ModalHeader>
        {!isInitialized ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
            <div className="flex flex-col gap-2">
              {deleteError && (
                <ErrorAlert
                  error={
                    deleteError instanceof Error
                      ? deleteError.message
                      : typeof deleteError === "string"
                        ? deleteError
                        : "Unknown error occurred"
                  }
                />
              )}
              <Label htmlFor="wallet-name">{t("wallet_name")}</Label>
              <Input
                id="wallet-name"
                placeholder={t("wallet_name")}
                value={state.walletName}
                onChange={(e) =>
                  dispatch({ type: "SET_WALLET_NAME", payload: e.target.value })
                }
                required
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <CurrencySelect
                selectedCurrency={state.currency}
                setSelectedCurrency={(currency) =>
                  dispatch({ type: "SET_CURRENCY", payload: currency ?? "" })
                }
              />
            </div>
            {!id && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="initial-balance">
                  {t("wallet_initial_balance")}
                </Label>
                <Input
                  id="initial-balance"
                  placeholder={t("wallet_initial_balance")}
                  type="number"
                  value={state.balance ?? ""}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_BALANCE",
                      payload: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            )}

            {id ? (
              <div className="mt-4 flex flex-row items-center justify-between gap-3">
                {onDelete && (
                  <DeleteButton
                    onClick={() => handleDeleteWallet(id)}
                    disabled={deletionIsPending}
                  />
                )}
                <Button
                  type="submit"
                  disabled={!canSave || updateWallet.isPending}
                  className="ml-auto sm:min-w-28"
                >
                  Update
                </Button>
              </div>
            ) : (
              <LoadingButton
                type="submit"
                loading={createWallet.isPending}
                disabled={!canSave || createWallet.isPending}
                className="mt-4 w-full sm:w-auto sm:min-w-28 sm:self-end"
              >
                Create
              </LoadingButton>
            )}
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
