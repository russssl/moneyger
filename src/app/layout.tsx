import '@/styles/globals.css';

import { GeistSans } from 'geist/font/sans';
import { type Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider'
import SessionWrapper from './SessionWrapper';
import { SessionProvider } from 'next-auth/react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'Manager',
  description: 'Manage your life',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider 
          attribute="class"
          defaultTheme="system"
          enableSystem
          vaul-drawer-wrapper="" 
          disableTransitionOnChange>
          <SessionProvider>
            <SessionWrapper>{children}</SessionWrapper>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
