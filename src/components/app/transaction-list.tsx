"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeftRightIcon, ArrowDownIcon, ArrowUpIcon, Banknote, TrashIcon, PlusCircle } from "lucide-react"
import { useState } from "react"
import { type TransactionWithWallet } from "@/server/db/transaction"
import { Button } from "../ui/button"
import AddNewTransactionModal from "./transactions/add-new-transaction-modal"
import { DateTime } from "luxon"
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
  const { isLoading, error } = fetchTransactions;
  let { data: transactions } = fetchTransactions;
  const removeTransactionMutation = useMutation<{id: string}, any>("/api/transactions/", "DELETE")
  

  async function removeTransaction(id: string) {
    if (removeTransactionMutation.isPending) return
      
    const removePromise = () => removeTransactionMutation.mutateAsync({ id: id })
      
    toast.promise(removePromise, {
      loading: "Removing transaction...",
      success: "Transaction removed successfully",
      error: (error) => error instanceof Error ? error.message : "Failed to remove transaction",
    })

    // update list
    transactions = transactions?.filter(transaction => transaction.id !== id) ?? []
  }

  const t = useTranslations("finances")
  const tGeneral = useTranslations("general")


  function updateList(_newItem: TransactionWithWallet) {
    // setTransactions([...transactions, newItem])
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
          ) : transactions && transactions.length > 0 ? (
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
                          DateTime.fromJSDate(transaction.transaction_date).toFormat("dd/MM/yy")
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
              <Button onClick={() => setIsModalOpen(true)} className="w-full mt-4">
                <PlusCircle className="w-4 h-4 mr-2" />
                {t("add_transaction")}
              </Button>
            </div>
          ) : (
            // <div className="flex-1 flex flex-col items-center justify-center py-10 rounded-lg bg-muted/40 border border-dashed border-border/50 p-3">
            //   <div className="mb-3 flex items-center justify-center w-16 h-16 rounded-full bg-muted">
            //     <Banknote className="w-8 h-8 text-muted-foreground/50" />
            //   </div>
            //   <div className="text-lg font-semibold text-muted-foreground mb-1">
            //     No transactions found
            //   </div>
            //   <div className="text-sm text-muted-foreground/70 text-center max-w-xs">
            //     Start by adding your first transaction to track your spending and income.
            //   </div>
            // </div>
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
        onSave={updateList}
      />
    </>
  )
}
