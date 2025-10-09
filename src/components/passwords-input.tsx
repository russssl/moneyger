import { useEffect, useMemo, useState } from "react";
import { checkStrength, getStrengthColor, getStrengthText } from "@/hooks/passwordUtil";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/password-input";
import { AlertCircle, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PasswordsInput({
  setPassword,
}: {setPassword: (password: string) => void}) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  
  const strength = checkStrength(localPassword);
  const strengthScore = useMemo(() => strength.filter((req) => req.met).length, [strength]);
  const t = useTranslations("register_login");

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
    <div>
      <div className="space-y-2">
        <Label htmlFor="password">
          {t("password")}
          <span className="text-destructive ms-1">*</span>
        </Label>
        <PasswordInput 
          password={localPassword} 
          setPassword={setLocalPassword} 
          placeholder={t("password")} 
          disabled={false}
        />
      </div>
      <div className="space-y-2 mt-4">
        <Label htmlFor="password-confirmation">
          {t("confirm_password")}
          <span className="text-destructive ms-1">*</span>
        </Label>
        <PasswordInput 
          password={confirmPassword} 
          setPassword={setConfirmPassword} 
          placeholder={t("confirm_password")}
          disabled={false}
        />
      </div>
      <div className="mt-3">
        {!isPasswordValid && confirmPassword.length > 0 && (
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
        />
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
    </div>
  )
}