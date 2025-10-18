"use client"
import { useMemo, useState, useEffect } from "react"
import { Key, Check, X } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import PasswordInput from "@/components/password-input"
import LoadingButton from "@/components/loading-button"
import { ErrorAlert } from "../error-alert"
import { checkStrength, getStrengthText, getStrengthColor } from "@/hooks/passwordUtil"
import { useTranslations } from "next-intl"
import { useMutation } from "@/hooks/use-api"
import { Button } from "../ui/button"
import PasskeySettingsModal from "./passkey-settings-modal"
import { type Passkey } from "better-auth/plugins/passkey"
import { passkey as passkeyClient } from "@/hooks/use-session"

interface PasswordSettingsProps {
  passwordExists?: boolean;
  [key: string]: any;
}

export default function PasswordSettings({ passwordExists, ...props }: PasswordSettingsProps) {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordsMatch, setPasswordsMatch] = useState(false)

  const [openPasskeySettingsModal, setOpenPasskeySettingsModal] = useState(false)

  const {mutate: registerPasswordMutation, isPending: isRegisteringPassword, error: registerPasswordError} = useMutation<any, any>("/api/user/setPassword");
  const {mutate: updatePasswordMutation, isPending, error: updatePasswordError} = useMutation<any, any>("/api/user/updatePassword");

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

  const getPasskeys = async () => {
    const {data: passkeys, error} = await passkeyClient.listUserPasskeys();
    if (error) {
      console.error(error);
      return [];
    }
    return passkeys ?? [];
  }

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
  const registerPassword = () => {
    registerPasswordMutation({
      password: newPassword,
      confirmPassword,
    });
    if (registerPasswordError) {
      setError(t("failed_to_register_password"));
    } else {
      setError("");
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
          {passwordExists && (
            <div className="space-y-2">
              <Label htmlFor="current-password">{settingsT("current_password")}</Label>
              <PasswordInput password={oldPassword} setPassword={setOldPassword} placeholder={settingsT("current_password")} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="new-password">{settingsT("new_password")}</Label>
            <PasswordInput password={newPassword} setPassword={setNewPassword} placeholder={settingsT("new_password")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{settingsT("confirm_new_password")}</Label>
            <PasswordInput password={confirmPassword} setPassword={setConfirmPassword} placeholder={settingsT("confirm_new_password")} />
          </div>
          <div className="mb-4 mt-3 h-1 w-full overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={strengthScore} aria-valuemin={0}
            aria-valuemax={4} aria-label="Password strength"
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
            <>
              {strength.map((req, index) => (
                <li key={index} className="flex items-center gap-2">
                  {req.met ? (
                    <Check size={16} className="text-emerald-500" aria-hidden="true" />
                  ) : (
                    <X size={16} className="text-muted-foreground/80 text-red-500" aria-hidden="true" />
                  )}
                  <span className={`text-xs ${req.met ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {t(req.text)}
                    <span className="sr-only">
                      {req.met ? " - Requirement met" : " - Requirement not met"}
                    </span>
                  </span>
                </li>
              ))}
              {/* passwords match */}
              <li className="flex items-center gap-2">
                {passwordsMatch ? (
                  <Check size={16} className="text-emerald-500" aria-hidden="true" />
                ) : (
                  <X size={16} className="text-muted-foreground/80 text-red-500" aria-hidden="true" />
                )}
                <span className={`text-xs ${passwordsMatch ? "text-emerald-600" : "text-muted-foreground"}`}>Passwords match</span>
              </li>
            </>
          </ul>
          <hr className="my-4" />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="passkey-settings" className="mb-0.5 text-base font-medium">
                  Passkey Settings
                </Label>
                <span className="text-xs text-muted-foreground">
                  Manage your registered passkeys for passwordless login.
                </span>
              </div>
              <Button
                id="passkey-settings"
                variant="outline"
                size="sm"
                className="rounded-md flex-shrink-0"
                onClick={() => setOpenPasskeySettingsModal(true)}
              >
                Manage
              </Button>
            </div>
            <PasskeySettingsModal
              open={openPasskeySettingsModal}
              onOpenChange={setOpenPasskeySettingsModal}
              getPasskeys={getPasskeys}
            />
          </div>
        </div>
        <div className="mt-4">

        </div>
      </CardContent>
      <CardFooter>
        <LoadingButton
          variant="default"
          className="w-full sm:w-auto"
          onClick={() => {
            if (!passwordExists) {
              // "register password"
              registerPassword();
            }
            updatePassword();
          }}
          toastText="Password updated successfully"
          loading={isPending || isRegisteringPassword}
          disabled={
            !passwordsMatch || !newPassword ||
            (passwordExists ? isPending || !oldPassword : isRegisteringPassword)
          }
        >{settingsT("update_password")}
        </LoadingButton>
      </CardFooter>
    </Card>
  )
}