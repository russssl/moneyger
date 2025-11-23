"use client"
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardWallets from "./dashboard-wallets";
import { useFetch } from "@/hooks/use-api";
import { useEffect, useState } from "react";
import { NoItems } from "./no-items";
import { type Wallet } from "@/server/db/wallet";
import { useTranslations } from "next-intl";
import { Skeleton } from "../ui/skeleton";

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
  const { data, isLoading, refetch } = useFetch<{
    wallets: Wallet[], 
    totalBalance: number, 
    userMainCurrency: string,
    savingsStats: {
      totalSavings: number;
      totalGoal: number;
      progress: number;
      amountLeftToGoal: number;
    } | null;
  }>("/api/wallets/full", {
    queryKey: ["wallets"],
  });

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
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">
            {t("total_balance")}
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          "pt-0 flex-1 flex flex-col px-4 sm:px-6",
        )}>
          <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
            {isLoading ? (
              <>
                <div className="flex items-baseline justify-between">
                  <div className="flex flex-col gap-0.5">
                    <Skeleton className="h-10 sm:h-6 md:h-8 w-48 sm:w-40" />
                  </div>
                </div>
                <div className="space-y-1.5 flex-1 flex flex-col">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 border rounded-md">
                      <div className="flex items-center gap-2.5 sm:gap-3 flex-1">
                        <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-md flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <Skeleton className="h-4 w-24 sm:w-32" />
                          <Skeleton className="h-3 w-16 sm:w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-20 sm:w-24" />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {wallets?.length > 0 && (
                  <div className="flex items-baseline justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className={cn(
                        "text-3xl sm:text-xl md:text-2xl",
                        "font-semibold"
                      )}>
                        {totalBalance ? totalBalance.toLocaleString("en-US", {
                          style: "currency",
                          currency: userMainCurrency ?? "USD"
                        }) : "0"}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 flex-1 flex flex-col">
                  {wallets?.length === 0 ? (
                    <div className="flex-1">
                      <NoItems
                        icon={Briefcase}
                        title={t("no_wallets_found")}
                        description={t("no_wallets_found_desc")}
                      />
                    </div>
                  ) : (
                    <>
                      <DashboardWallets wallets={wallets} iconSize={ICON_SIZE} textSizes={TEXT_SIZES} refetch={refetch}/>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}