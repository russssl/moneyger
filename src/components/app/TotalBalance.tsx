"use client"
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardWallets from "./dashboard-wallets";
import { useFetch } from "@/hooks/use-api";
import { useEffect, useState } from "react";
import { NoItems } from "./no-items";
import { LoadingSpinner } from "../ui/loading";

const WALLET_ITEM_PADDING = "p-3";
const ICON_SIZE = "h-8 w-8";
const TEXT_SIZES = {
  title: "text-sm",
  total: "text-2xl",
  walletName: "text-sm",
  walletCurrency: "text-xs",
  balance: "text-sm",
  trend: "text-xs",
} as const;

export default function TotalBalance() {
  const [wallets, setWallets] = useState<[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [userMainCurrency, setUserMainCurrency] = useState<string | null>(null);
  const { data, isLoading, refetch } = useFetch<{wallets: [], totalBalance: number, userMainCurrency: string}>("/api/wallets/full");

  useEffect(() => {
    if (data) {
      setWallets(data.wallets);
      setTotalBalance(data.totalBalance);
      setUserMainCurrency(data.userMainCurrency);
    }
  }, [data]);

  return (
    <div>
      <Card className={cn(
        "w-full",
        "bg-card"
      )}>
        <CardHeader>
          <CardTitle>
            Total Balance
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          "pt-0",
        )}>
          <div className="space-y-4">
            {wallets?.length > 0 && <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-0.5">
                <div className={cn(
                  "text-2xl",
                  "font-semibold"
                )}>
                  {totalBalance ? totalBalance.toLocaleString("en-US", {
                    style: "currency",
                    currency: userMainCurrency ?? "USD" // TODO: fix this
                  }) : "0"}
                </div>
              </div>
            </div>}
            <div className="space-y-1.5">
              {isLoading && <div className="flex justify-center mb-4 min-h-[120px] items-center">
                <LoadingSpinner />
              </div>}
              {wallets?.length === 0 && !isLoading ? (
                <NoItems
                  icon={Briefcase}
                  title="No wallets found"
                  description="Start by adding a wallet to track your balances and see your total here."
                />
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