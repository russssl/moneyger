"use client"
import { useEffect, useState } from "react";
import { useFetch } from "@/hooks/use-api";
import { type Wallet } from "@/server/db/wallet";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import SavingsList from "@/components/app/savings-list";
import { LoadingSpinner } from "@/components/ui/loading";

export default function SavingsPageContent() {
  const { data, isLoading, refetch } = useFetch<{wallets: Wallet[], totalBalance: number, userMainCurrency: string}>("/api/wallets/full");
  const [savingsStats, setSavingsStats] = useState<{
    totalSavings: number;
    totalGoal: number;
    progress: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (data) {
      const savingsWallets = data.wallets.filter(w => w.isSavingAccount);
      if (savingsWallets.length > 0) {
        let totalSavings = 0;
        let totalGoal = 0;
        
        savingsWallets.forEach(wallet => {
          totalSavings += wallet.balance;
          totalGoal += wallet.savingAccountGoal ?? 0;
        });
        
        const progress = totalGoal > 0 ? Math.min((totalSavings / totalGoal) * 100, 100) : 0;
        
        setSavingsStats({
          totalSavings,
          totalGoal,
          progress,
          count: savingsWallets.length,
        });
      } else {
        setSavingsStats(null);
      }
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const wallets = data?.wallets ?? [];
  const userMainCurrency = data?.userMainCurrency ?? "USD";

  return (
    <div className="space-y-4">
      {savingsStats && savingsStats.count > 0 && (
        <SavingsSummary 
          stats={savingsStats} 
          userMainCurrency={userMainCurrency}
        />
      )}
      <SavingsList wallets={wallets} refetch={refetch} />
    </div>
  );
}

function SavingsSummary({ 
  stats, 
  userMainCurrency 
}: { 
  stats: { totalSavings: number; totalGoal: number; progress: number; count: number };
  userMainCurrency: string;
}) {
  const t = useTranslations("finances");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {t("total_savings")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-xl sm:text-2xl font-bold">
              {stats.totalSavings.toLocaleString("en-US", {
                style: "currency",
                currency: userMainCurrency
              })}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {stats.count} {t("saving_accounts")}
            </div>
          </div>
          {stats.totalGoal > 0 && (
            <div className="text-right">
              <div className="text-xs sm:text-sm text-muted-foreground">{t("goal")}</div>
              <div className="text-base sm:text-lg font-semibold">
                {stats.totalGoal.toLocaleString("en-US", {
                  style: "currency",
                  currency: userMainCurrency
                })}
              </div>
            </div>
          )}
        </div>
        {stats.totalGoal > 0 && (
          <div className="space-y-2">
            <Progress 
              value={stats.totalSavings} 
              max={stats.totalGoal}
              className={cn(
                "h-3",
                stats.progress >= 100 && "bg-green-500/20 [&>div]:bg-green-500"
              )}
            />
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "text-muted-foreground",
                stats.progress >= 100 && "text-green-600 font-medium"
              )}>
                {stats.progress.toFixed(1)}% {t("complete")}
              </span>
              {stats.progress >= 100 && (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {t("all_goals_reached")}!
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

