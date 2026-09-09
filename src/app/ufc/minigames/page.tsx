import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { UfcCareerGame } from "@/ufc-career/components/UfcCareerGame";

export const metadata: Metadata = {
  title: "UFC Minigame Lab | GRDX1",
  description: "Test every UFC career minigame one by one.",
  alternates: { canonical: absoluteUrl("/ufc/minigames") },
};

export default function UfcMinigamesPage() {
  return <UfcCareerGame minigameLab />;
}
