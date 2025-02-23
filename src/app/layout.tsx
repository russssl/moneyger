import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import SessionWrapper from "./SessionWrapper";
import { ThemeProvider } from "next-themes";
import { PostHogProvider } from "./providers";
import { Toaster } from "@/components/ui/sonner"
import {NextIntlClientProvider} from "next-intl";
import {getLocale, getMessages} from "next-intl/server";
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: "Manager",
  description: "Manage your life",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${GeistSans.variable}`} suppressHydrationWarning>
      <body>
        {/* <div
        className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"
      > */}
        <SpeedInsights />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          vaul-drawer-wrapper="" 
          disableTransitionOnChange>
          <TRPCReactProvider>
            <SessionProvider>
              <NextIntlClientProvider messages={messages}>
                <SessionWrapper>
                  <PostHogProvider>
                    {children}
                    <Toaster />
                    <SpeedInsights />
                  </PostHogProvider>
                </SessionWrapper>
              </NextIntlClientProvider>
            </SessionProvider>
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
