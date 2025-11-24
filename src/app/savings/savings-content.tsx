"use client"
import { useEffect, useState } from "react";
import { useFetch } from "@/hooks/use-api";
import { type Wallet } from "@/server/db/wallet";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import SavingsList from "@/components/savings/savings-list";
import { Skeleton } from "@/components/ui/skeleton";

type ViewMode = "list" | "grid";
const STORAGE_KEY = "savings-view-mode";

function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") {
    return "list";
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "list" || saved === "grid" ? saved : "list";
}

export default function SavingsPageContent() {
  const { data, isLoading, refetch } = useFetch<{wallets: Wallet[], totalBalance: number, amountLeftToGoal: number, userMainCurrency: string | null}>("/api/savings");
  const [savingsStats, setSavingsStats] = useState<{
    totalSavings: number;
    totalGoal: number;
    progress: number;
    count: number;
    amountLeftToGoal: number;
  } | null>(null);
  const [viewMode] = useState<ViewMode>(getInitialViewMode);

  useEffect(() => {
    if (data) {
      const savingsWallets = data.wallets.filter(w => w.isSavingAccount);
      if (savingsWallets.length > 0) {
        // Use API's converted values (already in user's main currency)
        const totalSavings = data.totalBalance;
        // Calculate total goal: current balance + amount left to goal
        const totalGoal = totalSavings + data.amountLeftToGoal;
        const progress = totalGoal > 0 ? Math.min((totalSavings / totalGoal) * 100, 100) : 0;
        
        setSavingsStats({
          totalSavings,
          totalGoal,
          progress,
          count: savingsWallets.length,
          amountLeftToGoal: data.amountLeftToGoal,
        });
      } else {
        setSavingsStats(null);
      }
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <Skeleton className="h-full w-3/4 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className={cn(
          viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-2"
        )}>
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className={cn("flex w-full", viewMode === "grid" ? "flex-col gap-3 mb-3" : "items-center justify-between mb-3")}>
                  <div className={cn("flex items-center gap-3", viewMode === "grid" && "flex-col text-center")}>
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <div className={cn("flex flex-col", viewMode === "grid" ? "items-center" : "items-end gap-1")}>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <Skeleton className="h-full w-2/3 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
  stats: { totalSavings: number; totalGoal: number; progress: number; count: number; amountLeftToGoal: number };
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
              <div className="flex items-center gap-2">
                {stats.progress >= 100 ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {t("all_goals_reached")}!
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("remaining")}: {stats.amountLeftToGoal.toLocaleString("en-US", {
                      style: "currency",
                      currency: userMainCurrency
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

