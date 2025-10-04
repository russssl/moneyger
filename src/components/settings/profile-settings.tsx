"use client"
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import LoadingButton from "@/components/loading-button";
import { LanguageSelect } from "../language-select";
import { useTranslations } from "next-intl";
import { updateUser } from "@/hooks/use-session";
import { useFetch, useMutation } from "@/hooks/use-api";

export default function ProfileSettings({...props}) {
  const {data: userSettings, isLoading, error} = useFetch<{email: string, username: string}>("/api/user/me");
  const { session } = props;
  const [email, setEmail] = useState(userSettings?.email ?? "");
  const [username, setUsername] = useState(userSettings?.username ?? "");
  const [language, setLanguage] = useState<string | undefined>("en");

  const t = useTranslations("settings");

  useEffect(() => {
    const savedLocale = document.cookie
      .split("; ")
      .find(row => row.startsWith("locale="))
      ?.split("=")[1] ?? "en";
    setLanguage(savedLocale);
  }, []);
  
  useEffect(() => {
    if (userSettings) {
      setEmail(userSettings?.email ?? "");
      setUsername(userSettings.username ?? "");
    }
  }, [userSettings]);
  // error handling
  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  const {mutateAsync: saveUserSettingsMutation, isPending} = useMutation("/api/user");

  if (!session) {
    return null;
  }

  const saveBasicSettings = async () => {
    await saveUserSettingsMutation({
      email,
      username,
      id: session?.user?.id,
    });
    if (username) {
      await updateUser({
        username,
      });
    }
    const currentLocale = document.cookie
      .split("; ")
      .find(row => row.startsWith("locale="))
      ?.split("=")[1] ?? "en";
    if (language !== currentLocale) {
      document.cookie = `locale=${language}; path=/; max-age=31536000`;
      window.location.reload();
    }
  }

  return (
    <Card {...props} className="sm:max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          {t("profile")}
        </CardTitle>
        <CardDescription>{t("profile_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">{t("username")}</Label>
            <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t("username")} disabled={isLoading}/>
          </div>
          <div className="space-y-2">
            <LanguageSelect
              language={language} 
              setLanguage={(lang) => lang ? setLanguage(lang) : setLanguage("")}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <LoadingButton
          variant="default"
          className="w-full sm:w-auto"
          onClick={async () => {
            await saveBasicSettings();
          }}
          toastText="Settings saved successfully"
          loading={isPending || isLoading}
          disabled={isPending || isLoading}
        >
          {t("save_changes")}
        </LoadingButton>
      </CardFooter>
    </Card>
  )
}