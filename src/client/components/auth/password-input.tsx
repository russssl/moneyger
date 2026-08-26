import { useState } from "react";
import { Input } from "@/client/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  password,
  disabled,
  setPassword,
  placeholder,
  id = "password-confirmation",
  autoComplete = "new-password",
} : {password: string, setPassword: (password: string) => void, placeholder: string, disabled?: boolean, id?: string, autoComplete?: string}) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const passwordButtonStyle = "absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/60 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="relative">
      <Input
        id={id}
        className="pe-9 h-10 text-[16px] sm:text-sm"
        placeholder={placeholder}
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={disabled}
      />
      <button
        className={passwordButtonStyle}
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        aria-controls={id}
      >
        {isVisible ? (
          <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Eye size={16} strokeWidth={2} aria-hidden="true" />
        )}
      </button>
    </div>
  )

}