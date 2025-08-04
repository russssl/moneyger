"use client";
import MainBreadcrumb from "@/components/main-breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function PagesHeader() {
  return (
    <div className="flex items-center gap-4">
      <SidebarTrigger />
      <MainBreadcrumb />
    </div>
  )
}