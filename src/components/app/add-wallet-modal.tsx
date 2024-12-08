"use client";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Label } from "../ui/label";
import { Select, SelectTrigger, SelectValue, SelectGroup, SelectContent, SelectItem, SelectLabel } from "../ui/select";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingButton from "../loading-button";
import { api } from "@/trpc/react";
import { type Currency } from "@/server/api/routers/currencies";
import { LoadingSpinner } from "../ui/loading";
import { Input } from "../ui/input";

export default function AddNewWalletModal({className, isOpen, setIsOpen, id}: {className?: string | undefined, isOpen: boolean, setIsOpen: (isOpen: boolean) => void, id?: string | null }) { 
  const { data: session } = useSession();
  const [currencyOptions, setCurrencyOptions] = useState<Currency[]>([]);
  const [currency, setCurrency] = useState("");
  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const { data: currencies } = api.currencies.getAvailableCurrencies.useQuery(undefined, {
    enabled: isOpen,
  });

  const {data: res} = api.wallets.getWalletById.useQuery({ id: id || null }, {
    enabled: isOpen && !!id,
  });
  
  
  useEffect(() => {
    if (currencies) {
      setCurrencyOptions(currencies);
    }
  }, [currencies]);
  
  if (!session) {
    return null;
  }

  const saveWalletMutation = api.wallets.createWallet.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveWalletMutation.mutate({
      name: walletName,
      balance: parseFloat(initialBalance),
      currency,
    });
  };

  return (
    <div className={className}>
      <Credenza open={isOpen} onOpenChange={setIsOpen}>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWalletName(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <Label>Initial Balance</Label>
                  <Input 
                    placeholder="5000"
                    className="mt-1"
                    value={initialBalance}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInitialBalance(e.target.value)}/>
                </div>
                <div>
                  <Label>Currency</Label>
                  { currencyOptions ? (
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
                  )
                  }
                </div>
                <CredenzaFooter>
                  <CredenzaClose asChild>
                    <div className="flex mt-3">
                      <Button type="button" className="me-3">Close</Button>
                      <LoadingButton loading={false} type="submit">
                        Save
                      </LoadingButton>
                    </div>
                  </CredenzaClose>
                </CredenzaFooter>
              </form>
            )}
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </div>
  );
}