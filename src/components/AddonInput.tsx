import { Input } from "@/components/ui/input";
import { useId } from "react";
import { cn } from "@/lib/utils";

export default function AddonInput({ value, setValue, addonText, type, placeholder, className }: 
  { value: string | number, setValue: (value: string) => void, addonText?: string, className?: string, type?: string, placeholder?: string }) {
  const id = useId();
  
  return (
    <div className="*:not-first:mt-2">
      <div className="flex rounded-lg shadow-xs">
        <Input
          id={id}
          className={cn("-me-px rounded-e-none shadow-none", addonText ? "rounded-e-none" : "rounded", className)}
          placeholder={placeholder}
          value={value === 0 ? "" : value}
          type={type}
          onChange={(e) => setValue(e.target.value === "" ? "" : e.target.value)}
        />
        {
          addonText ? 
            <span className="border-input bg-background text-muted-foreground -z-10 inline-flex items-center rounded-e-lg border px-3 text-sm">
              {addonText}
            </span> : null
        }
      </div>
    </div>
  );
}
