import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import type{ Viewport, Metadata } from "next";
import { cookies } from "next/headers";

import SessionWrapper from "./SessionWrapper";
import { ThemeProvider } from "next-themes";
import { PostHogProvider, ReactQueryProvider } from "./providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner"
import { AttackModeBanner } from "@/components/layout/attack-mode-banner"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export const metadata: Metadata = {
  title: "Moneyger",
  description: "Manage your money with Moneyger",
  appleWebApp: {
    title: "Moneyger",
    statusBarStyle: "default",
    capable: true,
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <html lang={locale} className={GeistSans.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <SessionWrapper defaultOpen={defaultOpen}>
                <AttackModeBanner />
                <Toaster richColors invert closeButton/>
                <PostHogProvider>
                  {children}
                </PostHogProvider>
              </SessionWrapper>
            </NextIntlClientProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}