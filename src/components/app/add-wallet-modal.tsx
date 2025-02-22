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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectContent,
  SelectItem,
  SelectLabel,
} from "../ui/select";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingButton from "../loading-button";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "../ui/loading";
import { Input } from "../ui/input";
import { currencies } from "@/hooks/currencies";

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
  const { data: session } = useSession();
  const [currency, setCurrency] = useState("");
  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState<number | null>(null);

  const currencyOptions = currencies();
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
    setInitialBalance(res.initialBalance || null);
    setWalletName(res.name || "")
  }, [res]);

  if (!session) {
    return null;
  }

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
            <CredenzaTitle>{id ? "Edit" : "Add new"} wallet</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody>
            {id && !res ? (
              <div className="flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <Label>Wallet Name</Label>
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
                  <Label>Initial Balance</Label>
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
                  <Label className="mb-1">Currency</Label>
                  {currencyOptions.length > 0 ? (
                    <Select
                      onValueChange={(v) => {
                        console.log("Selected currency:", v);
                        setCurrency(v);
                      }}
                      value={currency}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Currency</SelectLabel>
                          {currencyOptions.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                </div>
                <CredenzaFooter>
                  <div className="flex mt-3">
                    <Button
                      type="button"
                      className="me-3"
                      onClick={() => onOpenChange(false)}
                    >
                      Close
                    </Button>
                    <LoadingButton
                      loading={saveWalletMutation.isPending}
                      type="submit"
                      disabled={isDataLoading || !walletName || !currency}
                    >
                      Save
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
