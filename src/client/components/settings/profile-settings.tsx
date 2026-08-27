import { useState, useEffect } from "react";
import { User as UserIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/client/components/ui/card";
import { Label } from "@/client/components/ui/label";
import { Input } from "@/client/components/ui/input";
import LoadingButton from "@/client/components/common/loading-button";
import { LanguageSelect } from "@/client/components/common/language-select";
import { useTranslation } from "react-i18next";
import { updateUser } from "@/client/hooks/use-session";
import { useFetch, useMutation } from "@/client/hooks/use-api";
import { type User } from "@/server/db/user";
import { ErrorAlert } from "@/client/components/common/error-alert";

export default function ProfileSettings({...props}) {
  const {data: userSettings, isLoading, error} = useFetch<User>("/api/user/me", { queryKey: ["user", "me"] });
  const { session } = props;
  const [email, setEmail] = useState(userSettings?.email ?? "");
  const [name, setName] = useState(userSettings?.name ?? "");
  const [language, setLanguage] = useState<string | undefined>("en");

  const { t } = useTranslation("settings");

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
      setName(userSettings.name ?? "");
    }
  }, [userSettings]);
  const { mutateAsync: saveUserSettingsMutation, isPending} = useMutation<{ email?: string }, { message: string }>("/api/user", "POST", { invalidates: [["user", "me"]] });
  if (!session) {
    return null;
  }

  const saveBasicSettings = async () => {
    if (!userSettings) return;
    await saveUserSettingsMutation({
      email,
    });
    if (name !== (userSettings.name ?? "") && name) {
      await updateUser({
        name,
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
    <Card {...props} className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          {t("profile")}
        </CardTitle>
        <CardDescription>{t("profile_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <ErrorAlert error={error} className="mb-4" />}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} disabled={isLoading} className="w-full"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="w-full"/>
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