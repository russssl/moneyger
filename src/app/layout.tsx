import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import SessionWrapper from "./SessionWrapper";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "Manager",
  description: "Manage your life",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <body>
        {/* <div
        className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"
      > */}
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
        {/* </div> */}
      </body>
    </html>
  );
}
