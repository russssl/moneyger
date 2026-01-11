"use client"

import { useFetch } from "@/hooks/use-api"
import { type TransactionWithCategory } from "@/server/db/transaction"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"

export default function TransactionsPage() {
  const t = useTranslations("finances")
  const tGeneral = useTranslations("general")
  const { data: transactions, isLoading } = useFetch<TransactionWithCategory[]>("/api/transactions", {
    queryKey: ["transactions"],
    query: { limit: 1000 }
  })

  console.log("Transactions data:", transactions?.length, transactions);

  return (
    <div className="container mx-auto py-10">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t("transactions_title")}</h2>
        </div>
        <div className="h-full flex-1 flex-col space-y-8 md:flex">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={transactions || []} 
              filterColumn="description"
              filterPlaceholder={tGeneral("enter_description")}
            />
          )}
        </div>
      </div>
    </div>
  )
}
