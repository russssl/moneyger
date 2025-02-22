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
import {useTranslations} from "next-intl";

export default function SettingsModal({trigger}: {trigger: React.ReactNode | null}) {
  const { data: session } = useSession();
  const { data: userSettings } = api.user.getUserSettings.useQuery();
  const [username, setUsername] = useState("");
  const [currency, setCurrency] = useState("");

  const saveMutation = api.user.updateUserSettings.useMutation();
  const t = useTranslations("settings");
  const serviceTranslations = useTranslations("service");
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
          {
            trigger ? trigger : 
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}>
                <Settings />
                <span>{t("settings")}</span>
              </DropdownMenuItem>
          }
        </CredenzaTrigger>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>{t("settings")}</CredenzaTitle>
            <CredenzaDescription>
              {t("settings_description")}
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            {userSettings ? (
              <>
                <div className="flex flex-col space-y-2">
                  <Label>{t("username")}</Label>
                  <Input id="username" placeholder='Username' onChange={(e) => setUsername(e.target.value)} value={username}/>
                </div>
                <div className="flex flex-col space-y-2 mt-4">
                  <Label>{t("currency")}</Label>
                  <Select onValueChange={setCurrency} value={currency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{t("currency")}</SelectLabel>
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
              <div className="flex flex-col w-full space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                <Button className="w-full sm:w-auto" variant="outline">{serviceTranslations("close")}</Button>
                <LoadingButton
                  className="w-full sm:w-auto"
                  loading={saveMutation.isPending}
                  variant="success"
                  disabled={saveMutation.isPending || !userSettings?.currency}
                  onClick={updateSettings}
                >
                  {serviceTranslations("save")}
                </LoadingButton>
              </div>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
