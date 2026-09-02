import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { absoluteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Predicts",
  description: "Legacy redirect entry point for the GRDX1 race prediction workflow.",
  alternates: {
    canonical: absoluteUrl("/predicts"),
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    description: "Legacy redirect entry point for the GRDX1 race prediction workflow.",
    title: `Predicts | ${siteName}`,
    type: "website",
    url: absoluteUrl("/predicts"),
  },
};

export default function PredictsPage() {
  redirect("/races");
}
