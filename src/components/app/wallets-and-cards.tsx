"use client"

import { useState } from "react"
import { CreditCard, Wallet, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AddNewWalletModal from "./add-wallet-modal"

const items: { id: number; name: string; balance?: number; currency?: string; lastFour?: string; expiryDate?: string; type: "wallet" | "card"; }[] = [
  { id: 1, name: "Main Wallet", balance: 5000, currency: "USD", type: "wallet" },
  { id: 2, name: "Savings", balance: 10000, currency: "USD", type: "wallet" },
  { id: 3, name: "Visa Platinum", lastFour: "1234", expiryDate: "12/24", type: "card" },
  { id: 4, name: "Mastercard Gold", lastFour: "5678", expiryDate: "06/25", type: "card" },
]

export default function WalletsAndCards({className}: {className?: string | undefined}) {
  const [activeTab, setActiveTab] = useState("wallets");
  return (
    <div className={className}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Your Finances</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="wallets">Wallets</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>
            <TabsContent value="wallets">
              {items.filter(item => item.type === "wallet").map(item => (
                <FinanceItem key={item.id} item={item} />
              ))}
            </TabsContent>
            <TabsContent value="cards">
              {items.filter(item => item.type === "card").map(item => (
                <FinanceItem key={item.id} item={item} />
              ))}
            </TabsContent>
          </Tabs>
          <AddNewWalletModal />
        </CardContent>
      </Card>
    </div>
  );
}

type FinanceItemProps = {
  item: {
    id: number;
    name: string;
    balance?: number;
    currency?: string;
    lastFour?: string;
    expiryDate?: string;
    type: "wallet" | "card";
  };
};

function FinanceItem({ item }: FinanceItemProps) {
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
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
