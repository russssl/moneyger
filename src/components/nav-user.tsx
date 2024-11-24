'use client'
import { Bell, ChevronsUpDown, CreditCard, LogOut, Sparkles, Moon, Sun } from 'lucide-react'
import { useTheme, } from 'next-themes'
import type { Session } from 'next-auth'
import { Avatar, AvatarFallback} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from 'next-auth/react';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { LoadingSpinner } from './ui/loading'
import SettingsModal from './user/SettingsModal'

function CurrentThemeIcon() {
  const {theme} = useTheme()
  return (
    <div className="flex items-center gap-2">
      {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </div>
  )
}

function useSetTheme() {
  const { theme, setTheme } = useTheme()
  return (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (theme === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }
}
export function NavUser({
  session,
}: {
  session: Session | null,
}) {
  const { isMobile } = useSidebar()
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
                  {session?.user?.name?.[0] ?? ''}{session?.user?.surname?.[0] ?? ''}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{
                  session ? 
                    <>
                      {session.user.name} {session.user?.surname ?? ''}
                    </> 
                    : <LoadingSpinner/> }</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {session?.user?.name?.[0] ?? ''}{session?.user?.surname?.[0] ?? ''}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {session ? 
                      session.user.name + ' ' + session.user.surname
                      : <LoadingSpinner></LoadingSpinner>}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <SettingsModal />
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={useSetTheme()}>
                <CurrentThemeIcon />
                Theme
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({redirectTo: '/login', redirect: true})}>
              <LogOut />
              Log out
            </DropdownMenuItem>
            {/* <ThemeToggle /> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
