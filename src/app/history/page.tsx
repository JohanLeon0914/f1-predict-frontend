import type { Metadata } from "next";
import { HistoryClient } from "@/components/HistoryClient";
import { getLocalF1DataServer } from "@/lib/local-f1-data-server";
import { absoluteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "History",
  description: "Your saved GRDX1 predictions and race history.",
  alternates: {
    canonical: absoluteUrl("/history"),
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    description: "Your saved GRDX1 predictions and race history.",
    title: `History | ${siteName}`,
    type: "website",
    url: absoluteUrl("/history"),
  },
};

export default async function HistoryPage() {
  const localData = await getLocalF1DataServer();

  return <HistoryClient initialData={localData} />;
}
