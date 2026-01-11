"use client"

import { useFetch } from "@/hooks/use-api"
import { type TransactionWithCategory } from "@/server/db/transaction"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"
import PagesHeader from "../pages-header";

export default function TransactionsPage() {
  const t = useTranslations("finances")
  const tGeneral = useTranslations("general")
  const { data: transactions, isLoading } = useFetch<TransactionWithCategory[]>("/api/transactions", {
    queryKey: ["transactions"],
    query: { limit: 1000 }
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
  )
}
