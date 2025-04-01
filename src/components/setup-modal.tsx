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
} from "@/components/modal";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import CurrencySelect from "./currency-select";
import LoadingButton from "./loading-button";
import { useTranslations } from "next-intl";
interface UserData {
  currency?: string;
}

export default function SetupModal() {
  const [data, setData] = useState<UserData>({});
  const { data: userAdditionalData } = api.user.getUserAdditionalData.useQuery();

  useEffect(() => {
    if (userAdditionalData) {
      setData(userAdditionalData as UserData);
    }
  }, [userAdditionalData]);

  const shouldOpenModal = userAdditionalData?.currency == null;

  const serviceTranslations = useTranslations("service");
  return (
    <>
      {shouldOpenModal && (
        <Credenza open>
          <CredenzaContent>
            <CredenzaHeader>
              <CredenzaTitle>finish_setup_title</CredenzaTitle>
              <CredenzaDescription>
                finish_setup_description {JSON.stringify(data)}
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody>
              <div className="flex flex-col gap-4">
                <CurrencySelect
                  selectedCurrency={userAdditionalData?.currency}
                  setSelectedCurrency={(currency) => {
                    setData({ ...userAdditionalData, currency: currency ?? undefined });
                  }}
                />
              </div>
            </CredenzaBody>
            <CredenzaFooter>
              <CredenzaClose asChild>
                <div className="flex flex-col justify-end w-full space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <LoadingButton
                    variant="success"
                    loading={false}>
                    {serviceTranslations("save")}
                  </LoadingButton>
                </div>
              </CredenzaClose>
            </CredenzaFooter>
          </CredenzaContent>
        </Credenza>
      )}
    </>
  );
}
