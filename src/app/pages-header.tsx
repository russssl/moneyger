"use client";
import MainBreadcrumb from "@/components/main-breadcrumb";
import { SidebarTrigger, SidebarContext } from "@/components/ui/sidebar";
import {useIsMobile} from "@/hooks/use-mobile";
import { useContext } from "react";

function SafeSidebarTrigger() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const context = useContext(SidebarContext);
  if (!context) {
    return null;
  }
  return <SidebarTrigger />;
}

export default function PagesHeader() {
  const isMobile = useIsMobile();
  return (
    <div className="flex items-center justify-between w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:[&:first-child]:rounded-t-xl">
      <div className="flex items-center gap-2 sm:gap-4">
        {!isMobile && <SafeSidebarTrigger />}
        <MainBreadcrumb />
      </div>
    </div>
  )
}