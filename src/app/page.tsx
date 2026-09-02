import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { absoluteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: siteName,
  description:
    "GRDX1 is an independent Formula 1 analytics project focused on machine-learning race predictions and public race analysis pages.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    description:
      "GRDX1 is an independent Formula 1 analytics project focused on machine-learning race predictions and public race analysis pages.",
    title: siteName,
    type: "website",
    url: absoluteUrl("/"),
  },
};

export default function Home() {
  return <LandingPage />;
}
