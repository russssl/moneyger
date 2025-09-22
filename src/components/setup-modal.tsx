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
import { ErrorAlert } from "./error-alert";

export default function SetupModal() {
  const [currency, setCurrency] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const saveDataMutation = api.user.saveUserData.useMutation();
  const { data: userData } = api.user.getUserData.useQuery();

  const t = useTranslations("setup-modal");
  const serviceTranslations = useTranslations("service");

  useEffect(() => {
    if (userData) {
      setCurrency(userData.currency ?? undefined);
      setOpen(!userData.currency);
    }
  }, [userData]);

  function saveSettings() {
    if (!currency) return;

    saveDataMutation.mutate({
      currency,
    }, {
      onError: (error) => {
        setError(error.message || "Failed to save settings");
        console.error(error);
        setOpen(true);
      },
    });

  }

  return (
    <>
      {open && (
        <Modal open={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{t("title")}</ModalTitle>
              <ModalDescription>{t("description")}</ModalDescription>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {error && <ErrorAlert error={error} className="mb-4" />}
                <CurrencySelect
                  selectedCurrency={currency}
                  setSelectedCurrency={(currency) =>
                    setCurrency(currency ?? undefined)
                  }
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <ModalClose asChild>
                <div className="flex flex-col justify-end w-full space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <LoadingButton
                    variant="success"
                    loading={saveDataMutation.isPending}
                    disabled={saveDataMutation.isPending || !currency}
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
