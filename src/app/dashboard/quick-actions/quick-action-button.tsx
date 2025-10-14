import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export type QuickAction = {
  id: string;
  name: string;
  icon: LucideIcon;
  color: {
    border: string;
    bg: string;
    hover: string;
    text: string;
  };
  onClick: () => void;
}

export default function QuickActionButton({ action }: { action: QuickAction }) {
  return (<Button
    key={action.id}
    variant="outline"
    onClick={action.onClick}
    className={cn(
      "flex items-center gap-2 sm:gap-3 rounded-xl whitespace-nowrap transition-all",
      "active:scale-95 touch-manipulation select-none",
      "px-3 sm:px-6 py-3 sm:py-4 h-12 sm:h-14 min-w-fit",
      "border-2 font-medium",
      "shadow-sm hover:shadow-md active:shadow-lg",
      "focus:ring-2 focus:ring-offset-2 focus:ring-primary/20",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "min-h-[48px] sm:min-h-[56px]", // Ensure minimum touch target size
      action.color.border,
      action.color.bg,
      action.color.hover,
    )}
  >
    <action.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0", action.color.text)} />
    <span className="text-xs sm:text-sm font-medium">{action.name}</span>
  </Button>
  )
}