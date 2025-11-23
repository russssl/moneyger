"use client"
import { type Wallet } from "@/server/db/wallet";
import EditWalletModal from "@/components/app/edit-wallet-modal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import WalletItem from "./wallet-item";

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
        {wallets?.map((wallet) => (
          <WalletItem
            key={wallet.id}
            wallet={wallet}
            onClick={openModal}
            iconSize={iconSize}
            textSizes={textSizes}
            layout="compact"
            className="mb-2"
          />
        ))}
      </div>
      <EditWalletModal open={isModalOpen} onOpenChange={setIsModalOpen} onSave={() => refetch()} id={selectedId} onDelete={handleDeleteWallet} />
    </>
  );
}