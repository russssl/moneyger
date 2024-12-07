"use client";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
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

export default function AddNewWalletModal({className, children, isOpen, setIsOpen, id}: {className?: string | undefined, children: React.ReactNode, isOpen: boolean, setIsOpen: (isOpen: boolean) => void, id?: string | null }) { 
  const { data: session } = useSession();
  const [currencyOptions, setCurrencyOptions] = useState<Currency[]>([]);
  const [currency, setCurrency] = useState("");
  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const { data: currencies } = api.currencies.getAvailableCurrencies.useQuery(undefined, {
    enabled: isModalOpen,
  });

  const {data: res} = api.wallets.getWalletById.useQuery({ id: id || null }, {
    enabled: isModalOpen && !!id,
  });

  useEffect(() => {
    if (res) {
      setWalletName(res.name || "");
      setInitialBalance(res.balance?.toString() || "");
      setCurrency(res.currency || "");
    }
  }, [res, id]);
  
  useEffect(() => {
    if (currencies) {
      setCurrencyOptions(currencies);
    }
  }, [currencies]);

  const saveWalletMutation = api.wallets.createWallet.useMutation();

  useEffect(() => {
    if (!isOpen) {
      setWalletName("");
      setInitialBalance("");
      setCurrency("");
    }
    setIsModalOpen(isOpen);
  }, [isOpen]);

  if (!session) {
    return null;
  }

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
      <Credenza open={isModalOpen} onOpenChange={setIsOpen}>
        <CredenzaTrigger asChild>
          {children}
        </CredenzaTrigger>
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