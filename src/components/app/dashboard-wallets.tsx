"use client"
import { cn } from "@/lib/utils";
import { type Wallet } from "@/server/db/wallet";
import AddNewWalletModal from "./add-wallet-modal";
import { useState } from "react";
export default function DashboardWallets({ wallets, walletItemPadding, iconSize, textSizes }: { wallets: Wallet[], walletItemPadding: string, iconSize: string, textSizes: {
  walletName: string;
  walletCurrency: string;
  balance: string;
} }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const saveWallets = (wallet: Wallet) => {
    setSelectedId(wallet.id);
    setIsModalOpen(true);
  };

  const openModal = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  return (
    <>
      <div>
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            onClick={() => openModal(wallet.id)}
            className={cn(
              "flex items-center justify-between",
              "rounded-md border",
              walletItemPadding,
              "hover:bg-accent/50",
              "border-border/50",
              "cursor-pointer",
              "mb-2"
            )}
          >
            <div className="flex items-center gap-2.5">
              {wallet.iconName ? (
                <div className={cn(
                  "flex items-center justify-center rounded-md",
                  "bg-muted",
                  iconSize
                )}>
                  <span className="text-sm">{wallet.iconName}</span>
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
              <div className="flex flex-col gap-0.5">
                <span className={cn(
                  textSizes.walletName,
                  "font-medium"
                )}>
                  {wallet.name ?? "Unnamed Wallet"}
                </span>
                <span className={cn(
                  textSizes.walletCurrency,
                  "text-muted-foreground"
                )}>
                  {wallet.currency}
                </span>
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
            </div>
          </div>
        ))}
      </div>
      <AddNewWalletModal open={isModalOpen} onOpenChange={setIsModalOpen} onSave={(wallet: Wallet) => saveWallets(wallet)} id={selectedId}/>
    </>
  );
}