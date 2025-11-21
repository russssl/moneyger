"use client"

import { useEffect, useState, useCallback } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AttackModeBanner() {
  const [isUnderAttack, setIsUnderAttack] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const checkAttackStatus = useCallback(async () => {
    try {
      setIsChecking(true)
      const response = await fetch("/api/healthcheck")
      const data = await response.json()
      
      if (response.status === 503 && data.message?.includes("not available")) {
        setIsUnderAttack(true)
      } else {
        setIsUnderAttack(false)
      }
    } catch (error) {
      // If we can't check, assume not under attack
      setIsUnderAttack(false)
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    // Check on mount
    checkAttackStatus()

    // Check every 10 seconds
    const interval = setInterval(checkAttackStatus, 10000)

    return () => clearInterval(interval)
  }, [checkAttackStatus])

  // Also listen for 503 errors from API calls
  useEffect(() => {
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent
      const error = customEvent.detail
      if (error?.status === 503 && error?.message?.includes("not available")) {
        setIsUnderAttack(true)
      }
    }

    window.addEventListener("api-error", handleApiError)
    return () => window.removeEventListener("api-error", handleApiError)
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isUnderAttack) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isUnderAttack])

  return (
    <Dialog open={isUnderAttack} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[500px] border-2 border-destructive z-[10000] [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-bold text-destructive">
              App is not available now
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="pt-4">
          <DialogDescription asChild>
            <span className="text-base text-foreground mb-4 block">
              Our application is currently experiencing high traffic and is temporarily unavailable. 
              Please try again in a few minutes.
            </span>
          </DialogDescription>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="default"
              size="lg"
              onClick={checkAttackStatus}
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Again
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-2">
              The service will automatically restore once the issue is resolved.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

