import { useState, useEffect } from "react";
import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";
import { ErrorAlert } from "@/client/components/common/error-alert";
import LoadingButton from "@/client/components/common/loading-button";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Key } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { type SocialProvider, signIn, getLastUsedLoginMethod } from "@/client/hooks/use-session";
import { Button } from "@/client/components/ui/button";
import { Link } from "@tanstack/react-router";

const passwordButtonStyle = "absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/60 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

function ProviderButton({ provider, onClick, last, t }: { provider: SocialProvider, onClick: () => void, last: boolean, t: (key: string) => string }) {
  return (
    <Button type="button" onClick={onClick} variant="outline"
      className="w-full h-10 text-sm flex items-center justify-center hover:bg-accent/50 transition-colors group relative overflow-hidden">
      <div className="flex items-center gap-2.5">
        <span className="flex h-4 w-4 items-center justify-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
          {provider.icon}
        </span>
        <span className="font-medium">{provider.name}</span>
      </div>
      {last && (
        <span className="absolute right-3 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span className="text-xs font-medium text-accent">{t("last_used")}</span>
        </span>
      )}
    </Button>
  );
}

function PasskeyButton({ onClick, t }: { onClick: () => void, t: (key: string) => string }) {
  return (
    <Button variant="outline" onClick={onClick} className="w-full h-10 text-sm flex items-center justify-center hover:bg-accent/50 transition-colors group relative overflow-hidden">
      <span className="flex items-center gap-2.5">
        <Key size={16} className="text-muted-foreground" />
        <span className="font-medium">{t("passkey")}</span>
      </span>
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

  const queryClient = useQueryClient();
  const { t } = useTranslation("register_login");
  const navigate = useNavigate();

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

      await queryClient.invalidateQueries({ queryKey: ["session"] });
      void navigate({ to: "/dashboard" });
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
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ["session"] });
          void navigate({ to: "/dashboard" });
        },
        onError: (ctx) => {
          setError(ctx.error.message ?? t("unknown_error"));
        },
      },
    });
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              {t("email")}
            </Label>
            <Input
              id="email"
              placeholder={t("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 text-[16px] sm:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              {t("password")}
            </Label>
            <div className="relative">
              <Input
                id="password"
                className="pe-9 h-10 text-[16px] sm:text-sm"
                placeholder={t("password")}
                type={isVisible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
        </div>
        {error && <ErrorAlert error={error} className="mt-3" />}
        <LoadingButton loading={loading} className="w-full mt-4 h-10 text-sm font-medium" type="submit">
          {t("login")}
        </LoadingButton>
        <div className="text-center">
          <Link
            to="/forgot-password"
            className="inline-flex min-h-[44px] items-center px-2 text-sm text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30 hover:text-foreground hover:decoration-foreground/40 transition-colors"
          >
            {t("forgot_password")}
          </Link>
        </div>
      </form>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs tracking-wide uppercase text-muted-foreground">
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