import type { Metadata } from "next";
import ContentRow from "@/components/common/ContentRow";
import { getAllContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Series"
};

export default async function SeriesPage() {
  const series = await getAllContent("series");

  return (
    <div className="space-y-8">
      <h1 className="font-[var(--font-heading)] text-3xl">Web Series</h1>
      <ContentRow title="All Series" items={series} />
    </div>
  );
}