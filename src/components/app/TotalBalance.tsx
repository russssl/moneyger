"use client"
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardWallets from "./dashboard-wallets";
import { useFetch } from "@/hooks/use-api";
import { useEffect, useState } from "react";
import { NoItems } from "./no-items";
import { LoadingSpinner } from "../ui/loading";
import { type Wallet } from "@/server/db/wallet";
import { useTranslations } from "next-intl";

const WALLET_ITEM_PADDING = "p-2 sm:p-3";
const ICON_SIZE = "h-6 w-6 sm:h-8 sm:w-8";
const TEXT_SIZES = {
  title: "text-sm",
  total: "text-xl sm:text-2xl",
  walletName: "text-sm",
  walletCurrency: "text-xs",
  balance: "text-sm",
  trend: "text-xs",
} as const;

export default function TotalBalance() {
  const t = useTranslations("finances");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [userMainCurrency, setUserMainCurrency] = useState<string | null>(null);
  const { data, isLoading, refetch } = useFetch<{wallets: Wallet[], totalBalance: number, userMainCurrency: string}>("/api/wallets/full");

  useEffect(() => {
    if (data) {
      setWallets(data.wallets);
      setTotalBalance(data.totalBalance);
      setUserMainCurrency(data.userMainCurrency);
    }
  }, [data]);

  return (
    <div className="h-full">
      <Card className={cn(
        "w-full h-full flex flex-col",
        "bg-card"
      )}>
        <CardHeader>
          <CardTitle>
            {t("total_balance")}
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          "pt-0 flex-1 flex flex-col",
        )}>
          <div className="space-y-4 flex-1 flex flex-col">
            {wallets?.length > 0 && <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-0.5">
                <div className={cn(
                  "text-xl sm:text-2xl",
                  "font-semibold"
                )}>
                  {totalBalance ? totalBalance.toLocaleString("en-US", {
                    style: "currency",
                    currency: userMainCurrency ?? "USD" // TODO: fix this
                  }) : "0"}
                </div>
              </div>
            </div>}
            <div className="space-y-1.5 flex-1 flex flex-col">
              {isLoading && <div className="flex justify-center mb-4 min-h-[120px] items-center">
                <LoadingSpinner />
              </div>}
              {wallets?.length === 0 && !isLoading ? (
                <div className="flex-1">
                  <NoItems
                    icon={Briefcase}
                    title={t("no_wallets_found")}
                    description={t("no_wallets_found_desc")}
                  />
                </div>
              ) : (
                <>
                  <DashboardWallets wallets={wallets} walletItemPadding={WALLET_ITEM_PADDING} iconSize={ICON_SIZE} textSizes={TEXT_SIZES} refetch={refetch}/>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}