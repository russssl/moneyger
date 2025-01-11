"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button, Group, Input, Label, NumberField } from "react-aria-components";

interface AmountPickerProps {
  value?: number;
  onChange?: (value: number) => void;
  label?: string;
}

export default function AmountPicker({ value, onChange, label = "Amount" }: AmountPickerProps) {
  return (
    <NumberField
      minValue={0}
      value={value}
      onChange={onChange}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <Group className="relative inline-flex h-9 w-full items-center overflow-hidden whitespace-nowrap rounded-lg border border-input text-sm shadow-sm shadow-black/5 transition-shadow data-[focus-within]:border-ring data-[disabled]:opacity-50 data-[focus-within]:outline-none data-[focus-within]:ring-[3px] data-[focus-within]:ring-ring/20">
          <Input className="flex-1 bg-background px-3 py-2 tabular-nums text-foreground focus:outline-none pe-7" />
          <div className="absolute right-0 flex h-full flex-col">
            <Button
              slot="increment"
              className="flex h-1/2 w-6 items-center justify-center border-s border-input bg-background text-sm text-muted-foreground/80 transition-shadow hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronUp size={13} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              slot="decrement"
              className="flex h-1/2 w-6 items-center justify-center border-s border-t border-input bg-background text-sm text-muted-foreground/80 transition-shadow hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronDown size={13} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </Group>
      </div>
    </NumberField>
  );
}
