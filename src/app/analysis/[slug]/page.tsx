import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnalysisArticle } from "@/components/AnalysisPage";
import { getCachedLocalF1Data } from "@/lib/local-f1-data-server";
import { getAnalysisEntry, getAnalysisPaths } from "@/lib/analysis-content";
import { absoluteUrl, siteName } from "@/lib/site";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 86400;

export function generateStaticParams() {
  return getAnalysisPaths();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getAnalysisEntry(slug);

  if (!entry) {
    return {
      title: "Analysis",
      robots: { index: false, follow: false },
    };
  }

  const description = `Explore GRDX1's machine-learning prediction and data-driven analysis for the ${entry.season} ${entry.raceName}.`;

  return {
    title: `${entry.raceName} ${entry.season} Prediction & Analysis`,
    description,
    alternates: {
      canonical: absoluteUrl(`/analysis/${entry.slug}`),
    },
    openGraph: {
      description,
      title: `${entry.raceName} ${entry.season} Prediction & Analysis | ${siteName}`,
      type: "article",
      url: absoluteUrl(`/analysis/${entry.slug}`),
    },
  };
}

export default async function AnalysisDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const analysis = getAnalysisEntry(slug);

  if (!analysis) {
    notFound();
  }

  const localData = await getCachedLocalF1Data();

  return (
    <section className="page-shell analysis-page mx-auto max-w-7xl px-4 pb-12">
      <AnalysisArticle analysis={analysis} initialData={localData} />
    </section>
  );
}
