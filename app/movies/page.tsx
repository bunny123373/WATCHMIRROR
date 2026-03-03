import type { Metadata } from "next";
import ContentRow from "@/components/common/ContentRow";
import { getAllContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Movies"
};

export default async function MoviesPage() {
  const movies = await getAllContent("movie");

  return (
    <div className="space-y-8">
      <h1 className="font-[var(--font-heading)] text-3xl">Movies</h1>
      <ContentRow title="All Movies" items={movies} />
    </div>
  );
}
