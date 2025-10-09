"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeftRightIcon, ArrowDownIcon, ArrowUpIcon, Banknote, TrashIcon, PlusCircle } from "lucide-react"
import { useState } from "react"
import { type TransactionWithWallet } from "@/server/db/transaction"
import { Button } from "../ui/button"
import AddNewTransactionModal from "./transactions/add-new-transaction-modal"
import { formatCurrency } from "@/hooks/currencies"
import { LoadingSpinner } from "../ui/loading"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

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
  

  async function removeTransaction(id: string) {
    if (removeTransactionMutation.isPending) return
      
    toast.promise(removeTransactionMutation.mutateAsync({ id: id }), {
      loading: "Removing transaction...",
      success: "Transaction removed successfully",
      error: (error) => error instanceof Error ? error.message : "Failed to remove transaction",
    })
  
    await refetch()
  }

  const t = useTranslations("finances")
  const tGeneral = useTranslations("general")

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tGeneral("date")}</TableHead>
                    <TableHead className="text-right">{tGeneral("amount")}</TableHead>
                    <TableHead className="text-right">{tGeneral("wallet")}</TableHead>
                    <TableHead className="text-right">{tGeneral("type")}</TableHead>
                    <TableHead></TableHead>
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
                      <TableCell className="text-right">
                        {transaction.amount ? formatCurrency(transaction.amount, transaction.wallet.currency) : null}
                      </TableCell>
                      <TableCell className="text-right">{transaction.wallet.name}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex justify-center items-center">
                                {transaction.type === "income" && <ArrowDownIcon className="w-4 h-4 text-green-500" />}
                                {transaction.type === "expense" && <ArrowUpIcon className="w-4 h-4 text-red-500" />}
                                {transaction.type === "transfer" && <ArrowLeftRightIcon className="w-4 h-4 text-blue-500" />}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {tGeneral(transaction.type)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Button variant="destructive" size="icon" onClick={async () => await removeTransaction(transaction.id)} disabled={removeTransactionMutation.isPending}>
                          {removeTransactionMutation.isPending ? <LoadingSpinner className="w-4 h-4 text-white" /> : <TrashIcon className="w-4 h-4 text-white" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6 pt-4 border-t">
                <Button onClick={() => setIsModalOpen(true)} className="w-full">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {t("add_transaction")}
                </Button>
              </div>
            </div>
          ) : (
            <NoItems
              icon={Banknote}
              title="No transactions found"
              description="Start by adding your first transaction to track your spending and income."
              button={{
                text: "Add transaction",
                onClick: () => setIsModalOpen(true),
              }}
            />
          )}
        </CardContent>
      </Card>
      <AddNewTransactionModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={async () => await refetch()}
      />
    </>
  )
}
