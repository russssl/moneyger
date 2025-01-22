"use client"
import { useEffect, useState } from "react"
import { CreditCard, Wallet, MoreVertical, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AddNewWalletModal from "./add-wallet-modal"
import { api } from "@/trpc/react";
import { LoadingSpinner } from "../ui/loading"
import { NoItems } from "./no-items"

type Wallet = {
  id: number;
  name?: string;
  balance: number;
  currency: string;
  type: "wallet" | "card";
};
// get this type from drizzle-orm
type WalletsRes = {
  id: string;
  name: string | null;
  balance: number | null;
  currency: string | null;
  type: "wallet" | "card";
}

export default function WalletsAndCards({className}: {className?: string | undefined}) {
  const [activeTab, setActiveTab] = useState("wallet");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<WalletsRes[]>([]);
  const { data: wallets, isLoading } = api.wallets.getWallets.useQuery();

  const deleteMutation = api.wallets.deleteWallet.useMutation();
  useEffect(() => {
    if (wallets) {
      setItems(wallets as WalletsRes[]);
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

  const saveWallets = (newItem: WalletsRes) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.id === newItem.id);
      if (existingIndex !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = newItem;
        return updatedItems;
      }
      return [...prevItems, newItem].flat();
    });
    setSelectedId(null);
    setIsModalOpen(false);
  };

  return (
    <div className={className}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Your Finances overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="wallet">Wallets</TabsTrigger>
              <TabsTrigger value="card">Cards</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center mb-4">
                  <LoadingSpinner />
                </div>
              ) : items.filter(item => item.type === activeTab).length === 0 ? (
                <NoItems
                  icon={activeTab === "wallet" ? Wallet : CreditCard}
                  title={activeTab === "wallet" ? "No Wallets" : "No Cards"}
                  description={activeTab === "wallet" ? "You don't have any wallets yet." : "You don't have any cards yet."}
                  size="md"
                />
              ) : (
                items.filter(item => item.type === activeTab).map(item => (
                  <FinanceItem key={item.id} item={item} onEdit={openModal} onDelete={deleteWallet}/>
                ))
              )}
            </TabsContent>
          </Tabs>
          <div className="mt-4">
            <Button className="w-full" onClick={() => openModal()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New {activeTab === "wallet" ? "Wallet" : "Card"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <AddNewWalletModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} id={selectedId} onSave={(wallets: WalletsRes) => saveWallets(wallets)}/>
    </div>
  );
}

type FinanceItemProps = {
  item: {
    id: string;
    name: string | null;
    balance?: number | null;
    currency?: string | null;
    lastFour?: string;
    expiryDate?: string;
    type: "wallet" | "card";
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function FinanceItem({ item, onEdit, onDelete }: FinanceItemProps) {
  const Icon = item.type === "wallet" ? Wallet : CreditCard;
  const details = item.type === "wallet"
    ? `${item.balance?.toLocaleString()} ${item.currency}`
    : `**** ${item.lastFour} | Expires: ${item.expiryDate}`;
  
  return (
    <div className="flex items-center justify-between space-x-4 mb-4">
      <div className="flex items-center space-x-4">
        <Icon className={`h-8 w-8 ${item.type === "wallet" ? "text-blue-500" : "text-green-500"}`} />
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
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(item.id)}>Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(item.id)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
