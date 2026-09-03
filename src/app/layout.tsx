import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { adsenseClient } from "@/lib/adsense";
import { absoluteUrl, getSiteOrigin, siteName } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description:
    "GRDX1 publishes Formula 1 machine-learning race predictions, public analysis pages, and motorsport data stories.",
  other: {
    "google-adsense-account": adsenseClient,
  },
  openGraph: {
    description:
      "GRDX1 publishes Formula 1 machine-learning race predictions, public analysis pages, and motorsport data stories.",
    siteName,
    title: siteName,
    type: "website",
    url: absoluteUrl("/"),
  },
  alternates: {
    canonical: absoluteUrl("/"),
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <Script
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          strategy="beforeInteractive"
        />
        <AuthProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
