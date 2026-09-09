import { UfcCareerGame } from "@/ufc-career/components/UfcCareerGame";

export default function UfcCareerDevPage() {
  if (process.env.NODE_ENV === "production") {
    return <div className="page-shell mx-auto max-w-7xl px-4">Dev career tools are unavailable in production.</div>;
  }

  return <UfcCareerGame debug />;
}
