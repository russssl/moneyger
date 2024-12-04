import '@/styles/globals.css';

import { GeistSans } from 'geist/font/sans';
import { type Metadata } from "next";

import { TRPCReactProvider } from '@/trpc/react';
import { SessionProvider } from 'next-auth/react';
import SessionWrapper from './SessionWrapper';
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
  title: 'Manager',
  description: 'Manage your life',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default function RootLayout({
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
            
        <TRPCReactProvider>
          <SessionProvider>
            <SessionWrapper>{children}</SessionWrapper>
          </SessionProvider>
        </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
