"use client";

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface AmountPickerProps {
  value?: number
  onChange?: (value: number) => void
  label?: string
  currencySymbol?: string
}

export default function AmountPicker({ value = 0, onChange, currencySymbol }: AmountPickerProps) {
  const handleIncrement = () => onChange?.(value + 1)
  const handleDecrement = () => onChange?.(value - 1)

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex">
        {currencySymbol && (
          <div className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
            {currencySymbol}
          </div>
        )}
        <div className="relative flex-1">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className={cn(
              "pr-7",
              currencySymbol ? "rounded-l-none" : "rounded-l-md"
            )}
          />
          <div className="absolute right-0 top-0 flex h-full flex-col border-l">
            <Button
              variant="ghost"
              size="icon"
              className="h-1/2 rounded-none rounded-tr-md border-b px-2 hover:bg-accent hover:text-accent-foreground"
              onClick={handleIncrement}
            >
              <ChevronUpIcon className="h-3 w-3" />
              <span className="sr-only">Increase</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-1/2 rounded-none rounded-br-md px-2 hover:bg-accent hover:text-accent-foreground"
              onClick={handleDecrement}
            >
              <ChevronDownIcon className="h-3 w-3" />
              <span className="sr-only">Decrease</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
