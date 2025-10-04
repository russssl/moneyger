"use client";
import MainBreadcrumb from "@/components/main-breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function PagesHeader() {
  return (
    <div className="flex items-center justify-between w-full px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <MainBreadcrumb />
      </div>
    </div>
  )
}