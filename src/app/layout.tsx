import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIPOD",
  description:
    "Turn your own study notes into spoken scripts you can revise from on your commute.",
  icons: { icon: "/icon.svg" },
};

// Colours the browser bar, and the app's window when it is installed.
export const viewport: Viewport = {
  themeColor: "#f9fafd",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme class is set by a script before the page paints, so React
    // is told to expect it on <html> differing from the server's markup.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground focus-ring"
        >
          Skip to content
        </a>
        <TooltipProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </TooltipProvider>
      </body>
    </html>
  );
}
