"use client"
import { cn } from "@/lib/utils";
import { type Wallet } from "@/server/db/wallet";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Target } from "lucide-react";
import { Icon, type IconName } from "@/components/ui/icon-picker";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface WalletItemProps {
  wallet: Wallet;
  onClick: (id: string) => void;
  iconSize?: string;
  textSizes?: {
    walletName: string;
    walletCurrency: string;
    balance: string;
  };
  layout?: "list" | "grid" | "compact";
  showProgressDetails?: boolean;
  className?: string;
}

export default function WalletItem({
  wallet,
  onClick,
  iconSize = "h-6 w-6 sm:h-8 sm:w-8",
  textSizes = {
    walletName: "text-sm",
    walletCurrency: "text-xs",
    balance: "text-sm",
  },
  layout = "list",
  showProgressDetails = false,
  className,
}: WalletItemProps) {
  const t = useTranslations("finances");
  const isSavingAccount = wallet.isSavingAccount ?? false;
  const goal = wallet.savingAccountGoal ?? 0;
  const isGoalReached = goal > 0 && wallet.balance >= goal;
  const remaining = goal > 0 ? Math.max(goal - wallet.balance, 0) : 0;
  const progress = goal > 0 ? Math.min((wallet.balance / goal) * 100, 100) : 0;

  const isGrid = layout === "grid";
  const isCompact = layout === "compact";

  const showDetails = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("show details");
  }

  return (
    <div
      onClick={() => onClick(wallet.id)}
      className={cn(
        "flex flex-col",
        "rounded-md border",
        isCompact ? "p-2.5 sm:p-3" : "p-3",
        "hover:bg-accent/50",
        "active:bg-accent/70",
        "border-border/50",
        "cursor-pointer",
        !isCompact && "mb-1",
        "border-primary/20",
        "transition-colors",
        "touch-manipulation",
        isGoalReached && isGrid && "border-green-500/30",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-between w-full",
        isGrid && "flex-col gap-2 mb-2",
        !isGrid && !isCompact && "mb-2"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          isGrid && "flex-col text-center",
          isCompact && "gap-2"
        )}>
          {wallet.iconName ? (
            <div className={cn(
              "flex items-center justify-center rounded-md",
              "bg-muted",
              iconSize
            )}>
              <Icon name={wallet.iconName as IconName} className={cn(
                isGrid ? "h-6 w-6" : "h-4 w-4 sm:h-5 sm:w-5"
              )} />
            </div>
          ) : (
            <div className={cn(
              "flex items-center justify-center rounded-md",
              "bg-muted",
              iconSize
            )}>
              <span className="text-xs font-medium">
                {wallet.name?.[0] ?? "?"}
              </span>
            </div>
          )}
          <div className={cn(
            "flex flex-col",
            isGrid && "items-center"
          )}>
            <div className={cn(
              "flex items-center gap-1.5",
              isGrid && "justify-center"
            )}>
              <span className={cn(
                isGrid ? "font-medium text-sm" : textSizes.walletName,
                "font-medium"
              )}>
                {wallet.name ?? "Unnamed Wallet"}
              </span>
              {isSavingAccount && (
                <Target className={cn(
                  isGrid ? "h-3.5 w-3.5" : "h-3 w-3",
                  "text-primary"
                )} />
              )}
            </div>
            <span className={cn(
              isGrid ? "text-xs" : textSizes.walletCurrency,
              "text-muted-foreground"
            )}>
              {wallet.currency}
            </span>
          </div>
        </div>
        <div className={cn(
          "flex flex-col",
          isGrid ? "items-center" : "items-end",
          isCompact && "gap-0.5"
        )}>
          <div className={cn("flex items-center gap-1", isGrid && "flex-col")}>
            <span className={cn(
              isGrid ? "font-semibold text-base" : textSizes.balance,
              "font-medium"
            )}>
              {wallet.balance.toLocaleString("en-US", {
                style: "currency",
                currency: wallet.currency
              })}
            </span>
            <Link href={`/transactions?walletId=${wallet.id}`} onClick={(e) => e.stopPropagation()} title={t("show_details")} aria-label={t("show_details")} className="flex items-center justify-center rounded p-1.5 text-muted-foreground hover:text-primary hover:bg-accent/50 active:bg-accent/70 touch-manipulation">
              <ChevronRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </Link>
          </div>
          {isSavingAccount && goal > 0 && (
            <span className={cn(
              isGrid ? "text-xs" : "text-[10px]",
              "text-muted-foreground"
            )}>
              {isGrid ? (
                <>
                  {t("goal")}: {goal.toLocaleString("en-US", {
                    style: "currency",
                    currency: wallet.currency
                  })}
                </>
              ) : (
                goal.toLocaleString("en-US", {
                  style: "currency",
                  currency: wallet.currency
                })
              )}
            </span>
          )}
        </div>
      </div>
      {isSavingAccount && goal > 0 && (
        <div className={cn(
          "space-y-1.5",
          isGrid && "space-y-1.5",
          isCompact && "mt-1"
        )}>
          <Progress 
            value={wallet.balance} 
            max={goal}
            className={cn(
              isGrid ? "h-1.5" : "h-1",
              isGoalReached && "bg-green-500/20 [&>div]:bg-green-500"
            )}
          />
          {showProgressDetails && (
            <div className={cn(
              "flex items-center justify-between",
              isGrid ? "text-xs" : "text-xs"
            )}>
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
          )}
        </div>
      )}
    </div>
  );
}

