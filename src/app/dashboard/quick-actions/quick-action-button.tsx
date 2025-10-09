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
      "flex items-center gap-3 rounded-xl whitespace-nowrap transition-all",
      "active:scale-95 touch-manipulation",
      "px-6 py-4 h-14 min-w-fit",
      "border-2 font-medium",
      "shadow-sm hover:shadow-md",
      action.color.border,
      action.color.bg,
      action.color.hover,
    )}
  >
    <action.icon className={cn("h-5 w-5", action.color.text)} />
    <span className="text-sm">{action.name}</span>
  </Button>
  )
}