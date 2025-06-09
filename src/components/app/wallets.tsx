"use client"
import { useEffect, useState } from "react"
import { Wallet, MoreVertical, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import AddNewWalletModal from "./add-wallet-modal"
import { api } from "@/trpc/react";
import { LoadingSpinner } from "../ui/loading"
import { NoItems } from "./no-items"
import { useTranslations } from "next-intl"
import { type Wallet as WalletType } from "@/server/db/wallet"

export default function Wallets({className}: {className?: string | undefined}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<WalletType[]>([]);
  const { data: wallets, isLoading } = api.wallets.getWallets.useQuery();
  const t = useTranslations("finances");

  const deleteMutation = api.wallets.deleteWallet.useMutation();
  useEffect(() => {
    if (wallets) {
      setItems(wallets);
    }
  }, [wallets]);

  const openModal = (id?: string | null) => {
    setSelectedId(id || null); 
    setIsModalOpen(true);
  };

  const deleteWallet = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    setSelectedId(null);
  };

  const saveWallets = (newItem: WalletType) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id);
      if (existingItem) {
        const existingIndex = prevItems.indexOf(existingItem);
        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = newItem;
        return updatedItems;
      } else {
        return [...prevItems, newItem];
      }
    });
    setSelectedId(null);
    setIsModalOpen(false);
  };

  return (
    <div className={className}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("wallets_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center mb-4 min-h-[120px] items-center">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <div className="min-h-[120px] flex items-center justify-center">
              <NoItems
                icon={Wallet}
                title={t("no_wallets")}
                description={t("no_wallets_desc")}
                size="md"
              />
            </div>
          ) : (
            items.map(item => (
              <FinanceItem key={item.id} item={item} onEdit={openModal} onDelete={deleteWallet}/>
            ))
          )}
          <div className="mt-4">
            <Button className="w-full" onClick={() => openModal()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("add_wallet")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <AddNewWalletModal open={isModalOpen} onOpenChange={setIsModalOpen} onSave={(wallet: WalletType) => saveWallets(wallet)}/>
    </div>
  );
}

type FinanceItemProps = {
  item: {
    id: string;
    name: string | null;
    balance?: number | null;
    currency?: string | null;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function FinanceItem({ item, onEdit, onDelete }: FinanceItemProps) {
  const details = `${item.balance?.toLocaleString()} ${item.currency}`;
  const t = useTranslations("service");
  
  return (
    <div className="flex items-center justify-between space-x-4 mb-4">
      <div className="flex items-center space-x-4">
        <Wallet className="h-8 w-8 text-blue-500" />
        <div>
          <p className="text-sm font-medium leading-none">{item.name}</p>
          <p className="text-sm text-muted-foreground">{details}</p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(item.id)}>{t("edit")}</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(item.id)}>{t("delete")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
