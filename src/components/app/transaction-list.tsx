"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeftRightIcon, ArrowDownIcon, ArrowUpIcon, Banknote, TrashIcon, PlusCircle } from "lucide-react"
import { useState } from "react"
import { type TransactionWithWallet } from "@/server/db/transaction"
import { Button } from "../ui/button"
import EditTransactionModal from "@/components/app/transactions/edit-transaction-modal"
import { formatCurrency } from "@/hooks/currencies"
import { LoadingSpinner } from "../ui/loading"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useIsMobile } from "@/hooks/use-mobile"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useFetch, useMutation } from "@/hooks/use-api"
import { NoItems } from "./no-items"

export function TransactionList() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchTransactions = useFetch<TransactionWithWallet[]>("/api/transactions");
  const { isLoading, error, refetch, data: transactions } = fetchTransactions;
  const removeTransactionMutation = useMutation<{id: string}, any>("/api/transactions/", "DELETE")
  

  const t = useTranslations("finances")
  const tGeneral = useTranslations("general")
  const isMobile = useIsMobile()

  async function removeTransaction(id: string) {
    if (removeTransactionMutation.isPending) return
      
    toast.promise(removeTransactionMutation.mutateAsync({ id: id }), {
      loading: t("removing_transaction"),
      success: t("transaction_removed_successfully"),
      error: (error) => error instanceof Error ? error.message : t("failed_to_remove_transaction"),
    })
  
    await refetch()
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
        <CardHeader>
          <CardTitle>{t("transactions_title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {error && (
            <div className="p-4 text-center text-muted-foreground flex-1 flex justify-center items-center">
              <p>{error.message}</p>
            </div>
          )}
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground flex-1 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6" />
            </div>
          ) : transactions && transactions.length > 0 && !isLoading ? (
            <div className="flex-1 flex flex-col">
              {isMobile ? (
                <div className="flex flex-col gap-3">
                  {transactions?.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getTransactionTypeIcon(transaction.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {transaction.amount ? formatCurrency(transaction.amount, transaction.wallet.currency) : "-"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {transaction.wallet.name}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.transaction_date ? (
                              new Date(transaction.transaction_date).toLocaleDateString()
                            ) : (
                              "-"
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="flex-shrink-0 ml-2"
                        onClick={async () => await removeTransaction(transaction.id)} 
                        disabled={removeTransactionMutation.isPending}
                      >
                        {removeTransactionMutation.isPending ? <LoadingSpinner className="w-4 h-4 text-white" /> : <TrashIcon className="w-4 h-4 text-white" />}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tGeneral("date")}</TableHead>
                      <TableHead className="text-right w-32">{tGeneral("amount")}</TableHead>
                      <TableHead className="text-right w-32">{tGeneral("wallet")}</TableHead>
                      <TableHead className="text-center w-20">{tGeneral("type")}</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {transaction.transaction_date ? (
                            new Date(transaction.transaction_date).toLocaleDateString()
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right w-32">
                          {transaction.amount ? formatCurrency(transaction.amount, transaction.wallet.currency) : null}
                        </TableCell>
                        <TableCell className="text-right w-32 truncate">{transaction.wallet.name}</TableCell>
                        <TableCell className="text-center w-20">
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
                        <TableCell className="text-center w-16">
                          <Button variant="destructive" size="icon" onClick={async () => await removeTransaction(transaction.id)} disabled={removeTransactionMutation.isPending}>
                            {removeTransactionMutation.isPending ? <LoadingSpinner className="w-4 h-4 text-white" /> : <TrashIcon className="w-4 h-4 text-white" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
                <Button onClick={() => setIsModalOpen(true)} className="w-full">
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
        onSave={async () => await refetch()}
      />
    </>
  )
}
