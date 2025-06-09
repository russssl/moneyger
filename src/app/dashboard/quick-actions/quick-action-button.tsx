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
      "flex items-center gap-2 rounded-full whitespace-nowrap transition-all",
      "active:scale-95 touch-manipulation",
      "px-4",
      action.color.border,
      action.color.bg,
      action.color.hover,
    )}
  >
    <action.icon className={cn("h-4 w-4", action.color.text)} />
    <span>{action.name}</span>
  </Button>
  )
}