import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { PublicLayout } from "@/client/components/public-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/client/components/ui/card"
import { Button } from "@/client/components/ui/button"
import LoadingButton from "@/client/components/common/loading-button"
import { ErrorAlert } from "@/client/components/common/error-alert"
import { CheckCircle, XCircle, MailCheck } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { t } = useTranslation("register_login")
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
  const token = searchParams.get("token")
  const callbackURL = searchParams.get("callbackURL") || "/"
  const errorParam = searchParams.get("error")

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle")
  const [error, setError] = useState<string>("")
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (errorParam) {
      setStatus("error")
      if (errorParam === "TOKEN_EXPIRED") setError(t("verification_token_expired"))
      else if (errorParam === "INVALID_TOKEN") setError(t("verification_invalid_token"))
      else setError(errorParam)
      return
    }
    if (!token) {
      setStatus("error")
      setError(t("verification_missing_token"))
      return
    }
    let cancelled = false
    const verify = async () => {
      setStatus("verifying")
      try {
        const url = `/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent(callbackURL)}`
        const res = await fetch(url, { method: "GET", credentials: "include" })
        // better-auth may redirect (302) to callbackURL on success; fetch follows redirect
        // If final response is redirect to callbackURL, we treat as success
        if (cancelled) return
        if (res.ok) {
          const contentType = res.headers.get("content-type") || ""
          if (contentType.includes("application/json")) {
            const data = await res.json().catch(() => null)
            if (data?.status || res.status === 200) {
              setStatus("success")
              await queryClient.invalidateQueries({ queryKey: ["session"] })
              return
            }
          } else {
            // Non-JSON but ok (maybe redirected HTML) — treat as success if no error
            setStatus("success")
            await queryClient.invalidateQueries({ queryKey: ["session"] })
            return
          }
          setStatus("success")
          await queryClient.invalidateQueries({ queryKey: ["session"] })
        } else {
          let message = t("verification_failed")
          try {
            const data = await res.json()
            message = data?.message || data?.error || message
          } catch {}
          setError(message)
          setStatus("error")
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : t("unknown_error"))
        setStatus("error")
      }
    }
    void verify()
    return () => {
      cancelled = true
    }
  }, [token, callbackURL, errorParam, t, queryClient])

  useEffect(() => {
    if (status !== "success") return
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          void navigate({ to: callbackURL as never })
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [status, callbackURL, navigate])

  return (
    <PublicLayout>
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {status === "verifying" && <MailCheck className="h-6 w-6 animate-pulse text-muted-foreground" />}
              {status === "success" && <CheckCircle className="h-6 w-6 text-green-600" />}
              {status === "error" && <XCircle className="h-6 w-6 text-destructive" />}
              {status === "idle" && <MailCheck className="h-6 w-6 text-muted-foreground" />}
            </div>
            <CardTitle className="text-xl">
              {status === "verifying" && t("verifying_email")}
              {status === "success" && t("email_verified_title")}
              {status === "error" && t("verification_failed_title")}
              {status === "idle" && t("verify_email_title")}
            </CardTitle>
            <CardDescription>
              {status === "verifying" && t("verifying_email_desc")}
              {status === "success" && t("email_verified_desc")}
              {status === "error" && (error || t("verification_failed_desc"))}
              {status === "idle" && t("verify_email_instruction")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "error" && error && <ErrorAlert error={error} />}
            {status === "success" && (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("redirecting_in", { count: countdown })}
                </p>
                <Button onClick={() => void navigate({ to: callbackURL as never })} className="w-full">
                  {t("continue")}
                </Button>
              </div>
            )}
            {status === "error" && (
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">{t("back_to_login")}</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/register">{t("register")}</Link>
                </Button>
              </div>
            )}
            {status === "verifying" && (
              <div className="flex justify-center py-2">
                <LoadingButton loading className="w-full" disabled>
                  {t("verifying_email")}
                </LoadingButton>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
