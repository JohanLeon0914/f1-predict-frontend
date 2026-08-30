import { Suspense } from "react";
import { RacesClient } from "@/components/RacesClient";

export default function RacesPage() {
  return (
    <Suspense fallback={<div className="page-shell races-loading" aria-busy="true" />}>
      <RacesClient />
    </Suspense>
  );
}
