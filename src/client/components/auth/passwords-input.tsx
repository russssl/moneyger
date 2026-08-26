import { useEffect, useMemo, useState } from "react";
import { checkStrength, getStrengthColor, getStrengthText } from "@/client/hooks/passwordUtil";
import { Label } from "@/client/components/ui/label";
import PasswordInput from "@/client/components/auth/password-input";
import { AlertCircle, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PasswordsInput({
  setPassword,
}: {setPassword: (password: string) => void}) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  
  const strength = checkStrength(localPassword);
  const strengthScore = useMemo(() => strength.filter((req) => req.met).length, [strength]);
  const { t } = useTranslation("register_login");

  const isPasswordValid = useMemo(() => {
    const bothPasswordsSet = localPassword.length > 0 && confirmPassword.length > 0;
    const passwordsMatch = localPassword === confirmPassword;
    const allRequirementsMet = strength.every((req) => req.met);
    
    return bothPasswordsSet && passwordsMatch && allRequirementsMet;
  }, [localPassword, confirmPassword, strength]);

  useEffect(() => {
    setPassword(isPasswordValid ? localPassword : "");
  }, [isPasswordValid, localPassword, setPassword]);

  return (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium">
          {t("password")}
        </Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          password={localPassword}
          setPassword={setLocalPassword}
          placeholder={t("password")}
          disabled={false}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password-confirmation" className="text-sm font-medium">
          {t("confirm_password")}
        </Label>
        <PasswordInput
          id="password-confirmation"
          autoComplete="new-password"
          password={confirmPassword}
          setPassword={setConfirmPassword}
          placeholder={t("confirm_password")}
          disabled={false}
        />
      </div>
      {!isPasswordValid && confirmPassword.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle size={14} aria-hidden="true" />
          {t("passwords_do_not_match")}
        </p>
      )}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={strengthScore}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label="Password strength"
      >
        <div
          className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
          style={{ width: `${(strengthScore / 4) * 100}%` }}
        />
      </div>
      <div className="space-y-2">
        <p id="password-strength" className="text-xs font-medium text-foreground">
          {t(getStrengthText(strengthScore))}. {t("must_contain")}:
        </p>

        <ul className="space-y-1" aria-label="Password requirements">
          {strength.map((req, index) => (
            <li key={index} className="flex items-center gap-2">
              {req.met ? (
                <Check size={14} className="text-emerald-500 shrink-0" aria-hidden="true" />
              ) : (
                <X size={14} className="text-muted-foreground/60 shrink-0" aria-hidden="true" />
              )}
              <span className={`text-xs leading-tight ${req.met ? "text-emerald-600" : "text-muted-foreground"}`}>
                {t(req.text)}
                <span className="sr-only">
                  {req.met ? " - Requirement met" : " - Requirement not met"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}