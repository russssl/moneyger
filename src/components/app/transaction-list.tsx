"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { NoItems } from "./no-items"
import { Banknote } from "lucide-react"
import { useEffect, useState } from "react"
import { type Transaction } from "@/server/db/transaction"
import { api } from "@/trpc/react"
import { Button } from "../ui/button"
import AddNewTransactionModal from "./transactions/add-new-transaction-modal"

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  {transaction.transaction_date ? (<TableCell>{transaction.transaction_date?.getDate()}</TableCell>) : <div>-</div>}
                  <TableCell>{transaction.description}</TableCell>

                  {transaction.amount ? (<TableCell className="text-right">${transaction?.amount?.toFixed(2)}</TableCell>) : null}
                  <TableCell>
                    <Badge 
                    // variant={
                    //   transaction.status === 'completed' ? 'default' :
                    //   transaction.status === 'pending' ? 'secondary' : 'destructive'
                    // }
                    >
                    wef
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table> : 
            <div className="p-6 text-center text-muted-foreground">
              <NoItems title="No transactions found" icon={Banknote}/>
            </div>}
          <Button onClick={() => setIsModalOpen(true)} className="w-full">
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

