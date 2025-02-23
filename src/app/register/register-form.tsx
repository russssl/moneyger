"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Check, CircleDollarSign, Eye, EyeOff, X  } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import Link from "next/link"
import { useState, useMemo, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import LoadingButton from "@/components/loading-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { save } from "./register";
import ThemeToggle from "@/components/theme-toggle";
import { useTranslations } from "next-intl";

const checkStrength = (pass: string) => {
  const requirements = [
    { regex: /.{8,}/, text: "character_length" },
    { regex: /[0-9]/, text: "one_number" },
    { regex: /[a-z]/, text: "one_lowercase" },
    { regex: /[A-Z]/, text: "one_special_character" },
  ];

  return requirements.map((req) => ({
    met: req.regex.test(pass),
    text: req.text,
  }));
};


const getStrengthColor = (score: number) => {
  if (score === 0) return "bg-border";
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-500";
  if (score === 3) return "bg-amber-500";
  return "bg-emerald-500";
};

const getStrengthText = (score: number) => {
  if (score === 0) return "enter_password";
  if (score <= 2) return "weak_password";
  if (score === 3) return "medium_password";
  return "strong_password";
};

function FieldErrorAlert({ fieldErrors, name }: { fieldErrors: Record<string, string>, name: string }) {
  return (
    <>
      {fieldErrors[name] && (
        <div className="flex items-center space-x-2 text-red-500">
          <AlertCircle size={16} />
          <span>{fieldErrors[name]}</span>
        </div>
      )}
    </>
  );
}
const passwordButtonStyle = "absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";


export default function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [error, setError] = useState("")
  
  const [password, setPassword] = useState("")
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState<boolean>(false);

  const [passwordsMatch, setPasswordsMatch] = useState(false)

  const toggleVisibility = (isConfirmationField?: boolean) => isConfirmationField ? setIsConfirmVisible((prev) => !prev) : setIsVisible((prev) => !prev);

  const t = useTranslations("register_login");
  useEffect(() => {
    if (!password) {
      setPasswordsMatch(true)
      return
    }
    setPasswordsMatch(password === confirmPassword && (confirmPassword.length > 0 && password.length > 0))
  }, [password, confirmPassword])

  const router = useRouter();

  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const strength = checkStrength(password);

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);

  const register = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({
      name: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: ""
    });

    if (password !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return;
    }

    setIsSubmitting(true)
    try {
      const newUser = await save({name, surname, email, password, username}, currency);
      if (newUser == null) {
        setError("An error occurred. Please try again.");
        return;
      }

      const res = await signIn("credentials", {
        email: newUser.email,
        password: password,
        redirect: false,
      });

      if (!res) {
        setError("An error occurred");
        return;
      }

      if (res.error) {
        setError("An error occurred");
        return;
      }

      if (res.ok) {
        router.push("/");        
      }
    } catch (error: unknown) {
      setError((error as Error).message);
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">
            {t("register")}
            <ThemeToggle />
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
                <FieldErrorAlert fieldErrors={fieldErrors} name="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {t("last_name")}
                  <span className="text-destructive ms-1">*</span>
                </Label>
                <Input id="lastName" placeholder={t("last_name")} onChange={(e) => setSurname(e.target.value)}/>
                {fieldErrors.surname && (
                  <div className="flex items-center space-x-2 text-red-500">
                    <AlertCircle size={16} />
                    <span>{fieldErrors.surname}</span>
                  </div>
                )}
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
              <FieldErrorAlert fieldErrors={fieldErrors} name="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {t("password")}
                <span className="text-destructive ms-1">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  className="pe-9"
                  placeholder={t("password")}
                  type={isVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className={passwordButtonStyle}
                  type="button"
                  onClick={() => toggleVisibility()}
                  aria-label={isVisible ? "Hide password" : "Show password"}
                  aria-pressed={isVisible}
                  aria-controls="password"
                >
                  {isVisible ? (
                    <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Eye size={16} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirmation">
                {t("confirm_password")}
                <span className="text-destructive ms-1">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password-confirmation"
                  className="pe-9"
                  placeholder={t("confirm_password")}
                  type={isConfirmVisible ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  className={passwordButtonStyle}
                  type="button"
                  onClick={() => toggleVisibility(true)}
                  aria-label={isConfirmVisible ? "Hide password" : "Show password"}
                  aria-pressed={isVisible}
                  aria-controls="confirm-password"
                >
                  {isConfirmVisible ? (
                    <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Eye size={16} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="select-17">
                {t("default_currency")} <span className="text-destructive">*</span>
              </Label>
              <Select defaultValue="USD" onValueChange={(value) => setCurrency(value)}>
                <SelectTrigger id="select-17" className="relative ps-9">
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[[disabled]]:opacity-50">
                    <CircleDollarSign size={16} strokeWidth={2} aria-hidden="true"/>
                  </div>
                  <SelectValue placeholder={t("select_default_currency")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="PLN">PLN</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <LoadingButton loading={isSubmitting} className="w-full">
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