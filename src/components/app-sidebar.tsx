"use client"
import * as React from "react"
import { LayoutDashboard, PiggyBank } from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import AppLogo from "@/components/app-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { type Session } from "@/hooks/use-session";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: false,
    },
    {
      title: "Savings",
      url: "/savings",
      icon: PiggyBank,
      isActive: false,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session | null,
}

export function AppSidebar({ session, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props} variant="inset">
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>
      <SidebarContent className="overflow-hidden rounded-t-lg">
        <div className="overflow-auto h-full">
          <NavMain items={data.navMain} />
          {/* <NavProjects projects={data.projects} /> */}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser session={session}/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
