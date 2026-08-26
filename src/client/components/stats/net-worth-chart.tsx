import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/client/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/client/components/ui/chart"
import { Skeleton } from "@/client/components/ui/skeleton"
import { ErrorAlert } from "@/client/components/common/error-alert"
import { useFetch } from "@/client/hooks/use-api"
import { StatCard, StatCardLabel, StatCardValue, StatCardDelta } from "@/client/components/ui/stat-card"
import { useTranslation } from "react-i18next"

type NetWorthPoint = {
  month: string
  netWorth: number
}

export default function NetWorthChart({ className }: { className?: string | undefined }) {
  const { t } = useTranslation("finances")
  const chartConfig = {
    netWorth: {
      label: t("net_worth_over_time") + ":",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  const { data, isLoading, error } = useFetch<NetWorthPoint[]>("/api/stats/net-worth", {
    queryKey: ["stats", "net-worth"],
  })

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t("net_worth_over_time")}</CardTitle>
          <CardDescription>{t("net_worth_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t("net_worth_over_time")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorAlert error={error} />
        </CardContent>
      </Card>
    )
  }

  const chartData =
    data?.map((point) => {
      const d = new Date(point.month)
      const label = Number.isNaN(d.getTime())
        ? point.month
        : `${d.toLocaleString(undefined, { month: "short" })} ${d.getFullYear()}`
      return { ...point, label }
    }) ?? []

  const latest = chartData[chartData.length - 1]
  const previous = chartData[chartData.length - 2]
  const delta =
    latest && previous ? latest.netWorth - previous.netWorth : undefined
  const trend: "up" | "down" | "flat" | undefined =
    delta === undefined ? undefined : delta > 0 ? "up" : delta < 0 ? "down" : "flat"

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t("net_worth_over_time")}</CardTitle>
        <CardDescription>{t("net_worth_description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {chartData.length > 0 && latest && (
          <StatCard className="border-0 p-0 shadow-none gap-1.5">
            <StatCardLabel>{t("current_net_worth")}</StatCardLabel>
            <div className="flex items-baseline gap-3">
              <StatCardValue className="text-2xl">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(latest.netWorth)}
              </StatCardValue>
              {trend && delta !== undefined && (
                <StatCardDelta trend={trend}>
                  {delta > 0 ? "+" : ""}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(delta)}{" "}
                  {t("vs_last_month")}
                </StatCardDelta>
              )}
            </div>
          </StatCard>
        )}
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_data_yet")}</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line dataKey="netWorth" type="monotone" stroke="var(--color-netWorth)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
