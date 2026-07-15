import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/client/components/ui/card";
import { ErrorAlert } from "@/client/components/common/error-alert";

import { Link } from "@tanstack/react-router"
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { signUp } from "@/client/hooks/use-session";
import LoadingButton from "@/client/components/common/loading-button";
import {ThemeToggle} from "@/client/components/common/theme-toggle";
import {LanguageToggle} from "@/client/components/common/language-select";
import { useTranslation } from "react-i18next";
import PasswordsInput from "@/client/components/auth/passwords-input";

export default function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const { t } = useTranslation("register_login");


  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["session"] });
            navigate({ to: "/" });
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
          {error && <ErrorAlert error={error} className="mb-2" />}

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
            <LoadingButton loading={isSubmitting} className="w-full text-white" disabled={isSubmitting} variant="success" type="submit">
              {t("register")}
            </LoadingButton>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t("already_have_account")}{" "}
            <Link to="/login" className="text-blue-500 ml-2">
              {t("login")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}