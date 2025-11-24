"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoadingButton from "@/components/common/loading-button";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Key } from "lucide-react";
import { useTranslations } from "next-intl";
import { type SocialProvider, signIn, getLastUsedLoginMethod } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const passwordButtonStyle = "absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

function ProviderButton({ provider, onClick, last, t }: { provider: SocialProvider, onClick: () => void, last: boolean, t: (key: string) => string }) {
  return (
    <Button  type="button" onClick={onClick}  variant="outline"
      className="w-full h-12 flex items-center justify-center hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 group relative overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {provider.icon}
        </div>
        <span className="font-medium text-sm">{provider.name}</span>
      </div>
      {last && (
        <div className="absolute right-3 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 font-medium">{t("last_used")}</span>
        </div>
      )}
    </Button>
  );
}

function PasskeyButton({ onClick, t }: { onClick: () => void, t: (key: string) => string }) {
  return (
    <Button variant="outline" onClick={onClick} className="w-full h-12 flex items-center justify-center hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 group relative overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          <Key size={16} />
        </div>
        <span className="font-medium text-sm">{t("passkey")}</span>
      </div>
    </Button>
  );
}
export default function LoginProviders({ providers }: { providers: SocialProvider[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [lastLoginMethod, setLastLoginMethod] = useState<string | null>(null);

  const t = useTranslations("register_login");
  const router = useRouter();

  useEffect(() => {
    // Only get the last login method on the client side to avoid hydration issues
    const lastMethod = getLastUsedLoginMethod();
    setLastLoginMethod(lastMethod);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      if (!email || !password) {
        setError(t("please_provide_email_password"));
        return;
      }

      const { error } = await signIn.email({ email, password });

      if (error?.message) {
        setError(error.message);
        return;
      }

      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setError(t("unknown_error"));
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: SocialProvider) => {
    await signIn.social({
      provider: provider.provider,
    });
  }

  const logInWithPasskey = async () => {
    await signIn.passkey({
      autoFill: false,
      fetchOptions: {
        onSuccess: () => {
          router.push("/dashboard");
        },
        onError: (ctx) => {
          setError(ctx.error.message ?? t("unknown_error"));
        },
      },
    });
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <div className="space-y-1">
            <Label htmlFor="email">
              {t("email")}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <Input
              id="email"
              placeholder={t("email")}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1 mt-2">
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
                onClick={() => setIsVisible(!isVisible)}
                aria-label={isVisible ? t("hide_password") : t("show_password")}
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
          {error && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <LoadingButton loading={loading} className="w-full mt-5" type="submit">
            {t("login")}
          </LoadingButton>
          <div className="text-center mt-3">
            <Link href="/forgot-password" className="text-blue-500 ml-2">
              {t("forgot_password")}
            </Link>
          </div>
        </div>
      </form>
      <div className="relative mt-6 mb-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">
            {t("or_continue_with")}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {providers.map((provider) => (
          <ProviderButton 
            key={provider.provider} 
            provider={provider} 
            onClick={() => signInWithProvider(provider)} 
            last={lastLoginMethod === provider.provider}
            t={t}
          />
        ))}
        <PasskeyButton onClick={() => logInWithPasskey()} t={t} />
      </div>
    </>
  );
}