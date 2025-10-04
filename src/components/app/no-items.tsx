
import { Button } from "@/components/ui/button"
// lucide icons type 
import type { LucideIcon } from "lucide-react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type NoItemsProps = {
  title: string
  description?: string
  icon: LucideIcon
  button?: { text: string, onClick: () => void }
}

export function NoItems({ title, description, icon: Icon, button }: NoItemsProps) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {Icon ? <Icon /> : null}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && (
          <EmptyDescription>
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>
      <EmptyContent>
        {button && (
          <Button variant="outline" size="sm" onClick={button.onClick}>
            {button.text}
          </Button>
        )}
      </EmptyContent>
    </Empty>
  )
}
