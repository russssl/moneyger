import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { signUp, sendVerificationEmail as resendVerification } from "@/client/hooks/use-session";
import LoadingButton from "@/client/components/common/loading-button";
import { useTranslation } from "react-i18next";
import PasswordsInput from "@/client/components/auth/passwords-input";
import { ErrorAlert } from "@/client/components/common/error-alert";
import { Button } from "@/client/components/ui/button";
import { MailCheck } from "lucide-react";

export default function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const [pendingVerification, setPendingVerification] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const { t } = useTranslation("register_login");


  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleResend = async () => {
    setResendLoading(true)
    setError("")
    setResendSuccess(false)
    try {
      const res = await resendVerification({ email, callbackURL: "/" })
      if ((res as unknown as { error?: { message?: string } })?.error) {
        setError((res as unknown as { error: { message?: string } }).error.message ?? t("unknown_error"))
      } else {
        setResendSuccess(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("unknown_error"))
    } finally {
      setResendLoading(false)
    }
  }

  const register = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    setError("")
    await signUp.email(
      {
        name, email, password: password.toString(),
        callbackURL: "/",
        fetchOptions: {
          onResponse: () => {
            setIsSubmitting(false);
          },
          onRequest: () => {
            setIsSubmitting(true);
          },
          onError: (ctx) => {
            if (ctx.error.code === "PASSWORD_COMPROMISED") {
              setError(t("password_compromised"));
            } else {
              setError(ctx.error.message);
            }
          },
          onSuccess: async (ctx) => {
            // When REQUIRES_EMAIL_CONFIRMATION is true, better-auth returns token:null and no session
            const data = ctx.data as unknown as { token?: string | null } | undefined
            const tokenIsNull = data?.token === null
            if (tokenIsNull) {
              setPendingVerification(true)
              return
            }
            await queryClient.invalidateQueries({ queryKey: ["session"] });
            void navigate({ to: "/" });
          },
        }});
  };

  if (pendingVerification) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold">{t("verify_email_title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("verify_email_description", { email })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("verify_email_instruction")}
          </p>
        </div>
        {error && <ErrorAlert error={error} />}
        {resendSuccess && (
          <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-3 text-sm text-green-700 dark:text-green-300">
            {t("verification_email_sent")}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <LoadingButton loading={resendLoading} onClick={handleResend} variant="outline" className="w-full">
            {t("resend_verification_email")}
          </LoadingButton>
          <Button variant="ghost" onClick={() => setPendingVerification(false)} className="w-full">
            {t("back_to_register")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={register} noValidate>
      {error && <ErrorAlert error={error} />}

      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            {t("name")}
          </Label>
          <Input
            id="name"
            placeholder={t("name")}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-10 text-[16px] sm:text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email")}
            required
            className="h-10 text-[16px] sm:text-sm"
          />
        </div>
        <PasswordsInput setPassword={setPassword}/>
      </div>
      <LoadingButton loading={isSubmitting} className="w-full h-10 text-sm font-medium" disabled={isSubmitting} variant="default" type="submit">
        {t("register")}
      </LoadingButton>
    </form>
  )
}
