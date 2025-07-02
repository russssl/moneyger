"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import Link from "next/link"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/hooks/use-session";
import LoadingButton from "@/components/loading-button";
import {ThemeToggle} from "@/components/theme-toggle";
import {LanguageToggle} from "@/components/language-select";
import { useTranslations } from "next-intl";
import PasswordsInput from "@/components/passwords-input";

export default function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const t = useTranslations("register_login");


  const router = useRouter();

  const register = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
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
          onSuccess: () => {
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
            <div className="space-y-2">
              <Label htmlFor="name">
                {t("name")}
                <span className="text-destructive ms-1">*</span>
              </Label>
              <Input id="name" placeholder={t("name")} onChange={(e) => setName(e.target.value)}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                {t("email")}
                <span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" onChange={(e) => setEmail(e.target.value)} placeholder={t("email")}/>
            </div>
            <PasswordsInput setPassword={setPassword}/>
            <LoadingButton loading={isSubmitting} className="w-full" disabled={isSubmitting} variant="success" type="submit">
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