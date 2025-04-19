/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// above line is added because ts luxon has some issues with types
"use client"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
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

import { DatePickerWithRange } from "../ui/date-range-picker"
import { type DateRange } from "react-day-picker"

const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-1))",
  },
  income: {
    label: "Incomes",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function ExpenseStatsCard({className}: {className?: string | undefined}) {

  const [,setDate] = useState<DateRange | undefined>();
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Expense Stats</CardTitle>
        <CardDescription>Expenses and incomes</CardDescription>
      </CardHeader>
      <CardContent>
        <DatePickerWithRange onDateChange={(v) => setDate(v)} className="mb-2 w-full"/>
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
