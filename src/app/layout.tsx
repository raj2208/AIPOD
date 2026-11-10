import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, IBM_Plex_Mono, Literata } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

import "./globals.css";

// Three faces, each with a job. See DESIGN.md, "Typography".
// Atkinson Hyperlegible was drawn to keep characters apart for low vision,
// which is what this app asks of a reader glancing at a phone on a train.
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Literata is made for reading long text on screens: the script itself, and
// the titles of the things you read.
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  display: "swap",
});

// For paths, ids and hashes only. Never for decoration.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AIPOD",
  description:
    "Turn your own study notes into spoken scripts you can revise from on your commute.",
  icons: { icon: "/icon.svg" },
};

// Colours the browser bar, and the app's window when it is installed.
export const viewport: Viewport = {
  themeColor: "#f4f9f7",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme class is set by a script before the page paints, so React
    // is told to expect it on <html> differing from the server's markup.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${atkinson.variable} ${literata.variable} ${plexMono.variable} h-full antialiased`}
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
          <Toaster>
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </Toaster>
        </TooltipProvider>
      </body>
    </html>
  );
}
