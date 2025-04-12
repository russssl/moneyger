import { LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardTitle, CardDescription, CardContent, CardHeader } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Sessions() {
  const authHeaders: any = await headers();
  const sessions = await auth.api.listSessions({
    headers: authHeaders
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
            Sessions
        </CardTitle>
        <CardDescription>Manage your active sessions.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <p className="font-medium">{session.device}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{session.location}</span>
                  <span className="mx-1">•</span>
                  <span>{session.lastActive}</span>
                  {session.current && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="font-medium">Current</span>
                    </>
                  )}
                </div>
              </div>
              {!session.current && (
                <Button variant="outline" size="sm" onClick={() => handleRevokeSession(session.id)}>
                  <LogOut className="h-4 w-4 mr-2" />
                    Revoke
                </Button>
              )}
            </div>
          ))}
        </div> */}
        {JSON.stringify(sessions)}
      </CardContent>
      <CardFooter>
        <Button
          variant="destructive"
          // onClick={handleRevokeAllOtherSessions}
          disabled={sessions.length <= 1}
        >
          Revoke All Other Sessions
        </Button>
      </CardFooter>
    </Card>
  );
}