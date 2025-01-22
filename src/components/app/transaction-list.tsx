"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NoItems } from "./no-items"
import { ArrowLeftRightIcon, ArrowDownIcon, ArrowUpIcon, Banknote } from "lucide-react"
import { useEffect, useState } from "react"
import { type Transaction } from "@/server/db/transaction"
import { api } from "@/trpc/react"
import { Button } from "../ui/button"
import AddNewTransactionModal from "./transactions/add-new-transaction-modal"
import { DateTime } from "luxon"
import { formatCurrency } from "@/hooks/currencies"
export function TransactionList() {
  const [transactions, setTransactions] = useState<(Transaction & { currency: string | null, walletName: string | null })[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: transactionsData, isLoading } = api.transactions.getTransactions.useQuery()

  useEffect(() => {
    if (transactionsData) {
      setTransactions(transactionsData)
    }
  }, [transactionsData])

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Wallet</TableHead>
                <TableHead className="text-right">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  {transaction.transaction_date ? (<TableCell>{DateTime.fromJSDate(transaction.transaction_date).toFormat("dd/MM/yy")}</TableCell>) : <div>-</div>}
                  <TableCell>{transaction.description}</TableCell>

                  {transaction.amount ? (<TableCell className="text-right">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </TableCell>) : null}
                  <TableCell className="text-right">{transaction.walletName}</TableCell>
                  <TableCell>
                    <div className="flex justify-center items-center">
                      {transaction.type === "income" && <ArrowDownIcon className="w-4 h-4 text-green-500" />}
                      {transaction.type === "expense" && <ArrowUpIcon className="w-4 h-4 text-red-500" />}
                      {transaction.type === "transfer" && <ArrowLeftRightIcon className="w-4 h-4 text-blue-500" />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table> : 
            <div className="p-6 text-center text-muted-foreground">
              <NoItems title="No transactions found" icon={Banknote}/>
            </div>}
          <Button onClick={() => setIsModalOpen(true)} className="w-full mt-4">
            Add New Transaction
          </Button>
        </CardContent>
      </Card>
      <AddNewTransactionModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}

