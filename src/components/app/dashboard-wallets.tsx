"use client"
import { cn } from "@/lib/utils";
import { type Wallet } from "@/server/db/wallet";
import EditWalletModal from "@/components/app/edit-wallet-modal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { Icon, type IconName } from "@/components/ui/icon-picker";

export default function DashboardWallets({ wallets, iconSize, textSizes, refetch }: { wallets: Wallet[], iconSize: string, textSizes: {
  walletName: string;
  walletCurrency: string;
  balance: string;
}, refetch: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const router = useRouter();

  const openModal = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleDeleteWallet = () => {
    router.refresh();
  }
  return (
    <>
      <div>
        {wallets?.map((wallet) => {
          const isSavingAccount = wallet.isSavingAccount ?? false;
          const goal = wallet.savingAccountGoal ?? 0;
          const isGoalReached = goal > 0 && wallet.balance >= goal;
          
          return (
            <div
              key={wallet.id}
              onClick={() => openModal(wallet.id)}
              className={cn(
                "flex flex-col",
                "rounded-md border",
                "p-2.5 sm:p-3",
                "hover:bg-accent/50",
                "active:bg-accent/70",
                "border-border/50",
                "cursor-pointer",
                "mb-1",
                "border-primary/20",
                "transition-colors",
                "touch-manipulation"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {wallet.iconName ? (
                    <div className={cn(
                      "flex items-center justify-center rounded-md",
                      "bg-muted",
                      iconSize
                    )}>
                      <Icon name={wallet.iconName as IconName} className="h-4 w-4 sm:h-5 sm:w-5" />
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
                  <div className="flex items-center gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          textSizes.walletName,
                          "font-medium"
                        )}>
                          {wallet.name ?? "Unnamed Wallet"}
                        </span>
                        {isSavingAccount && (
                          <Target className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <span className={cn(
                        textSizes.walletCurrency,
                        "text-muted-foreground"
                      )}>
                        {wallet.currency}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={cn(
                    textSizes.balance,
                    "font-medium"
                  )}>
                    {wallet.balance.toLocaleString("en-US", {
                      style: "currency",
                      currency: wallet.currency
                    })}
                  </span>
                  {isSavingAccount && goal > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {goal.toLocaleString("en-US", {
                        style: "currency",
                        currency: wallet.currency
                      })}
                    </span>
                  )}
                </div>
              </div>
              {isSavingAccount && goal > 0 && (
                <Progress 
                  value={wallet.balance} 
                  max={goal}
                  className={cn(
                    "h-1 mt-1",
                    isGoalReached && "bg-green-500/20 [&>div]:bg-green-500"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <EditWalletModal open={isModalOpen} onOpenChange={setIsModalOpen} onSave={() => refetch()} id={selectedId} onDelete={handleDeleteWallet} />
    </>
  );
}