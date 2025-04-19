"use client";
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/modal";
import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import CurrencySelect from "./currency-select";
import LoadingButton from "./loading-button";
import { useTranslations } from "next-intl";
import { LanguageSelect } from "./language-select";
interface UserData {
  currency?: string;
}

export default function SetupModal() {
  const [data, setData] = useState<UserData>({});
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const { data: userAdditionalData } = api.user.getUserAdditionalData.useQuery();

  const createUserSettingsMutation = api.user.createUserSettings.useMutation();

  useEffect(() => {
    if (userAdditionalData) {
      setData(userAdditionalData as UserData);
      setOpen(!userAdditionalData.currency);
    }
  }, [userAdditionalData]);

  function saveSettings() {
    if (!data.currency) {
      return;
    }
    createUserSettingsMutation.mutate({
      currency: data.currency
    });

    if (language) {
      document.cookie = `locale=${language}; path=/; max-age=31536000`;
      window.location.reload();
    }
  }

  const serviceTranslations = useTranslations("service");
  return (
    <>
      {open && (
        <Modal open>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>title</ModalTitle>
              <ModalDescription>
                description
              </ModalDescription>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <CurrencySelect
                  selectedCurrency={userAdditionalData?.currency}
                  setSelectedCurrency={(currency) => {
                    setData({ ...userAdditionalData, currency: currency ?? undefined });
                  }}
                />
                <LanguageSelect
                  language={language}
                  setLanguage={(languageCode) => setLanguage(languageCode ?? undefined)}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <ModalClose asChild>
                <div className="flex flex-col justify-end w-full space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <LoadingButton
                    variant="success"
                    loading={createUserSettingsMutation.isPending}
                    disabled={createUserSettingsMutation.isPending || !data.currency}
                    onClick={() => {
                      saveSettings();
                    }}
                  >
                    {serviceTranslations("save")}
                  </LoadingButton>
                </div>
              </ModalClose>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  )
}