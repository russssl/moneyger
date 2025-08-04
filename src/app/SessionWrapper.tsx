"use client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { type ReactNode, useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading";
import { BottomBar } from "@/components/bottom-bar";
import { useAuthSession } from "@/hooks/use-session";

export default function SessionWrapper({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useAuthSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const reload = () => {
    window.location.reload();
  };

  if (!mounted || isPending) {
    return (
      <div className="flex justify-center items-center h-screen overflow-x-hidden">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      <SidebarProvider>
        {session ? (
          <>
            <AppSidebar session={session} className="hidden md:flex" />
            <SidebarInset>
              <div className="pb-12">{children}</div>
            </SidebarInset>
            <div className="md:hidden fixed bottom-0 left-0 w-full">
              <BottomBar updateList={reload} />
            </div>
          </>
        ) : (
          <div className="pb-12">{children}</div>
        )}
      </SidebarProvider>
    </div>
  );
}
