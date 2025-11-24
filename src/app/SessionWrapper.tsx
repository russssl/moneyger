"use client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { type ReactNode, useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading";
import { BottomBar } from "@/components/layout/bottom-bar";
import { useAuthSession } from "@/hooks/use-session";
import { usePathname } from "next/navigation";
import PersistentModals from "@/components/common/persistent-modals";

export default function SessionWrapper({ children, defaultOpen }: { children: ReactNode, defaultOpen?: boolean }) {
  const { data: session, isPending } = useAuthSession();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Public pages that don't need session handling
  const publicPages = ["/login", "/register", "/reset-password", "/forgot-password"];
  const isPublicPage = publicPages.some(page => pathname.startsWith(page));

  useEffect(() => {
    setMounted(true);
  }, []);

  const reload = () => {
    window.location.reload();
  };

  // For public pages, just render children without session handling
  if (isPublicPage) {
    return <div className="overflow-x-hidden">{children}</div>;
  }

  if (!mounted || isPending) {
    return (
      <div className="flex justify-center items-center h-screen overflow-x-hidden">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      {session ? (
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar session={session} className="hidden md:flex" />
          <SidebarInset>
            <div className="pb-safe-area md:pb-12">{children}</div>
          </SidebarInset>
          <div className="md:hidden fixed bottom-0 left-0 w-full">
            <BottomBar updateList={reload} />
          </div>
          <PersistentModals />
        </SidebarProvider>
      ) : (
        <div className="pb-safe-area md:pb-12">{children}</div>
      )}
    </div>
  );
}
