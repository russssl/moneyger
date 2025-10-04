"use client"
import {
  Plus,
  ArrowRightLeft,
  Wallet,
  Minus,
} from "lucide-react"
import QuickActionButton, { type QuickAction } from "./quick-action-button"
import AddNewTransactionModal from "@/components/app/transactions/add-new-transaction-modal"
import { useState } from "react";
import { cn } from "@/lib/utils";
import AddNewWalletModal from "@/components/app/add-wallet-modal";

export function QuickActions({ className }: { className?: string }) {
  const [newTransactionModalOpen, setNewTransactionModalOpen] = useState(false);
  const [newWalletModalOpen, setNewWalletModalOpen] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<"income" | "expense" | "transfer">("income");
  const handleTransactionModalOpen = (type: "income" | "expense" | "transfer") => {
    setNewTransactionType(type);
    setNewTransactionModalOpen(true);
  }

  const quickActions: QuickAction[] = [
    {
      id: "expense",
      name: "Expense",
      icon: Minus,
      color: {
        bg: "bg-red-50 dark:bg-red-950/50",
        border: "border-red-200 dark:border-red-800",
        hover: "hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900 dark:hover:text-red-300",
        text: "text-red-600 dark:text-red-300",
      },
      onClick: () => handleTransactionModalOpen("expense"),
    },
    {
      id: "income",
      name: "Income",
      icon: Plus,
      color: {
        bg: "bg-green-50 dark:bg-green-950/50",
        border: "border-green-200 dark:border-green-800",
        hover: "hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900 dark:hover:text-green-300",
        text: "text-green-600 dark:text-green-300",
      },
      onClick: () => handleTransactionModalOpen("income"),
    },
    {
      id: "transfer",
      name: "Transfer",
      icon: ArrowRightLeft,
      color: {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-800",
        hover: "hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300",
        text: "text-blue-600 dark:text-blue-300",
      },
      onClick: () => handleTransactionModalOpen("transfer"),
    },
    {
      id: "wallet",
      name: "Wallet",
      icon: Wallet,
      color: {
        bg: "bg-purple-50 dark:bg-purple-950/50",
        border: "border-purple-200 dark:border-purple-800",
        hover: "hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900 dark:hover:text-purple-300",
        text: "text-purple-600 dark:text-purple-300",
      },
      onClick: () => {
        setNewWalletModalOpen(true);
      },
    }
  ]

  return (
    <div className={cn("relative", className)}>
      <div className="mb-4">
        <h3 className="font-semibold text-lg">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Quickly add transactions or manage your wallets</p>
      </div>
      <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
        {quickActions.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>
      <AddNewTransactionModal
        key={newTransactionType}
        open={newTransactionModalOpen}
        defaultTab={newTransactionType}
        onSave={() => {
          setNewTransactionModalOpen(false);
        }}
        onOpenChange={setNewTransactionModalOpen}
      />
      <AddNewWalletModal
        open={newWalletModalOpen}
        onOpenChange={setNewWalletModalOpen}
        onSave={() => {
          setNewWalletModalOpen(false);
        }}
        onDelete={() => {
          setNewWalletModalOpen(false);
        }}
      />
    </div>
  )
}
