"use client"

import { useState } from "react"
import { useFetch } from "@/hooks/use-api"
import { type TransactionWithCategory } from "@/server/db/transaction"
import { type Wallet } from "@/server/db/wallet"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"
import PagesHeader from "../pages-header";
import DatePicker from "@/components/common/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTime } from "luxon"

type TransactionsResponse = {
  items: TransactionWithCategory[];
  total: number;
  limit: number;
  offset: number;
};

const PAGE_LIMIT = 100;

export default function TransactionsPage() {
  const t = useTranslations("finances")
  const tGeneral = useTranslations("general")

  const [selectedWalletId, setSelectedWalletId] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const { data: wallets } = useFetch<Wallet[]>("/api/wallets", {
    queryKey: ["wallets"],
  })

  const walletOptions = Array.isArray(wallets) ? wallets : []

  const formattedDate = selectedDate ? DateTime.fromJSDate(selectedDate).toFormat("yyyy-MM-dd") : undefined
  const {
    data: transactions,
    isLoading,
    error,
  } = useFetch<TransactionsResponse>("/api/transactions", {
    queryKey: ["transactions", { walletId: selectedWalletId, date: formattedDate }],
    query: {
      limit: PAGE_LIMIT,
      walletId: selectedWalletId || undefined,
      transaction_date: formattedDate,
      offset: 0,
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <PagesHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {t("transactions_title")}
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : tGeneral("something_went_wrong")}
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {tGeneral("wallet")}
                  </label>
                  <Select value={selectedWalletId || "all"} onValueChange={setSelectedWalletId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tGeneral("all_wallets")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tGeneral("all_wallets")}</SelectItem>
                      {walletOptions.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {tGeneral("date")}
                  </label>
                  <DatePicker value={selectedDate} onChange={setSelectedDate} placeholder={tGeneral("select_date")} />
                </div>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={transactions?.items || []}
              filterColumn="description"
              filterPlaceholder={tGeneral("enter_description")}
            />
          </>
        )}
      </div>
    </div>
  )
}
