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
import { useState, useEffect } from "react";
import LoadingButton from "../loading-button";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "../ui/loading";
import { Input } from "../ui/input";
import {useTranslations} from "next-intl";
import { LanguageSelect } from "../language-select";

export default function SettingsModal({trigger}: {trigger?: React.ReactNode}) {
  const { data: userSettings } = api.user.getUserSettings.useQuery();
  const [username, setUsername] = useState("");
  const [currency, setCurrency] = useState("");
  
  const savedLocale = document.cookie
    .split("; ")
    .find(row => row.startsWith("locale="))
    ?.split("=")[1] ?? "en";
  const [language, setLanguage] = useState<string | undefined>(savedLocale);


  const saveMutation = api.user.updateUserSettings.useMutation();
  const t = useTranslations("settings");
  const serviceTranslations = useTranslations("service");

  useEffect(() => {
    setCurrency(userSettings?.currency ?? "");
    setUsername(userSettings?.username ?? "");
  }, [userSettings]);

  const updateSettings = () => {
    saveMutation.mutate({ currency, username });

    if (language !== savedLocale) {
      document.cookie = `locale=${language}; path=/; max-age=31536000`;
      window.location.reload();
    }
  };

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
                  <Input id="username" placeholder='Username' onChange={(e) => setUsername(e.target.value)} value={username} autoFocus={false}/>
                </div>
                <div className="flex flex-col space-y-2 mt-4">
                  <LanguageSelect
                    language={language}
                    setLanguage={(value) => setLanguage(value ?? undefined)}
                  />
                </div>
              </>
            ): <div className='flex justify-center'>
              <LoadingSpinner />
            </div>}
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <div className="flex flex-col justify-end w-full space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                <Button className="w-full sm:w-auto" variant="outline">{serviceTranslations("close")}</Button>
                <LoadingButton
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
