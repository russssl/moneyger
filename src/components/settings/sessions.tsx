
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardTitle, CardDescription, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export default function Sessions() {
  const { t } = useTranslation("settings");
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/sessions")
      .then((res) => res.json())
      .then((data) => setSessionCount(data.length ?? 0))
      .catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          {t("sessions")}
        </CardTitle>
        <CardDescription>{t("manage_active_sessions")}</CardDescription>
      </CardHeader>
      <CardContent>
      </CardContent>
      <CardFooter>
        <Button
          variant="destructive"
          // onClick={handleRevokeAllOtherSessions}
          disabled={sessionCount <= 1}
        >
          {t("revoke_all_other_sessions")}
        </Button>
      </CardFooter>
    </Card>
  );
}