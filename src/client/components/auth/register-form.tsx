import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { signUp } from "@/client/hooks/use-session";
import LoadingButton from "@/client/components/common/loading-button";
import { useTranslation } from "react-i18next";
import PasswordsInput from "@/client/components/auth/passwords-input";
import { ErrorAlert } from "@/client/components/common/error-alert";

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
            void navigate({ to: "/" });
          },
        }});
  };

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
