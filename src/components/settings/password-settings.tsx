"use client"
import { useMemo, useState, useEffect } from "react"
import { Key, AlertCircle, Check, X, Info } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import PasswordInput from "@/components/password-input"
import LoadingButton from "@/components/loading-button"
import { ErrorAlert } from "../error-alert"
import { checkStrength, getStrengthText, getStrengthColor } from "@/hooks/passwordUtil"
import { useTranslations } from "next-intl"
import { useMutation } from "@/hooks/use-api"
import { Alert, AlertDescription } from "../ui/alert"


export default function PasswordSettings({...props}) {
  const { passwordChangeAllowed } = props;
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordsMatch, setPasswordsMatch] = useState(false)

  useEffect(() => {
    if (!newPassword) {
      setPasswordsMatch(true)
      return
    }
    setPasswordsMatch(newPassword === confirmPassword && (confirmPassword.length > 0 && newPassword.length > 0))
  }, [newPassword, confirmPassword])

  const strength = checkStrength(newPassword);
  const t = useTranslations("register_login");
  const settingsT = useTranslations("settings");
  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);
  
  
  const {mutate: updatePasswordMutation, isPending, error: updatePasswordError} = useMutation<{ oldPassword: string; newPassword: string }, any>("/api/user/updatePassword");
  const updatePassword = () => {
    updatePasswordMutation({
      oldPassword,
      newPassword,
    });
    if (updatePasswordError) {
      setError(updatePasswordError.message);
    } else {
      setError("");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }
  

  return (
    <Card {...props} className="sm:max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2" />
          {settingsT("password")}
        </CardTitle>
        <CardDescription>{settingsT("password_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorAlert error={error} />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">{settingsT("current_password")}</Label>
            <PasswordInput password={oldPassword} setPassword={setOldPassword} placeholder={settingsT("current_password")} disabled={!passwordChangeAllowed}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{settingsT("new_password")}</Label>
            <PasswordInput password={newPassword} setPassword={setNewPassword} placeholder={settingsT("new_password")} disabled={!passwordChangeAllowed}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{settingsT("confirm_new_password")}</Label>
            <PasswordInput password={confirmPassword} setPassword={setConfirmPassword} placeholder={settingsT("confirm_new_password")} disabled={!passwordChangeAllowed}/>
          </div>
          {passwordChangeAllowed ? (
            <>
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
            </>
          ): (
            <Alert variant="info" className="mt-3">
              <AlertDescription>
                <span>
                  To enable password changes, log in with your email and password.
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <div className="mt-4">
          {!passwordsMatch && (
            <div className="flex items-center space-x-2 text-red-500">
              <AlertCircle size={16} />
              <span>{t("passwords_do_not_match")}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <LoadingButton
          variant="default"
          className="w-full sm:w-auto"
          onClick={() => {
            updatePassword();
          }}
          toastText="Password updated successfully"
          loading={isPending}
          disabled={!passwordsMatch || isPending || !oldPassword || !newPassword}
        >{settingsT("update_password")}
        </LoadingButton>
      </CardFooter>
    </Card>
  )
}