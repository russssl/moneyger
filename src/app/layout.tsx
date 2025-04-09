import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import SessionWrapper from "./SessionWrapper";
import { ThemeProvider } from "next-themes";
import { PostHogProvider } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import PersistentModals from "@/components/persistent-modals";

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
    <html lang={locale} className={GeistSans.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <SessionWrapper>
                <PostHogProvider>
                  <PersistentModals />
                  {children}
                  <Toaster />
                </PostHogProvider>
              </SessionWrapper>
            </NextIntlClientProvider>
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}