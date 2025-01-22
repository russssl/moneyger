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
import { LoadingSpinner } from "../ui/loading";
import { Input } from "../ui/input";
import { currencies } from "@/hooks/currencies";

export default function SettingsModal() {
  const { data: session } = useSession();
  const { data: userSettings } = api.user.getUserSettings.useQuery();
  const [username, setUsername] = useState("");
  const [currency, setCurrency] = useState("");

  const saveMutation = api.user.updateUserSettings.useMutation();

  const currencyOptions = currencies();

  useEffect(() => {
    if (userSettings?.currency) {
      setCurrency(userSettings.currency);
    }
    if (userSettings?.username) {
      setUsername(userSettings.username);
    }
  }, [userSettings]);

  const updateSettings = () => {
    saveMutation.mutate({ currency, username });
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
              <>
                <div className="flex flex-col space-y-2">
                  <Label>Username</Label>
                  <Input id="username" placeholder='Username' onChange={(e) => setUsername(e.target.value)} value={username}/>
                </div>
                <div className="flex flex-col space-y-2 mt-4">
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
              </>
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
