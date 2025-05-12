"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NoItems } from "./no-items"
import { ArrowLeftRightIcon, ArrowDownIcon, ArrowUpIcon, Banknote, TrashIcon, PlusCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { type TransactionWithWallet } from "@/server/db/transaction"
import { api } from "@/trpc/react"
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

export function TransactionList() {
  const [transactions, setTransactions] = useState<TransactionWithWallet[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const { data: transactionsData, isLoading } = api.transactions.getTransactions.useQuery()
  const removeTransactionMutation = api.transactions.deleteTransaction.useMutation()
  
  const t = useTranslations("finances")
  const tGeneral = useTranslations("general")

  useEffect(() => {
    setIsPending(removeTransactionMutation.isPending)
  }, [removeTransactionMutation.isPending])

  useEffect(() => {
    if (transactionsData) {
      setTransactions(transactionsData)
    }
  }, [transactionsData])

  function updateList(newItem: TransactionWithWallet) {
    setTransactions([...transactions, newItem])
  }

  async function removeTransaction(id: string) {
    if (isPending) return
    await removeTransactionMutation.mutateAsync({ id })
    setTransactions(transactions.filter((transaction) => transaction.id !== id))
    toast.success("Transaction is removed")
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("transactions_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground flex justify-center items-center min-h-[220px]">
              <LoadingSpinner className="w-6 h-6" />
            </div>
          ) : transactions.length > 0 ? (
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
                {transactions.map((transaction) => (
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
                      <Button variant="destructive" size="icon" onClick={async () => await removeTransaction(transaction.id)} disabled={isPending}>
                        {isPending ? <LoadingSpinner className="w-4 h-4 text-white" /> : <TrashIcon className="w-4 h-4 text-white" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-muted-foreground min-h-[220px]">
              <NoItems title="No transactions found" icon={Banknote} />
            </div>
          )}
          <Button onClick={() => setIsModalOpen(true)} className="w-full mt-4">
            <PlusCircle className="w-4 h-4 mr-2" />
            {t("add_transaction")}
          </Button>
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
