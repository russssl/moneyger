"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Check, X  } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import Link from "next/link"
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/hooks/use-session";
import LoadingButton from "@/components/loading-button";
import {ThemeToggle} from "@/components/theme-toggle";
import {LanguageToggle} from "@/components/language-select";
import { useTranslations } from "next-intl";
import { checkStrength, getStrengthColor, getStrengthText } from "@/hooks/passwordUtil";
import PasswordInput from "@/components/password-input";

export default function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  
  const [password, setPassword] = useState("")

  const [passwordsMatch, setPasswordsMatch] = useState(false)

  const t = useTranslations("register_login");
  useEffect(() => {
    if (!password) {
      setPasswordsMatch(true)
      return
    }
    setPasswordsMatch(password === confirmPassword && (confirmPassword.length > 0 && password.length > 0))
  }, [password, confirmPassword])

  const router = useRouter();

  const strength = checkStrength(password);

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);

  const register = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    await signUp.email(
      {
        name, email, password: password.toString(), username, surname,
        callbackURL: "/",
        fetchOptions: {
          onResponse: () => {
            setIsSubmitting(false);
          },
          onRequest: () => {
            setIsSubmitting(true);
          },
          onError: (ctx) => {
            console.error("Error", ctx.error.message);
            setError(ctx.error.message);
          },
          onSuccess: async () => {
            router.push("/");
          },
        }});
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">
            {t("register")}
            <div className="flex space-x-3">
              <ThemeToggle/>
              <LanguageToggle />
            </div>
          </CardTitle>
          <CardDescription>{t("register_modal_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {
            error &&
            <Alert variant="destructive" className='mb-2'>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          }

          <form className="space-y-4" onSubmit={register}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t("first_name")}
                  <span className="text-destructive ms-1">*</span>
                </Label>
                <Input id="name" placeholder={t("first_name")} onChange={(e) => setName(e.target.value)}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {t("last_name")}
                  <span className="text-destructive ms-1">*</span>
                </Label>
                <Input id="lastName" placeholder={t("last_name")} onChange={(e) => setSurname(e.target.value)}/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">
                {t("username")}
                <span className="text-destructive ms-1">*</span>
              </Label>
              <Input id="username" placeholder={t("username")} onChange={(e) => setUsername(e.target.value)}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                {t("email")}
                <span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" onChange={(e) => setEmail(e.target.value)}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {t("password")}
                <span className="text-destructive ms-1">*</span>
              </Label>
              <PasswordInput password={password} setPassword={setPassword} placeholder={t("password")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirmation">
                {t("confirm_password")}
                <span className="text-destructive ms-1">*</span>
              </Label>
              <PasswordInput password={confirmPassword} setPassword={setConfirmPassword} placeholder={t("confirm_password")}/>
            </div>
            <div>
              {!passwordsMatch && (
                <div className="flex items-center space-x-2 text-red-500">
                  <AlertCircle size={16} />
                  <span>{t("passwords_do_not_match")}</span>
                </div>
              )}
            </div>
            <div
              className="mb-4 mt-3 h-1 w-full overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuenow={strengthScore}
              aria-valuemin={0}
              aria-valuemax={4}
              aria-label="Password strength"
            >
              <div
                className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
                style={{ width: `${(strengthScore / 4) * 100}%` }}
              ></div>
            </div>
            <p id="password-strength" className="mb-2 text-sm font-medium text-foreground">
              {t(getStrengthText(strengthScore))}. {t("must_contain")}:
            </p>

            <ul className="space-y-1.5" aria-label="Password requirements">
              {strength.map((req, index) => (
                <li key={index} className="flex items-center gap-2">
                  {req.met ? (
                    <Check size={16} className="text-emerald-500" aria-hidden="true" />
                  ) : (
                    <X size={16} className="text-muted-foreground/80" aria-hidden="true" />
                  )}
                  <span className={`text-xs ${req.met ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {t(req.text)}
                    <span className="sr-only">
                      {req.met ? " - Requirement met" : " - Requirement not met"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <LoadingButton loading={isSubmitting} className="w-full" disabled={isSubmitting || !passwordsMatch} variant="success" type="submit">
              {t("register")}
            </LoadingButton>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t("already_have_account")}{" "}
            <Link href="/login" className="text-blue-500 ml-2">
              {t("login")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}