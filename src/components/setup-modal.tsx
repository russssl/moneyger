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
import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import CurrencySelect from "./currency-select";
import LoadingButton from "./loading-button";
import { useTranslations } from "next-intl";
import { LanguageSelect } from "./language-select";
import type { InsertUserSettings } from "@/server/db/userSettings"; // adjust path as needed

export default function SetupModal() {
  const [data, setData] = useState<Partial<InsertUserSettings>>({});
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<string | undefined>(undefined);

  const { data: userAdditionalData } = api.user.getUserAdditionalData.useQuery();
  const createUserSettingsMutation = api.user.createUserSettings.useMutation();

  const t = useTranslations("setup-modal");
  const serviceTranslations = useTranslations("service");

  useEffect(() => {
    if (userAdditionalData) {
      setData(userAdditionalData);
      setOpen(!userAdditionalData.currency);
    }
  }, [userAdditionalData]);

  function saveSettings() {
    if (!data.currency) return;

    createUserSettingsMutation.mutate(
      { currency: data.currency },
      {
        onSuccess: () => {
          setOpen(false);
        },
        onError: (error) => {
          console.error("Error saving user settings:", error);
        },
      }
    );

    if (language) {
      document.cookie = `locale=${language}; path=/; max-age=31536000`;
      window.location.reload();
    }
  }

  return (
    <>
      {open && (
        <Modal open>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{t("title")}</ModalTitle>
              <ModalDescription>{t("description")}</ModalDescription>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <CurrencySelect
                  selectedCurrency={data.currency}
                  setSelectedCurrency={(currency) =>
                    setData({ ...data, currency: currency ?? undefined })
                  }
                />
                <LanguageSelect
                  language={language}
                  setLanguage={(languageCode) =>
                    setLanguage(languageCode ?? undefined)
                  }
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
                    onClick={saveSettings}
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
  );
}
