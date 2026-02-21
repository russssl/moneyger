
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
  button?: { text: string, onClick: () => void, icon?: LucideIcon }
  children?: React.ReactNode
}

export function NoItems({ title, description, icon: Icon, button, children }: NoItemsProps) {
  return (
    <Empty className="border border-dashed h-full flex flex-col p-4 sm:p-6 items-center justify-center gap-4 min-h-[200px]">
      <EmptyHeader className="flex-1 flex flex-col justify-center items-center text-center min-h-0">
        <EmptyMedia variant="icon" className="mb-3 sm:mb-4 flex justify-center items-center">
          <Icon className="h-8 w-8 sm:h-12 sm:w-12" />
        </EmptyMedia>
        <EmptyTitle className="text-sm sm:text-base font-medium text-center">{title}</EmptyTitle>
        {description && (
          <EmptyDescription className="text-xs sm:text-sm mt-1 sm:mt-2 text-center">
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>
      <EmptyContent className="mt-3 sm:mt-4 flex justify-center">
        {children || (button && (
          <Button variant="outline" size="sm" onClick={button.onClick} className="w-full sm:w-auto">
            {button.icon && <button.icon className="h-4 w-4 mr-2" />}
            {button.text}
          </Button>
        ))}
      </EmptyContent>
    </Empty>
  )
}
