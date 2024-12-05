"use client";
import { useSession } from "next-auth/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { type ReactNode } from "react";
import { LoadingSpinner } from "@/components/ui/loading";


export default function SessionWrapper({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return session ? (
    <SidebarProvider>
      <AppSidebar session={session} />
      {children}
    </SidebarProvider>
  ) : (
    <>{children}</>
  );
}
