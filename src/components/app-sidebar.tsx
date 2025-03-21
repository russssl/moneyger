"use client"
import * as React from "react"
import { SquareTerminal } from "lucide-react"
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
      title: "Wallets",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Cards",
          url: "#",
        },
        {
          title: "Accounts",
          url: "#",
        },
      ],
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session | null, // FIXME: better-auth
}

export function AppSidebar({ session, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* later use it for "other" */}
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser session={session}/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
