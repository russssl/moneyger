"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { TransactionWithCategory } from "@/server/db/transaction"
import { DataTableColumnHeader } from "./data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { DateTime } from "luxon"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

const DateHeader = ({ column }: { column: any }) => {
  const t = useTranslations("general")
  return <DataTableColumnHeader column={column} title={t("date")} />
}

const DescriptionHeader = ({ column }: { column: any }) => {
  const t = useTranslations("general")
  return <DataTableColumnHeader column={column} title={t("description")} />
}

const CategoryHeader = ({ column }: { column: any }) => {
  const t = useTranslations("general")
  return <DataTableColumnHeader column={column} title={t("category")} />
}

const TypeHeader = ({ column }: { column: any }) => {
  const t = useTranslations("general")
  return <DataTableColumnHeader column={column} title={t("type")} />
}

const AmountHeader = ({ column }: { column: any }) => {
  const t = useTranslations("general")
  return <DataTableColumnHeader column={column} title={t("amount")} className="justify-end" />
}

export const columns: ColumnDef<TransactionWithCategory>[] = [
  {
    accessorKey: "transaction_date",
    header: DateHeader,
    cell: ({ row }) => {
      const date = row.getValue("transaction_date")
      if (!date) return <div className="w-[100px] font-medium">-</div>
      let dt: DateTime
      if (date instanceof Date) {
        dt = DateTime.fromJSDate(date)
      } else if (typeof date === "string") {
        dt = DateTime.fromISO(date)
      } else if (typeof date === "number") {
        dt = DateTime.fromMillis(date)
      } else if (typeof date === "object" && date !== null && "toISOString" in date) {
        // Handle Date-like objects with toISOString method
        dt = DateTime.fromISO((date as { toISOString: () => string }).toISOString())
      } else {
        // If we can't parse it, show a fallback
        return <div className="w-[100px] font-medium">-</div>
      }
      return <div className="w-[100px] font-medium">{dt.toLocaleString(DateTime.DATE_MED)}</div>
    },
  },
  {
    accessorKey: "description",
    header: DescriptionHeader,
    cell: ({ row }) => {
      return (
        <div className="flex flex-col min-w-[200px]">
          <span className="font-medium">{row.getValue("description")}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.wallet.name}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: CategoryHeader,
    cell: ({ row }) => {
      const category = row.original.category
      if (!category) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          {/* You could add the icon here if you have an icon component */}
          <span>{category.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "type",
    header: TypeHeader,
    cell: ({ row }) => {
      const type = String(row.getValue("type") || "")
      return (
        <div className="w-[80px]">
          <Badge variant={type === "income" ? "default" : "secondary"} className="capitalize">
            {type}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "amount",
    header: AmountHeader,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const type = row.original.type
      const currency = row.original.wallet.currency || "USD"
      
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(Math.abs(amount))

      return (
        <div className={cn(
          "text-right font-medium min-w-[100px]",
          type === "income" ? "text-green-600" : "text-red-600"
        )}>
          {type === "income" ? "+" : "-"}{formatted}
        </div>
      )
    },
  },
]
