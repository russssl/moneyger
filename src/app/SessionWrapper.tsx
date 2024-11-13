'use client';
import { useSession } from 'next-auth/react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { type ReactNode } from 'react';


export default function SessionWrapper({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Loading...</p>; // Optionally display a loading state
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
