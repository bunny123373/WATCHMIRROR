import type { Metadata } from "next";
import ContentRow from "@/components/common/ContentRow";
import { getHomeRows } from "@/lib/content";

export const metadata: Metadata = {
  title: "Trending"
};

export default async function TrendingPage() {
  const data = await getHomeRows();

  return (
    <div className="space-y-8">
      <h1 className="font-[var(--font-heading)] text-3xl">Trending Now</h1>
      <ContentRow title="Top Trending" items={data.trending} />
    </div>
  );
}