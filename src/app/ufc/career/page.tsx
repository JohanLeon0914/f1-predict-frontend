import type { Metadata } from "next";
import { UfcCareerGame } from "@/ufc-career/components/UfcCareerGame";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "GRDX1 Road to Glory | UFC Career Game",
  description: "Create an MMA fighter and build a seeded GRDX1 career through decisions, events, fights and legacy scoring.",
  alternates: { canonical: absoluteUrl("/ufc/career") },
};

export default function UfcCareerPage() {
  return <UfcCareerGame />;
}
