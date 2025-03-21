"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { type ReactNode } from "react";
import { LoadingSpinner } from "@/components/ui/loading";
import { BottomBar } from "@/components/bottom-bar";
import { useAuthSession } from "@/hooks/use-session";

export default function SessionWrapper({ children }: { children: ReactNode }) {
  const {data: session, isPending} = useAuthSession();

  const reload = () => {
    window.location.reload();
  }

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return session ? (
    <SidebarProvider>
      <AppSidebar session={session} className="hidden md:flex"/>
      {children}
      <div className="md:hidden">
        <BottomBar updateList={reload}/>
      </div>
    </SidebarProvider>
  ) : (
    <>{children}</>
  );
}
