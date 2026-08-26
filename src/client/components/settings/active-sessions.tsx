import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/client/hooks/use-auth"
import { authClient } from "@/client/hooks/auth-client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/client/components/ui/card"
import { Button } from "@/client/components/ui/button"
import { Skeleton } from "@/client/components/ui/skeleton"
import { ErrorAlert } from "@/client/components/common/error-alert"
import { Monitor, Smartphone, Tablet, Globe, Clock, LogOut, Trash2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { UAParser } from "ua-parser-js"
import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/client/components/ui/dialog"
import { useTranslation } from "react-i18next"

const REVOKE_MIN_AGE_MS = 5 * 60 * 1000 // 5 minutes — attacker can't immediately revoke after login

type Session = {
  id: string
  token: string
  userId: string
  expiresAt: string | Date
  createdAt: string | Date
  updatedAt: string | Date
  ipAddress?: string | null
  userAgent?: string | null
}

function getDeviceIcon(ua?: string | null) {
  if (!ua) return <Globe className="h-4 w-4" />
  const parser = new UAParser(ua)
  const device = parser.getDevice()
  const type = device.type
  if (type === "mobile") return <Smartphone className="h-4 w-4" />
  if (type === "tablet") return <Tablet className="h-4 w-4" />
  return <Monitor className="h-4 w-4" />
}

function parseUA(ua?: string | null) {
  if (!ua) return "Unknown device"
  const parser = new UAParser(ua)
  const browser = parser.getBrowser()
  const os = parser.getOS()
  const device = parser.getDevice()
  const parts = []
  if (browser.name) parts.push(browser.name + (browser.version ? ` ${browser.version}` : ""))
  if (os.name) parts.push(os.name + (os.version ? ` ${os.version}` : ""))
  if (device.vendor) parts.push(device.vendor)
  if (parts.length === 0) return ua.slice(0, 40)
  return parts.join(" • ")
}

export default function ActiveSessions() {
  const { t } = useTranslation("settings")
  const { t: tService } = useTranslation("service")
  const { t: tGeneral } = useTranslation("general")
  const { data: sessionData } = useAuth()
  const queryClient = useQueryClient()
  const [revokingToken, setRevokingToken] = useState<string | null>(null)
  const [confirmToken, setConfirmToken] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)

  const currentToken = (sessionData?.session as unknown as { token?: string })?.token
  const currentCreatedAt = sessionData?.session?.createdAt ? new Date(sessionData.session.createdAt) : null

  const currentAgeMs = useMemo(() => {
    if (!currentCreatedAt) return Infinity
    return Date.now() - currentCreatedAt.getTime()
  }, [currentCreatedAt])

  const canRevoke = currentAgeMs >= REVOKE_MIN_AGE_MS
  const remainingSec = Math.max(0, Math.ceil((REVOKE_MIN_AGE_MS - currentAgeMs) / 1000))

  const formatRelative = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return t("just_now")
    const min = Math.floor(sec / 60)
    if (min < 60) return t("minutes_ago", { count: min })
    const hr = Math.floor(min / 60)
    if (hr < 24) return t("hours_ago", { count: hr })
    const day = Math.floor(hr / 24)
    return t("days_ago", { count: day })
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await (authClient as unknown as { listSessions: () => Promise<{ data?: Session[]; error?: { message?: string } }> }).listSessions()
      if (res.error) throw new Error(res.error.message || t("unknown_error"))
      return (res.data ?? []) as Session[]
    },
    refetchOnWindowFocus: true,
  })

  const handleRevoke = async (token: string) => {
    if (!canRevoke) {
      const time = remainingSec > 60 ? t("revoke_cooldown_minutes", { count: Math.ceil(remainingSec / 60) }) : t("revoke_cooldown_seconds", { count: remainingSec })
      toast.error(t("revoke_cooldown_toast", { time }))
      return
    }
    setRevokingToken(token)
    try {
      const res = await (authClient as unknown as { revokeSession: (opts: { token: string }) => Promise<{ error?: { message?: string } }> }).revokeSession({ token })
      if (res.error) throw new Error(res.error.message)
      toast.success(t("revoke"))
      await refetch()
      await queryClient.invalidateQueries({ queryKey: ["session"] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("failed_to_revoke"))
    } finally {
      setRevokingToken(null)
      setConfirmToken(null)
    }
  }

  const handleRevokeOthers = async () => {
    if (!canRevoke) {
      const time = remainingSec > 60 ? t("revoke_cooldown_minutes", { count: Math.ceil(remainingSec / 60) }) : t("revoke_cooldown_seconds", { count: remainingSec })
      toast.error(t("revoke_cooldown_toast", { time }))
      return
    }
    setRevokingToken("__all__")
    try {
      const res = await (authClient as unknown as { revokeOtherSessions: () => Promise<{ error?: { message?: string } }> }).revokeOtherSessions()
      if (res.error) throw new Error(res.error.message)
      toast.success(t("revoke_all_other_sessions"))
      await refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("failed_to_revoke"))
    } finally {
      setRevokingToken(null)
      setConfirmAll(false)
    }
  }

  const sessions = data ?? []
  const otherSessions = sessions.filter((s) => s.token !== currentToken)

  return (
    <>
      <Card className="sm:max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            {t("active_sessions")}
          </CardTitle>
          <CardDescription>{t("active_sessions_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canRevoke && (
            <div className="flex gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-500">
                {t("revoke_cooldown", { time: remainingSec > 60 ? t("revoke_cooldown_minutes", { count: Math.ceil(remainingSec / 60) }) : t("revoke_cooldown_seconds", { count: remainingSec }) })}
              </p>
            </div>
          )}

          {error && <ErrorAlert error={error instanceof Error ? error.message : String(error)} />}

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("no_active_sessions")}</p>
          ) : (
            <>
              <div className="space-y-2">
                {sessions.map((s) => {
                  const isCurrent = s.token === currentToken
                  const created = new Date(s.createdAt)
                  return (
                    <div key={s.id} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                      <div className="mt-0.5 p-1.5 rounded-full bg-muted">{getDeviceIcon(s.userAgent)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{parseUA(s.userAgent)}</span>
                          {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium">{t("current")}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {s.ipAddress ? `${s.ipAddress} • ` : ""}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelative(created)} • {tGeneral("expires")} {new Date(s.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {!isCurrent ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={revokingToken === s.token || !canRevoke}
                          onClick={() => setConfirmToken(s.token)}
                          title={!canRevoke ? t("revoke_cooldown", { time: remainingSec > 60 ? t("revoke_cooldown_minutes", { count: Math.ceil(remainingSec / 60) }) : t("revoke_cooldown_seconds", { count: remainingSec }) }) : t("revoke")}
                        >
                          {revokingToken === s.token ? t("revoking") : <><LogOut className="h-3 w-3 mr-1" /> {t("revoke")}</>}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground px-2 py-1">{t("this_device")}</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {otherSessions.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={!!revokingToken || !canRevoke}
                  onClick={() => setConfirmAll(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("revoke_all_other_sessions")}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmToken} onOpenChange={(open) => !open && setConfirmToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("revoke_session_title")}</DialogTitle>
            <DialogDescription>{t("revoke_session_description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmToken(null)}>
              {tService("cancel")}
            </Button>
            <Button variant="destructive" onClick={() => confirmToken && void handleRevoke(confirmToken)} disabled={!!revokingToken}>
              {revokingToken ? t("revoking") : t("revoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmAll} onOpenChange={setConfirmAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("revoke_all_title")}</DialogTitle>
            <DialogDescription>{t("revoke_all_description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAll(false)}>
              {tService("cancel")}
            </Button>
            <Button variant="destructive" onClick={() => void handleRevokeOthers()} disabled={!!revokingToken}>
              {revokingToken === "__all__" ? t("revoking") : t("revoke_all")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
