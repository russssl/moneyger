import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardWallets from "./dashboard-wallets";

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
  // const res = await api.wallets.getFullData();
  const res = [] as any;
  return (
    <div>
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
            {res.wallets?.length > 0 && <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-0.5">
                <div className={cn(
                  TEXT_SIZES.total,
                  "font-semibold"
                )}>
                  {res.totalBalance ? res.totalBalance.toLocaleString("en-US", {
                    style: "currency",
                    currency: res.userMainCurrency
                  }) : "0"}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>{res.userMainCurrency}</span>
              </div>
            </div>}
            <div className="space-y-1.5">
              {res.wallets?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 rounded-lg bg-muted/40 border border-dashed border-border/50 p-3">
                  <div className="mb-3 flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                    <Briefcase className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <div className="text-lg font-semibold text-muted-foreground mb-1">
                    No wallets found
                  </div>
                  <div className="text-sm text-muted-foreground/70 text-center max-w-xs">
                    Start by adding a wallet to track your balances and see your total here.
                  </div>
                </div>
              ) : (
                <>
                  <DashboardWallets wallets={res.wallets} walletItemPadding={WALLET_ITEM_PADDING} iconSize={ICON_SIZE} textSizes={TEXT_SIZES}/>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}