"use client"
import { Button } from "@/components/ui/button"
import { TrashIcon, ArrowLeftRightIcon, ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { type TransactionWithCategory } from "@/server/db/transaction"
import { formatCurrency } from "@/hooks/currencies"
import { LoadingSpinner } from "@/components/ui/loading"
import { Icon, type IconName } from "@/components/ui/icon-picker"

interface TransactionItemProps {
  transaction: TransactionWithCategory
  onDelete: (id: string) => Promise<void>
  isDeleting: boolean
}

function getTransactionTypeIcon(type: string | null) {
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

export function TransactionDeleteButton({ transactionId, onDelete, isDeleting }: { transactionId: string; onDelete: (id: string) => Promise<void>; isDeleting: boolean }) {
  return (
    <Button variant="destructive" size="icon" onClick={() => onDelete(transactionId)} disabled={isDeleting}>
      {isDeleting ? <LoadingSpinner className="w-4 h-4 text-white" /> : <TrashIcon className="w-4 h-4 text-white" />}
    </Button>
  )
}

export function TransactionItem({ transaction, onDelete, isDeleting }: TransactionItemProps) {

  return (
    <div className="flex items-center justify-between p-2.5 sm:p-3 border rounded-lg bg-card active:bg-accent/50 transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">
          {getTransactionTypeIcon(transaction.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 sm:mb-1 flex-wrap">
            <span className="font-medium text-sm truncate">
              {transaction.amount ? formatCurrency(transaction.amount, transaction.wallet.currency) : "-"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {transaction.wallet.name}
            </span>
            {transaction.category && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {transaction.category.iconName && (
                  <Icon name={transaction.category.iconName as IconName} className="w-3 h-3" />
                )}
                <span className="truncate">{transaction.category.name}</span>
              </span>
            )}
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
        className="flex-shrink-0 ml-2 h-8 w-8 sm:h-10 sm:w-10"
        onClick={() => onDelete(transaction.id)} 
        disabled={isDeleting}
      >
        {isDeleting ? <LoadingSpinner className="w-4 h-4 text-white" /> : <TrashIcon className="w-4 h-4 text-white" />}
      </Button>
    </div>
  )
}

