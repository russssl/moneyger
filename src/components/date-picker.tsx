"use client"

import { DateTime } from "luxon"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  closeOnSelect?: boolean;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, closeOnSelect = true, placeholder }: DatePickerProps) {
  const [open, setOpen] = useState<boolean>(false)

  /**
   * Checks if the given date matches the preset type.
   * @param date The date to check.
   * @param preset "today" | "yesterday" | "tomorrow"
   */
  const isPresetSelected = (date: Date | undefined, preset: "today" | "yesterday" | "tomorrow") => {
    if (!date) return false;
    const target = DateTime.now().plus({
      days: preset === "tomorrow" ? 1 : preset === "yesterday" ? -1 : 0,
    });
    return DateTime.fromJSDate(date).toFormat("yyyy-MM-dd") === target.toFormat("yyyy-MM-dd");
  };

  return (
    <div className="flex flex-col space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            {value ? (
              // format(value, "PPP")
              DateTime.fromJSDate(value).toFormat("PPP")
            ) : (
              <span>{placeholder}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="pb-3 pt-2 px-2 flex flex-wrap gap-2">
            <div className="flex flex-row gap-2">
              <Button
                variant={ isPresetSelected(value, "today") ? "default" : "secondary" }
                size="sm"
                disabled={ value ? isPresetSelected(value, "today") : false }
                className="rounded-full px-3"
                onClick={() => {
                  onChange?.(new Date());
                  if (closeOnSelect) setOpen(false);
                }}
              >
                Today
              </Button>
              <Button
                variant={ isPresetSelected(value, "yesterday") ? "default" : "secondary"}
                size="sm"
                disabled={
                  value ? isPresetSelected(value, "yesterday") : false }
                className="rounded-full px-3"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  onChange?.(yesterday);
                  if (closeOnSelect) setOpen(false);
                }}
              >
                Yesterday
              </Button>
              <Button
                variant={ isPresetSelected(value, "tomorrow") ? "default" : "secondary"}
                size="sm"
                disabled={ value ? isPresetSelected(value, "tomorrow") : false }
                className="rounded-full px-3"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  onChange?.(tomorrow);
                  if (closeOnSelect) setOpen(false);
                }}
              >
                Tomorrow
              </Button>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date)
              if (closeOnSelect) {
                setOpen(false)
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
