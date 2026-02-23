import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return String(error)
}

interface ErrorAlertProps {
  /** Error instance, string, or null (hidden when null) */
  error: Error | string | null | undefined
  /** Optional title; defaults to "Error" */
  title?: string
  className?: string
}

export function ErrorAlert({ error, title = "Error", className }: ErrorAlertProps) {
  if (error == null) return null
  const message = getErrorMessage(error)
  if (!message) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}