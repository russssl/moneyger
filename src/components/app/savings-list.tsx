"use client"
import { cn } from "@/lib/utils";
import { type Wallet } from "@/server/db/wallet";
import EditWalletModal from "@/components/app/edit-wallet-modal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Target, Grid3x3, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "../ui/loading";
import { NoItems } from "./no-items";
import { PiggyBank } from "lucide-react";

type ViewMode = "list" | "grid";

export default function SavingsList({ wallets, refetch }: { wallets: Wallet[], refetch: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const router = useRouter();
  const t = useTranslations("finances");

  const openModal = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleDeleteWallet = () => {
    router.refresh();
  }

  const savingsWallets = wallets.filter(w => w.isSavingAccount);

  if (savingsWallets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <NoItems
            icon={PiggyBank}
            title={t("no_savings_accounts")}
            description={t("no_savings_accounts_desc")}
          />
        </CardContent>
      </Card>
    );
  }

  const SavingsCard = ({ wallet }: { wallet: Wallet }) => {
    const goal = wallet.savingAccountGoal ?? 0;
    const progress = goal > 0 ? Math.min((wallet.balance / goal) * 100, 100) : 0;
    const isGoalReached = goal > 0 && wallet.balance >= goal;
    const remaining = goal > 0 ? Math.max(goal - wallet.balance, 0) : 0;

    return (
      <Card
        onClick={() => openModal(wallet.id)}
        className={cn(
          "flex flex-col cursor-pointer hover:bg-accent/50 transition-colors",
          isGoalReached && "border-green-500/30"
        )}
      >
        <CardContent className="p-4">
          <div className={cn("flex w-full", viewMode === "grid" ? "flex-col gap-3 mb-3" : "items-center justify-between mb-3")}>
            <div className={cn("flex items-center gap-3", viewMode === "grid" && "flex-col text-center")}>
              {wallet.iconName ? (
                <div className="flex items-center justify-center rounded-md bg-muted h-10 w-10">
                  <span className="text-sm">{wallet.iconName}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-md bg-muted h-10 w-10">
                  <span className="text-xs font-medium">
                    {wallet.name?.[0] ?? "?"}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{wallet.name ?? "Unnamed Wallet"}</span>
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{wallet.currency}</span>
              </div>
            </div>
            <div className={cn("flex flex-col", viewMode === "grid" ? "items-center" : "items-end")}>
              <span className="font-semibold text-lg">
                {wallet.balance.toLocaleString("en-US", {
                  style: "currency",
                  currency: wallet.currency
                })}
              </span>
              {goal > 0 && (
                <span className="text-xs text-muted-foreground">
                  {t("goal")}: {goal.toLocaleString("en-US", {
                    style: "currency",
                    currency: wallet.currency
                  })}
                </span>
              )}
            </div>
          </div>
          {goal > 0 && (
            <div className="space-y-2">
              <Progress 
                value={wallet.balance} 
                max={goal}
                className={cn(
                  "h-2",
                  isGoalReached && "bg-green-500/20 [&>div]:bg-green-500"
                )}
              />
              <div className="flex items-center justify-between text-sm">
                <span className={cn(
                  "text-muted-foreground",
                  isGoalReached && "text-green-600 font-medium"
                )}>
                  {progress.toFixed(1)}% {t("complete")}
                </span>
                <div className="flex items-center gap-2">
                  {isGoalReached ? (
                    <span className="text-green-600 font-medium text-xs">
                      {t("goal_reached")}!
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("remaining")}: {remaining.toLocaleString("en-US", {
                        style: "currency",
                        currency: wallet.currency
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
  };

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="h-8 w-8"
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="h-8 w-8"
            aria-label="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className={cn(
        viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-2"
      )}>
        {savingsWallets.map((wallet) => (
          <SavingsCard key={wallet.id} wallet={wallet} />
        ))}
      </div>
      <EditWalletModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSave={() => refetch()} 
        id={selectedId} 
        onDelete={handleDeleteWallet} 
      />
    </>
  );
}

