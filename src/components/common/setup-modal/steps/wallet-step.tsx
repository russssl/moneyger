"use client";
import { useTranslations } from "next-intl";
import { Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CurrencySelect from "@/components/common/currency-select";
import type { WalletFormState, WalletFormAction } from "../types";

type WalletStepProps = {
  walletState: WalletFormState;
  dispatchWallet: React.Dispatch<WalletFormAction>;
  currency: string | undefined;
  onSubmit: (e: React.FormEvent) => void;
};

export function WalletStep({ walletState, dispatchWallet, currency, onSubmit }: WalletStepProps) {
  const t = useTranslations("setup-modal");
  const tFinances = useTranslations("finances");
  const tGeneral = useTranslations("general");
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 duration-300 animate-in fade-in slide-in-from-right-4">
      <div className="mb-2 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">{t("wallet_step_title")}</h3>
          <p className="text-sm text-muted-foreground">{t("wallet_step_description")}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="wallet-name">{tFinances("wallet_name")}</Label>
          <Input
            id="wallet-name"
            placeholder={t("wallet_name_placeholder")}
            value={walletState.walletName}
            onChange={(e) => dispatchWallet({ type: "SET_WALLET_NAME", payload: e.target.value })}
            required
          />
        </div>
        <CurrencySelect
          selectedCurrency={walletState.currency || currency}
          setSelectedCurrency={(c) => dispatchWallet({ type: "SET_CURRENCY", payload: c ?? undefined })}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="initial-balance">
            {tFinances("wallet_initial_balance")} ({tGeneral("optional")})
          </Label>
          <Input
            id="initial-balance"
            placeholder={t("initial_balance_placeholder")}
            type="number"
            step="0.01"
            value={walletState.balance ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              dispatchWallet({ type: "SET_BALANCE", payload: value === "" ? null : parseFloat(value) });
            }}
          />
          <p className="text-xs text-muted-foreground">{t("initial_balance_hint")}</p>
        </div>
      </div>
    </form>
  );
}
