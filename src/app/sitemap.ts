import type { MetadataRoute } from "next";
import { getAnalysisEntries } from "@/lib/analysis-content";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const analysisEntries = getAnalysisEntries();

  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/analysis"),
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/races"),
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/support"),
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/privacy-policy"),
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/disclaimer"),
      lastModified: new Date(),
    },
  ];

  const analysisPages: MetadataRoute.Sitemap = analysisEntries.map((entry) => ({
    url: absoluteUrl(`/analysis/${entry.slug}`),
    lastModified: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
  }));

  return [...baseEntries, ...analysisPages];
}
