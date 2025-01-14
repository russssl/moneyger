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
import { type Currency } from "@/server/api/routers/currencies";
import { LoadingSpinner } from "../ui/loading";
import { Input } from "../ui/input";

export default function AddNewWalletModal({
  className,
  isOpen,
  setIsOpen,
  id,
  onSave,
}: {
  className?: string | undefined;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  id?: string | null;
  onSave: (wallet: any) => void;
}) {
  const { data: session } = useSession();
  const [currencyOptions, setCurrencyOptions] = useState<Currency[]>([]);
  const [currency, setCurrency] = useState("");
  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState<number | null>(null);
  const { data: currencies } = api.currencies.getAvailableCurrencies.useQuery(undefined, {
    enabled: isOpen,
  });

  const { data: res, isLoading: isDataLoading } = api.wallets.getWalletById.useQuery(
    { id: id || null },
    {
      enabled: isOpen && !!id,
    }
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const resetForm = () => {
    setWalletName("");
    setCurrency("");
    setInitialBalance(null);
  };

  useEffect(() => {
    if (res) {
      setWalletName(res.name || "");
      setCurrency(res.currency || "");
    }
  }, [res]);

  useEffect(() => {
    if (currencies) {
      setCurrencyOptions(currencies);
    }
  }, [currencies]);

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
          setIsOpen(false);
        },
      }
    );
  };

  return (
    <div className={className}>
      <Credenza open={isOpen} onOpenChange={handleOpenChange}>
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
                  <Label>Currency</Label>
                  {currencyOptions.length > 0 ? (
                    <Select onValueChange={setCurrency} value={currency}>
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
                      onClick={() => setIsOpen(false)}
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
