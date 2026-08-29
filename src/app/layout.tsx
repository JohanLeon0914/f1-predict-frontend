import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "F1 ML Predicts",
  description: "F1 race predictions powered by a local machine-learning model.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
