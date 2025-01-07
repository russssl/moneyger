"use client";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/modal";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Label } from "../ui/label";
import { Select, SelectTrigger, SelectValue, SelectGroup, SelectContent, SelectItem, SelectLabel } from "../ui/select";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingButton from "../loading-button";
import { api } from "@/trpc/react";
import { type Currency } from "@/server/api/routers/currencies";
import { LoadingSpinner } from "../ui/loading";

export default function SettingsModal() {
  const { data: session } = useSession();
  const { data: userSettings } = api.user.getUserSettings.useQuery();
  const {data: currencies} = api.currencies.getAvailableCurrencies.useQuery();
  const [currency, setCurrency] = useState("");
  const [currencyOptions, setCurrencyOptions] = useState<Currency[]>([]);

  const saveMutation = api.user.updateUserSettings.useMutation();
  useEffect(() => {
    if (userSettings?.currency) {
      setCurrency(userSettings.currency);
    }
  }, [userSettings]);
  
  useEffect(() => {
    if (currencies) {
      setCurrencyOptions(currencies);
    }
  }, [currencies]);

  const updateSettings = () => {
    saveMutation.mutate({ currency });
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <Credenza>
        <CredenzaTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}>
            <Settings />
            Settings
          </DropdownMenuItem>
        </CredenzaTrigger>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Setting</CredenzaTitle>
            <CredenzaDescription>
              Change your settings here.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            {userSettings ? (
              <div className="flex flex-col space-y-2">
                <Label>Currency</Label>
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
              </div>
            ): <div className='flex justify-center'>
              <LoadingSpinner />
            </div>}
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <div className="flex">
                <Button className="me-3">Close</Button>
                <LoadingButton
                  loading={saveMutation.isPending}
                  variant="success"
                  disabled={saveMutation.isPending || !userSettings?.currency}
                  onClick={updateSettings}
                >
                  Save
                </LoadingButton>
              </div>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
