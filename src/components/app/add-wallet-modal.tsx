"use client";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
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
  }
  , [open]);
  
  useEffect(() => {
    if (!res) {
      return;
    }
    setCurrency(res.currency || "");
    setInitialBalance(res.initialBalance);
    setWalletName(res.name || "")
  }, [res]);


  const saveWalletMutation = api.wallets.updateWallet.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveWalletMutation.mutate(
      {
        name: walletName,
        initialBalance: initialBalance || undefined,
        currency,
        id: id || undefined,
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
    <div className={className}>
      <Credenza open={open} onOpenChange={handleOpenChange}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>{id ? tService("edit") : tService("add")} {tGeneral("wallet")}</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody>
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
                <CredenzaFooter>
                  <div className="flex justify-end mt-3">
                    <Button
                      type="button"
                      className="me-3"
                      onClick={() => onOpenChange(false)}
                    >
                      {tService("cancel")}
                    </Button>
                    <LoadingButton
                      loading={saveWalletMutation.isPending}
                      type="submit"
                      disabled={isDataLoading || !walletName || !currency}
                      variant="success"
                    >
                      {tService("save")}
                    </LoadingButton>
                  </div>
                </CredenzaFooter>
              </form>
            )}
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </div>
  );
}
