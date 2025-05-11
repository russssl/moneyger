"use client";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Label } from "../ui/label";
import React, { useState, useEffect } from "react";
import LoadingButton from "../loading-button";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "../ui/loading";
import { Input } from "../ui/input";
import { useTranslations } from "next-intl";
import CurrencySelect from "../currency-select";

export default function AddNewWalletModal({
  className,
  open,
  onOpenChange,
  id,
  onSave,
}: {
  className?: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id?: string | null;
  onSave: (wallet: any) => void;
}) {
  const [currency, setCurrency] = useState("");
  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const saveWalletMutation = api.wallets.createWallet.useMutation();
  const updateWalletMutation = api.wallets.updateWallet.useMutation();

  const t = useTranslations("finances");
  const tService = useTranslations("service");
  const tGeneral = useTranslations("general");
  const { data: res, isLoading: isDataLoading } = api.wallets.getWalletById.useQuery(
    { id: id || null },
    {
      enabled: open && !!id,
    }
  );

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  useEffect(() => {
    setWalletName("");
    setCurrency("");
    setInitialBalance(null);
  }  , [open]);
  
  useEffect(() => {
    if (saveWalletMutation.isPending || updateWalletMutation.isPending) {
      setSaving(true);
    } else {
      setSaving(false);
    }
  }, [saveWalletMutation.isPending, updateWalletMutation.isPending]);

  useEffect(() => {
    if (!res) {
      return;
    }
    setCurrency(res.currency || "");
    setInitialBalance(res.balance);
    setWalletName(res.name || "")
  }, [res]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id) {
      updateWalletMutation.mutate(
        {
          id,
          name: walletName,
          currency,
        },
        {
          onSuccess: (result) => {
            onSave(result);
            onOpenChange(false);
          },
        }
      );
    } else {
      saveWalletMutation.mutate(
        {
          name: walletName,
          initialBalance: initialBalance || undefined,
          currency,
        },
        {
          onSuccess: (result) => {
            onSave(result);
            onOpenChange(false);
          },
        }
      );
    }
  };
  return (
    <div className={className}>
      <Modal open={open} onOpenChange={handleOpenChange}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{id ? tService("edit") : tService("add")} {tGeneral("wallet")}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {id && !res ? (
              <div className="flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <Label>{t("wallet_name")}</Label>
                  <Input
                    placeholder="Main Wallet"
                    className="mt-1"
                    value={walletName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWalletName(e.target.value)
                    }
                  />
                </div>
                <div className="mb-4">
                  <Label>{t("wallet_initial_balance")}</Label>
                  <Input
                    placeholder="5000"
                    className="mt-1"
                    type="number"
                    value={initialBalance?.toString() || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setInitialBalance(parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="mb-4">
                  <CurrencySelect
                    selectedCurrency={currency}
                    setSelectedCurrency={(value) => {
                      if (!value) {
                        return;
                      }
                      setCurrency(value);
                    }}
                  />
                </div>
                <ModalFooter>
                  <div className="flex justify-end mt-3">
                    <Button
                      type="button"
                      className="me-3"
                      onClick={() => onOpenChange(false)}
                    >
                      {tService("cancel")}
                    </Button>
                    <LoadingButton
                      loading={saving}
                      type="submit"
                      disabled={isDataLoading || !walletName || !currency}
                      variant="success"
                    >
                      {tService("save")}
                    </LoadingButton>
                  </div>
                </ModalFooter>
              </form>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
