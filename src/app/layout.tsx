import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Apex Predictor",
  description: "F1 race predictions powered by a local machine-learning model.",
  icons: {
    icon: "/icono-logo.png",
    shortcut: "/icono-logo.png",
    apple: "/icono-logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AuthProvider>
          <SiteHeader />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
