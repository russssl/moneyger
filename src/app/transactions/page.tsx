"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useFetch } from "@/hooks/use-api"
import { type TransactionWithCategory } from "@/server/db/transaction"
import { type Wallet } from "@/server/db/wallet"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorAlert } from "@/components/common/error-alert"
import { useTranslations } from "next-intl"
import PagesHeader from "../pages-header"
import DatePicker from "@/components/common/date-picker"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { DateTime } from "luxon"

type TransactionsResponse = {
  items: TransactionWithCategory[];
  total: number;
  limit: number;
  offset: number;
};

const DEFAULT_PAGE_SIZE = 20;

function parsePageSize(v: string | null): number {
  const n = parseInt(v ?? "", 10);
  return Number.isNaN(n) || n < 1 ? DEFAULT_PAGE_SIZE : Math.min(500, n);
}
function parsePage(v: string | null): number {
  const n = parseInt(v ?? "", 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

export default function TransactionsPage() {
  const t = useTranslations("finances");
  const tGeneral = useTranslations("general");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const walletId = searchParams.get("walletId") ?? "";
  const dateStr = searchParams.get("date") ?? "";
  const description = searchParams.get("description") ?? "";
  const pageSize = parsePageSize(searchParams.get("pageSize"));
  const page = parsePage(searchParams.get("page"));
  const type = searchParams.get("type") ?? "";

  const selectedDate = dateStr ? DateTime.fromFormat(dateStr, "yyyy-MM-dd").toJSDate() : undefined;
  const offset = (page - 1) * pageSize;

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      });
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const { data: wallets } = useFetch<Wallet[]>("/api/wallets", { queryKey: ["wallets"] });
  const walletOptions = Array.isArray(wallets) ? wallets : [];

  const {
    data: transactions,
    isLoading,
    error,
  } = useFetch<TransactionsResponse>("/api/transactions", {
    queryKey: ["transactions", { walletId, date: dateStr, description, type: type || undefined, pageSize, offset }],
    query: {
      walletId: walletId || undefined,
      transaction_date: dateStr || undefined,
      description: description || undefined,
      type: (type === "income" || type === "expense" || type === "transfer") ? type : undefined,
      limit: pageSize,
      offset,
    },
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
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 min-w-0 sm:max-w-[200px] space-y-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-4 rounded-md border">
              <div className="flex items-center justify-between gap-4 p-4 border-b">
                <Skeleton className="h-9 max-w-sm w-full" />
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="p-0">
                <div className="flex border-b px-4 py-2 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-4 flex-1 min-w-0" />
                  ))}
                </div>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex border-b px-4 py-3 gap-4 last:border-b-0">
                    <Skeleton className="h-4 w-[100px] flex-shrink-0" />
                    <Skeleton className="h-4 flex-1 min-w-[120px]" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-[70px]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <ErrorAlert error={error instanceof Error ? error : (error ? tGeneral("something_went_wrong") : null)} />
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-wrap gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 min-w-0 sm:max-w-[200px]">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">{tGeneral("wallet")}</label>
                  <Select value={walletId || "all"} onValueChange={(v) => updateParams({ walletId: v === "all" ? undefined : v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tGeneral("all_wallets")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tGeneral("all_wallets")}</SelectItem>
                      {walletOptions.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-0 sm:min-w-[200px]">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">{tGeneral("date")}</label>
                  <div className="flex gap-1.5 items-center">
                    <div className="min-w-0 flex-1">
                      <DatePicker
                        value={selectedDate}
                        onChange={(d) => updateParams({ date: d ? DateTime.fromJSDate(d).toFormat("yyyy-MM-dd") : undefined })}
                        placeholder={tGeneral("select_date")}
                      />
                    </div>
                    {dateStr && (
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => updateParams({ date: undefined })} title="Clear date" aria-label="Clear date">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 sm:max-w-[200px]">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">{tGeneral("type")}</label>
                  <Select value={type || "all"} onValueChange={(v) => updateParams({ type: v === "all" ? undefined : v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tGeneral("type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="income">{tGeneral("income")}</SelectItem>
                      <SelectItem value="expense">{tGeneral("expense")}</SelectItem>
                      <SelectItem value="transfer">{tGeneral("transfer")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-0 sm:max-w-[220px]">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">{tGeneral("description")}</label>
                  <Input
                    placeholder={tGeneral("enter_description")}
                    value={description}
                    onChange={(e) => updateParams({ description: e.target.value || undefined })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={transactions?.items ?? []}
              filterColumn="description"
              filterPlaceholder={tGeneral("enter_description")}
              initialPageSize={pageSize}
              totalRowCount={transactions?.total}
            />
            {transactions != null && transactions.total > pageSize && (
              <div className="mt-4 flex items-center justify-between gap-4 px-1 text-sm text-muted-foreground">
                <span>
                  {tGeneral("page_info", {
                    page: String(page),
                    total: String(Math.max(1, Math.ceil(transactions.total / pageSize))),
                  })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: String(page - 1) })}
                    className="rounded border px-2 py-1 hover:bg-muted disabled:opacity-50"
                  >
                    {tGeneral("back")}
                  </button>
                  <button
                    type="button"
                    disabled={page >= Math.ceil(transactions.total / pageSize)}
                    onClick={() => updateParams({ page: String(page + 1) })}
                    className="rounded border px-2 py-1 hover:bg-muted disabled:opacity-50"
                  >
                    {tGeneral("next")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
