"use client";
import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import LoadingButton from "./loading-button";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Github } from "lucide-react";
// import { usePostHog } from "posthog-js/react";
import { useTranslations } from "next-intl";
import { type Provider, signIn } from "@/hooks/use-session";
import { Button } from "./ui/button";

const passwordButtonStyle = "absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

export default function LoginProviders() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  // const posthog = usePostHog();
  const t = useTranslations("register_login");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      if (!email || !password) {
        setError("Please provide both email and password.");
        return;
      }

      const { error } = await signIn.email({ email, password });

      if (error?.message) {
        setError(error.message);
        return;
      }

      // posthog?.capture("user_logged_in", { email });
      router.push("/");
    } catch (e) {
      console.error(e);
      setError("An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: Provider) => {
    await signIn.social({
      provider,
    });
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <div className="space-y-2">
            <Label htmlFor="email">
              Email
              <span className="text-destructive ms-1">*</span>
            </Label>
            <Input
              id="email"
              placeholder="Email"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 mt-2">
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
          {error && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <LoadingButton loading={loading} className="w-full mt-5" type="submit">
            {t("login")}
          </LoadingButton>
          <div className="text-center mt-3">
            <a href="/password-reset" className="text-blue-500">
              {t("forgot_password")}
            </a>
          </div>
        </div>
      </form>
      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div>
        <Button
          type="button"
          onClick={() => signInWithProvider("github")}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-secondary h-10 px-4 py-2 w-full mt-3 bg-zinc-900 text-zinc-100"
        >
          <Github className="w-4 h-4 mr-2" />
          Github
        </Button>
        {/* google */}
        <Button
          type="button"
          onClick={() => signInWithProvider("google")}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-secondary h-10 px-4 py-2 w-full mt-3 bg-zinc-900 text-zinc-100"
        >
          {/* <Google className="w-4 h-4 mr-2" /> */}
          Google
        </Button>
      </div>
    </>
  );
}