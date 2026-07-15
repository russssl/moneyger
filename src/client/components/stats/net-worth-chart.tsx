
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/client/components/ui/chart"
import { Skeleton } from "@/client/components/ui/skeleton"
import { ErrorAlert } from "@/client/components/common/error-alert"
import { useFetch } from "@/client/hooks/use-api"

type NetWorthPoint = {
  month: string
  netWorth: number
}

const chartConfig = {
  netWorth: {
    label: "Net worth:",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function NetWorthChart({ className }: { className?: string | undefined }) {
  const { data, isLoading, error } = useFetch<NetWorthPoint[]>("/api/stats/net-worth", {
    queryKey: ["stats", "net-worth"],
  })

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Net worth over time</CardTitle>
          <CardDescription>Monthly net worth based on your transactions</CardDescription>
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
          <CardTitle className="text-lg font-semibold">Net worth over time</CardTitle>
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Net worth over time</CardTitle>
        <CardDescription>Monthly net worth aggregated from your transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                dataKey="netWorth"
                type="natural"
                stroke="var(--color-netWorth)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

