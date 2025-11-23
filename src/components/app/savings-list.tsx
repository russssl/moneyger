"use client"
import { cn } from "@/lib/utils";
import { type Wallet } from "@/server/db/wallet";
import EditWalletModal from "@/components/app/edit-wallet-modal";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Grid3x3, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoItems } from "./no-items";
import { PiggyBank } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import WalletItem from "./wallet-item";

type ViewMode = "list" | "grid";
const STORAGE_KEY = "savings-view-mode";

function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") {
    return "list";
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "list" || saved === "grid" ? saved : "list";
}

export default function SavingsList({ wallets, refetch }: { wallets: Wallet[], refetch: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const t = useTranslations("finances");
  const isMobile = useIsMobile();

  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Save view mode to localStorage whenever it changes (but not on initial mount)
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, viewMode);
    }
  }, [viewMode, isInitialized]);

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


  return (
    <>
      <div className="flex items-center justify-end mb-2">
        <div className={cn("flex gap-0.5 bg-muted rounded-lg", isMobile ? "p-0.5" : "p-1")}>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className={cn(isMobile ? "h-7 w-7" : "h-8 w-8")}
            aria-label="List view"
          >
            <List className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn(isMobile ? "h-7 w-7" : "h-8 w-8")}
            aria-label="Grid view"
          >
            <Grid3x3 className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
          </Button>
        </div>
      </div>
      <div className={cn(
        viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" 
          : "space-y-2"
      )}>
        {savingsWallets.map((wallet) => (
          <Card
            key={wallet.id}
            className={cn(
              "cursor-pointer hover:bg-accent/50 transition-colors",
              (wallet.savingAccountGoal ?? 0) > 0 && wallet.balance >= (wallet.savingAccountGoal ?? 0) && "border-green-500/30"
            )}
          >
            <CardContent className="p-0">
              <WalletItem
                wallet={wallet}
                onClick={openModal}
                layout={viewMode}
                showProgressDetails={true}
                className="border-0 mb-0"
              />
            </CardContent>
          </Card>
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

