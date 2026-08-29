import { RaceSimulator } from "@/components/RaceSimulator";
import { redirect } from "next/navigation";

export default function PredictsPage() {
  redirect("/races");

  return (
    <section className="page-shell mx-auto max-w-7xl px-4 pb-8">
      <RaceSimulator mode="free" />
    </section>
  );
}
