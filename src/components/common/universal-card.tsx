import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type CardSize = "sm" | "md" | "lg" | "full";

interface UniversalCardProps {
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  size?: CardSize
}

export function UniversalCard({ 
  title, 
  description, 
  children, 
  footer, 
  className = "",
  size = "md" 
}: UniversalCardProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    full: "w-full"
  }

  return (
    <Card className={cn(
      "overflow-hidden rounded-xl shadow-lg",
      sizeClasses[size],
      className
    )}>
      {(title ?? description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}

