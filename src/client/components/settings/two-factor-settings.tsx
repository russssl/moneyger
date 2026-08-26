import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/client/components/ui/card"
import { Button } from "@/client/components/ui/button"
import { Input } from "@/client/components/ui/input"
import { Label } from "@/client/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/client/components/ui/input-otp"
import { Shield, ShieldCheck, ShieldAlert, Copy, Check, Lock, QrCode, KeyRound } from "lucide-react"
import { authClient } from "@/client/hooks/auth-client"
import { useAuth } from "@/client/hooks/use-auth"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ErrorAlert } from "@/client/components/common/error-alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/client/components/ui/dialog"
import { Stepper, StepperItem, StepperTrigger, StepperIndicator, StepperSeparator, StepperTitle } from "@/client/components/ui/stepper"
import { useTranslation } from "react-i18next"

export default function TwoFactorSettings() {
  const { t } = useTranslation("settings")
  const { data: session } = useAuth()
  const queryClient = useQueryClient()
  const isEnabled = (session?.user as { twoFactorEnabled?: boolean | null })?.twoFactorEnabled ?? false

  const [code, setCode] = useState("")
  const [totpURI, setTotpURI] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showBackup, setShowBackup] = useState(false)
  const [copied, setCopied] = useState(false)

  // enable flow modal with 3-step stepper: 1 password, 2 QR + backup, 3 verify
  const [showEnableFlow, setShowEnableFlow] = useState(false)
  const [enableStep, setEnableStep] = useState(1)

  // password + disable
  const [password, setPassword] = useState("")
  const [showDisablePassword, setShowDisablePassword] = useState(false)

  const handleEnable = async (pwd: string) => {
    setError("")
    setLoading(true)
    try {
      const res = await (authClient as unknown as { twoFactor: { enable: (opts: { password?: string }) => Promise<{ data?: { totpURI: string; backupCodes: string[] }; error?: { message?: string } }> } }).twoFactor.enable(
        pwd ? { password: pwd } : {}
      )
      if (res.error) {
        setError(res.error.message || t("failed_to_enable_2fa"))
        return false
      }
      if (res.data) {
        setTotpURI(res.data.totpURI)
        setBackupCodes(res.data.backupCodes)
        setEnableStep(2)
        return true
      }
      return false
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed_to_enable_2fa"))
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError(t("enter_6_digit_code_error"))
      return
    }
    setError("")
    setLoading(true)
    try {
      const res = await (authClient as unknown as { twoFactor: { verifyTotp: (opts: { code: string; trustDevice?: boolean }) => Promise<{ error?: { message?: string } }> } }).twoFactor.verifyTotp({
        code,
        trustDevice: false,
      })
      if (res.error) {
        setError(res.error.message || t("invalid_code"))
        return
      }
      toast.success(t("two_factor_enabled_success"))
      setShowEnableFlow(false)
      setEnableStep(1)
      setTotpURI(null)
      setBackupCodes(null)
      setPassword("")
      setCode("")
      setError("")
      await queryClient.invalidateQueries({ queryKey: ["session"] })
    } catch (e) {
      setError(e instanceof Error ? e.message : t("invalid_code"))
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async (pwd: string) => {
    setError("")
    setLoading(true)
    try {
      const res = await (authClient as unknown as { twoFactor: { disable: (opts: { password?: string }) => Promise<{ error?: { message?: string } }> } }).twoFactor.disable(
        pwd ? { password: pwd } : {}
      )
      if (res.error) {
        setError(res.error.message || t("failed_to_disable"))
        return false
      }
      toast.success(t("two_factor_disabled_success"))
      setPassword("")
      await queryClient.invalidateQueries({ queryKey: ["session"] })
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed_to_disable"))
      return false
    } finally {
      setLoading(false)
    }
  }

  const copyBackupCodes = async () => {
    if (!backupCodes) return
    await navigator.clipboard.writeText(backupCodes.join("\n"))
    setCopied(true)
    toast.success(t("backup_codes_copied"))
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Card className="sm:max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            {t("two_factor_authentication")}
          </CardTitle>
          <CardDescription>{t("two_factor_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <ErrorAlert error={error} />}

          {!isEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4" />
                <span>{t("two_factor_not_enabled")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("two_factor_protect_description")}</p>
              <Button
                onClick={() => {
                  setPassword("")
                  setCode("")
                  setTotpURI(null)
                  setBackupCodes(null)
                  setError("")
                  setEnableStep(1)
                  setShowEnableFlow(true)
                }}
                className="w-full h-10"
              >
                {t("enable_2fa")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                <span>{t("enabled_2fa_description")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("backup_codes_shown_once")}</p>
              <Button variant="destructive" onClick={() => { setPassword(""); setError(""); setShowDisablePassword(true) }} disabled={loading} className="w-full h-10">
                {t("disable_2fa")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showBackup} onOpenChange={setShowBackup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("backup_codes_title")}</DialogTitle>
            <DialogDescription>{t("backup_codes_description")}</DialogDescription>
          </DialogHeader>
          {backupCodes && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1.5 p-3 bg-muted rounded-lg">
                {backupCodes.map((c) => (
                  <code key={c} className="text-xs font-mono bg-background px-2 py-1 rounded border text-center">
                    {c}
                  </code>
                ))}
              </div>
              <Button onClick={copyBackupCodes} className="w-full">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? t("copied") : t("copy_all")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEnableFlow}
        onOpenChange={(open) => {
          setShowEnableFlow(open)
          if (!open) {
            setEnableStep(1)
            setError("")
            setTotpURI(null)
            setBackupCodes(null)
            setCode("")
            setPassword("")
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("enable_2fa_title")}</DialogTitle>
            <DialogDescription>{t("enable_2fa_description")}</DialogDescription>
          </DialogHeader>

          <Stepper value={enableStep} className="py-2">
            <StepperItem step={1} className="flex-1">
              <StepperTrigger className="w-full cursor-default" disabled>
                <StepperIndicator>
                  <Lock className="size-3.5" />
                </StepperIndicator>
                <div className="hidden sm:block text-left">
                  <StepperTitle>{t("password_step_title")}</StepperTitle>
                </div>
              </StepperTrigger>
              <StepperSeparator />
            </StepperItem>
            <StepperItem step={2} className="flex-1">
              <StepperTrigger className="w-full cursor-default" disabled>
                <StepperIndicator>
                  <QrCode className="size-3.5" />
                </StepperIndicator>
                <div className="hidden sm:block text-left">
                  <StepperTitle>{t("setup_step_title")}</StepperTitle>
                </div>
              </StepperTrigger>
              <StepperSeparator />
            </StepperItem>
            <StepperItem step={3} className="flex-1">
              <StepperTrigger className="w-full cursor-default" disabled>
                <StepperIndicator>
                  <KeyRound className="size-3.5" />
                </StepperIndicator>
                <div className="hidden sm:block text-left">
                  <StepperTitle>{t("verify_step_title")}</StepperTitle>
                </div>
              </StepperTrigger>
            </StepperItem>
          </Stepper>

          <div>
            {error && <ErrorAlert error={error} className="mb-4" />}

            {enableStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="enable-2fa-password-step">{t("password")}</Label>
                  <Input
                    id="enable-2fa-password-step"
                    type="password"
                    placeholder={t("enter_password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">{t("required_enable_2fa")}</p>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setShowEnableFlow(false)} disabled={loading}>
                    {t("cancel")}
                  </Button>
                  <Button
                    onClick={async () => {
                      const ok = await handleEnable(password)
                      if (ok) {
                        setError("")
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? t("checking") : t("continue")}
                  </Button>
                </div>
              </div>
            )}

            {enableStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("scan_qr_code_with_app")}</p>
                  {totpURI && (
                    <div className="flex justify-center p-3 bg-white rounded-lg border">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpURI)}`}
                        alt="2FA QR code"
                        className="h-[180px] w-[180px]"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground text-center break-all px-2">{totpURI}</p>
                </div>

                {backupCodes && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t("save_backup_codes")}</p>
                      <Button variant="ghost" size="sm" onClick={copyBackupCodes} className="h-7 px-2">
                        {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                        {copied ? t("copied") : t("copy")}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-3 bg-muted rounded-lg">
                      {backupCodes.map((c) => (
                        <code key={c} className="text-xs font-mono bg-background px-2 py-1 rounded border text-center">
                          {c}
                        </code>
                      ))}
                    </div>
                    <div className="flex gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-500">{t("save_now_warning")}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setEnableStep(1)} disabled={loading}>
                    {t("back")}
                  </Button>
                  <Button onClick={() => { setError(""); setEnableStep(3) }} disabled={loading}>
                    {t("next")}
                  </Button>
                </div>
              </div>
            )}

            {enableStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">{t("enter_6_digit_code_from_app")}</p>
                  <p className="text-xs text-muted-foreground text-center">{t("open_authenticator_description")}</p>
                  <div className="flex justify-center py-2">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setEnableStep(2)} disabled={loading}>
                    {t("back")}
                  </Button>
                  <Button onClick={handleVerify} disabled={loading || code.length !== 6}>
                    {loading ? t("verifying") : t("verify_and_enable")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisablePassword} onOpenChange={setShowDisablePassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("disable_2fa_title")}</DialogTitle>
            <DialogDescription>{t("disable_2fa_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && <ErrorAlert error={error} />}
            <div className="space-y-1.5">
              <Label htmlFor="disable-2fa-password">{t("password")}</Label>
              <Input
                id="disable-2fa-password"
                type="password"
                placeholder={t("enter_password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDisablePassword(false)} disabled={loading}>
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  const ok = await handleDisable(password)
                  if (ok) setShowDisablePassword(false)
                }}
                disabled={loading}
              >
                {loading ? t("disabling") : t("disable_2fa")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
