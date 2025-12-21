"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeftRightIcon, ArrowDownIcon, ArrowUpIcon, Banknote, PlusCircle } from "lucide-react"
import { useState } from "react"
import { type TransactionWithCategory } from "@/server/db/transaction"
import { Button } from "@/components/ui/button"
import EditTransactionModal from "@/components/transactions/edit-transaction-modal"
import { formatCurrency } from "@/hooks/currencies"
import { useTranslations } from "next-intl"
import { useIsMobile } from "@/hooks/use-mobile"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useFetch, useMutation } from "@/hooks/use-api"
import { NoItems } from "@/components/common/no-items"
import { Skeleton } from "@/components/ui/skeleton"
import { TransactionItem, TransactionDeleteButton } from "./transaction-item"
import { toast } from "sonner"
import { Icon, type IconName } from "@/components/ui/icon-picker"

export function TransactionList() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchTransactions = useFetch<TransactionWithCategory[]>("/api/transactions", {
    queryKey: ["transactions"],
  });
  const { isLoading, error, refetch, data: transactions } = fetchTransactions;
  
  const t = useTranslations("finances")
  const tGeneral = useTranslations("general")
  const isMobile = useIsMobile()
  
  const removeTransactionMutation = useMutation<{id: string}, any>(
    (data) => `/api/transactions/${data.id}`,
    "DELETE",
    {
      invalidates: [["transactions"], ["wallets"]],
    }
  )
  
  async function handleDeleteTransaction(id: string) {
    if (removeTransactionMutation.isPending) return
    
    const toastId = toast.loading(t("removing_transaction"))
    
    try {
      await removeTransactionMutation.mutateAsync({ id })
      toast.success(t("transaction_removed_successfully"), { id: toastId })
      await refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failed_to_remove_transaction"), { id: toastId })
    }
  }
  

  const getTransactionTypeIcon = (type: string | null) => {
    if (!type) return null;
    switch (type) {
    case "income":
      return <ArrowDownIcon className="w-4 h-4 text-green-500" />
    case "expense":
      return <ArrowUpIcon className="w-4 h-4 text-red-500" />
    case "transfer":
      return <ArrowLeftRightIcon className="w-4 h-4 text-blue-500" />
    default:
      return null
    }
  }

  return (
    <>
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">{t("transactions_title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col px-4 sm:px-6">
          {error && (
            <div className="p-4 text-center text-muted-foreground flex-1 flex justify-center items-center">
              <p>{error.message}</p>
            </div>
          )}
          {isLoading ? (
            <div className="flex-1 flex flex-col">
              {isMobile ? (
                <div className="flex flex-col gap-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 border rounded-lg">
                      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                        <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-2 border-b">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20 ml-auto" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-4 mx-auto" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : transactions && transactions.length > 0 && !isLoading ? (
            <div className="flex-1 flex flex-col">
              {isMobile ? (
                <div className="flex flex-col gap-2.5">
                  {transactions?.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onDelete={handleDeleteTransaction}
                      isDeleting={removeTransactionMutation.isPending}
                    />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">{tGeneral("date")}</TableHead>
                      <TableHead className="text-right">{tGeneral("amount")}</TableHead>
                      <TableHead>{tGeneral("wallet")}</TableHead>
                      <TableHead>{tGeneral("category")}</TableHead>
                      <TableHead className="text-center w-12">{tGeneral("type")}</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="w-24 whitespace-nowrap">
                          {transaction.transaction_date ? (
                            new Date(transaction.transaction_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {transaction.amount ? formatCurrency(transaction.amount, transaction.wallet.currency) : null}
                        </TableCell>
                        <TableCell className="max-w-32 truncate">{transaction.wallet.name}</TableCell>
                        <TableCell className="max-w-40">
                          {transaction.category ? (
                            <div className="flex items-center gap-2">
                              {transaction.category.iconName && (
                                <Icon name={transaction.category.iconName as IconName} className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="truncate">{transaction.category.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center w-12">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex justify-center items-center">
                                  {getTransactionTypeIcon(transaction.type)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {transaction.type ? tGeneral(transaction.type as "expense" | "income" | "transfer") : ""}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-center w-12">
                          <TransactionDeleteButton
                            transactionId={transaction.id}
                            onDelete={handleDeleteTransaction}
                            isDeleting={removeTransactionMutation.isPending}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-3 sm:mt-4 md:mt-6 pt-3 sm:pt-4 border-t">
                <Button onClick={() => setIsModalOpen(true)} className="w-full h-10 sm:h-11">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {t("add_transaction")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <NoItems
                icon={Banknote}
                title={t("no_transactions_found")}
                description={t("no_transactions_found_desc")}
                button={{
                  text: t("add_transaction"),
                  onClick: () => setIsModalOpen(true),
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
      <EditTransactionModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}
