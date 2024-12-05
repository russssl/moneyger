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
import { PlusCircle } from "lucide-react";
import { Label } from "../ui/label";
import { Select, SelectTrigger, SelectValue, SelectGroup, SelectContent, SelectItem, SelectLabel } from "../ui/select";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingButton from "../loading-button";
import { api } from "@/trpc/react";
import { type Currency } from "@/server/api/routers/currencies";
import { LoadingSpinner } from "../ui/loading";
import { Input } from "../ui/input";

export default function AddNewWalletModal({className}: {className?: string | undefined}) { 
  const { data: session } = useSession();
  const [currency, setCurrency] = useState("");
  const [currencyOptions, setCurrencyOptions] = useState<Currency[]>([]);
  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: currencies } = api.currencies.getAvailableCurrencies.useQuery(undefined, {
    enabled: isModalOpen,
  });

  useEffect(() => {
    if (currencies) {
      setCurrencyOptions(currencies);
    }
  }, [currencies]);

  if (!session) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      walletName,
      initialBalance,
      currency,
    });
  };

  return (
    <div className={className}>
      <Credenza open={isModalOpen} onOpenChange={setIsModalOpen}>
        <CredenzaTrigger asChild>
          <Button className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Wallet
          </Button>
        </CredenzaTrigger>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Add new Wallet</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody>
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
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </div>
  );
}