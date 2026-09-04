import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { getLocalF1DataServer } from "@/lib/local-f1-data-server";
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

export default async function Home() {
  const localData = await getLocalF1DataServer();

  return <LandingPage initialData={localData} />;
}
