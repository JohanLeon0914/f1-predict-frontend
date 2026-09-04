import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "GRDX1 | AI Sports Predictions & Analytics",
  description:
    "Explore machine learning-powered sports predictions and analysis for Formula 1, UFC and future GRDX1 models.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    description:
      "Explore machine learning-powered sports predictions and analysis for Formula 1, UFC and future GRDX1 models.",
    title: "GRDX1 | AI Sports Predictions & Analytics",
    type: "website",
    url: absoluteUrl("/"),
  },
};

export default function Home() {
  return <LandingPage />;
}
