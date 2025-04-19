"use client"
import { Bell, ChevronsUpDown, CreditCard, LogOut, Sparkles, Moon, Sun, Settings } from "lucide-react"
import { useTheme, } from "next-themes"
import { Avatar, AvatarFallback} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { LoadingSpinner } from "./ui/loading"
import { useTranslations } from "next-intl"
import { type Session, signOut } from "@/hooks/use-session";
function CurrentThemeIcon() {
  const {theme} = useTheme()
  return (
    <div className="flex items-center gap-2">
      {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </div>
  )
}

function useSetTheme() {
  const { theme, setTheme } = useTheme()
  return (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (theme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }
}
export function NavUser({
  session,
}: {
  session: Session | null,
}) {
  const { isMobile } = useSidebar()
  const t = useTranslations("navbar")
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
                <AvatarFallback className="rounded-full border-dashed border-3">
                  {session?.user?.name?.[0] ?? ""}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{
                  session ? 
                    <>
                      {session.user.name}
                    </> 
                    : <LoadingSpinner/> }</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {session?.user?.name?.[0] ?? ""}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {session ? 
                      session.user.name
                      : <LoadingSpinner></LoadingSpinner>}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                {t("upgrade_to_pro")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
                <Settings />
                {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                {t("billing")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                {t("notifications")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={useSetTheme()}>
                <CurrentThemeIcon />
                {t("theme")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
