import React from "react"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type NoItemsSize = "xs" | "sm" | "md" | "lg"

interface NoItemsProps {
  icon?: LucideIcon
  title: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  children?: React.ReactNode
  className?: string
  size?: NoItemsSize
}

export function NoItems({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
  children,
  className,
  size = "md",
}: NoItemsProps) {
  const sizeClasses = {
    xs: {
      container: "p-2 max-w-[200px]",
      iconWrapper: "w-8 h-8 mb-2",
      icon: "w-4 h-4",
      title: "text-sm mb-1",
      description: "text-xs mb-2",
    },
    sm: {
      container: "p-4 max-w-xs",
      iconWrapper: "w-12 h-12 mb-3",
      icon: "w-6 h-6",
      title: "text-lg mb-1",
      description: "text-sm mb-3",
    },
    md: {
      container: "p-6 max-w-sm",
      iconWrapper: "w-14 h-14 mb-4",
      icon: "w-7 h-7",
      title: "text-xl mb-2",
      description: "text-base mb-4",
    },
    lg: {
      container: "p-8 max-w-md",
      iconWrapper: "w-16 h-16 mb-5",
      icon: "w-8 h-8",
      title: "text-2xl mb-3",
      description: "text-lg mb-5",
    },
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-full text-center",
      "border-2 border-dashed border-gray-300 rounded-lg",
      "bg-background",
      sizeClasses[size].container,
      className
    )}>
      {Icon && (
        <div className={cn(
          "flex items-center justify-center rounded-full bg-primary/10",
          sizeClasses[size].iconWrapper
        )}>
          <Icon className={cn("text-primary", sizeClasses[size].icon)} />
        </div>
      )}
      <h3 className={cn("font-semibold text-foreground", sizeClasses[size].title)}>{title}</h3>
      {description && (
        <p className={cn("text-muted-foreground", sizeClasses[size].description)}>{description}</p>
      )}
      {buttonText && onButtonClick && (
        <Button 
          onClick={onButtonClick} 
          size={size === "lg" ? "lg" : size === "xs" ? "sm" : size === "sm" ? "sm" : "sm"}
          className={size === "xs" ? "text-xs py-1 px-2 h-auto" : ""}
        >
          {buttonText}
        </Button>
      )}
      {children}
    </div>
  )
}

