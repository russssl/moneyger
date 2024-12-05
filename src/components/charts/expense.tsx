/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// above line is added because ts luxon has some issues with types
"use client"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useState } from "react"
const chartData = [
  { month: "January", expenses: 186, income: 2000 },
  { month: "February", expenses: 4212, income: 2000 },
  { month: "March", expenses: 237, income: 2221 },
  { month: "April", expenses: 73, income: 2000 },
  { month: "May", expenses: 209, income: 2000 },
  { month: "June", expenses: 214, income: 2000 },
]

import { DateTime } from "luxon"
const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-1))",
  },
  income: {
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function ExpenseStatsCard() {
  const [from, setFrom] = useState<string | null>()
  // const setRange = (values: Range) => {
  //   const from = DateTime.fromJSDate(values.range.from).toISODate()
  //   if (from !== null && from !== undefined && typeof from === "string") {
  //     setFrom(from)
  //   }
  //   if (values.range.to !== null && values.range.to !== undefined) {
  //     const to = DateTime.fromJSDate(values.range.to).toISODate()
  //     if (to !== null && to !== undefined && typeof to === "string") {
  //       setTo(to)
  //     }
  //   }
  //   console.log(from, to)
  // }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Expense Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="expenses"
              type="natural"
              stroke="var(--color-expenses)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="income"
              type="natural"
              stroke="var(--color-income)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
