import { api } from "@/trpc/server";
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CARD_PADDING = "p-4";
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

export default async function TotalBalance() {
  const res = await api.wallets.getFullData();
  
  return (
    <Card className={cn(
      "w-full",
      "bg-card"
    )}>
      <CardHeader className={cn(
        "pb-1",
        CARD_PADDING
      )}>
        <CardTitle className={cn(
          TEXT_SIZES.title,
          "font-medium text-muted-foreground"
        )}>
          Total Balance
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(
        "pt-0",
        CARD_PADDING
      )}>
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div className="flex flex-col gap-0.5">
              <div className={cn(
                TEXT_SIZES.total,
                "font-semibold"
              )}>
                {res.totalBalance.toLocaleString("en-US", {
                  style: "currency",
                  currency: res.userMainCurrency
                })}
              </div>
              <div className={cn(
                TEXT_SIZES.trend,
                "flex items-center gap-1",
                res.totalTrend > 0 ? "text-green-500" : "text-red-500"
              )}>
                {res.totalTrend > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{Math.abs(res.totalTrend)}% last 30 days</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{res.userMainCurrency}</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            {res.wallets.map((wallet) => (
              <div 
                key={wallet.id} 
                className={cn(
                  "flex items-center justify-between",
                  "rounded-md border",
                  WALLET_ITEM_PADDING,
                  "hover:bg-accent/50",
                  "border-border/50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {wallet.iconName ? (
                    <div className={cn(
                      "flex items-center justify-center rounded-md",
                      "bg-muted",
                      ICON_SIZE
                    )}>
                      <span className="text-sm">{wallet.iconName}</span>
                    </div>
                  ) : (
                    <div className={cn(
                      "flex items-center justify-center rounded-md",
                      "bg-muted",
                      ICON_SIZE
                    )}>
                      <span className="text-xs font-medium">
                        {wallet.name?.[0] ?? "?"}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className={cn(
                      TEXT_SIZES.walletName,
                      "font-medium"
                    )}>
                      {wallet.name ?? "Unnamed Wallet"}
                    </span>
                    <span className={cn(
                      TEXT_SIZES.walletCurrency,
                      "text-muted-foreground"
                    )}>
                      {wallet.currency}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={cn(
                    TEXT_SIZES.balance,
                    "font-medium"
                  )}>
                    {wallet.balance.toLocaleString("en-US", {
                      style: "currency",
                      currency: wallet.currency
                    })}
                  </span>
                  <div className={cn(
                    TEXT_SIZES.trend,
                    "flex items-center gap-0.5",
                    (res.walletTrends[wallet.id] ?? 0) > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {(res.walletTrends[wallet.id] ?? 0) > 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span>{Math.abs(res.walletTrends[wallet.id] ?? 0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}