import type { Metadata } from "next";
import ContentRow from "@/components/common/ContentRow";
import { getAllContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Series"
};

export default async function SeriesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; language?: string; genre?: string; year?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const series = await getAllContent("series");
  const q = (params.q || "").trim().toLowerCase();
  const language = (params.language || "").trim().toLowerCase();
  const genre = (params.genre || "").trim().toLowerCase();
  const year = Number(params.year || 0);
  const sort = params.sort || "latest";

  let filtered = series.filter((item) => {
    const matchesQ = !q || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    const matchesLanguage = !language || item.language.toLowerCase() === language;
    const matchesGenre = !genre || item.category.toLowerCase() === genre || item.tags.some((tag) => tag.toLowerCase() === genre);
    const matchesYear = !year || item.year === year;
    return matchesQ && matchesLanguage && matchesGenre && matchesYear;
  });

  filtered = filtered.sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "popular") return b.popularity - a.popularity;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const languages = Array.from(new Set(series.map((item) => item.language).filter(Boolean))).sort();
  const genres = Array.from(new Set(series.map((item) => item.category).filter(Boolean))).sort();
  const years = Array.from(new Set(series.map((item) => item.year).filter(Boolean))).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-5">
        <h1 className="font-[var(--font-heading)] text-4xl text-white">Web Series</h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">Queue your next binge and explore seasons by genre and language.</p>
      </section>
      <form className="grid gap-3 rounded-2xl border border-[#2A2A2A] bg-[#141414] p-4 md:grid-cols-5">
        <input name="q" defaultValue={params.q || ""} placeholder="Search title" className="rounded-xl border border-[#303030] bg-black/30 px-4 py-2 text-sm text-white" />
        <select name="language" defaultValue={params.language || ""} className="rounded-xl border border-[#303030] bg-black/30 px-4 py-2 text-sm text-white">
          <option value="">All Languages</option>
          {languages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select name="genre" defaultValue={params.genre || ""} className="rounded-xl border border-[#303030] bg-black/30 px-4 py-2 text-sm text-white">
          <option value="">All Genres</option>
          {genres.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select name="year" defaultValue={params.year || ""} className="rounded-xl border border-[#303030] bg-black/30 px-4 py-2 text-sm text-white">
          <option value="">All Years</option>
          {years.map((item) => (
            <option key={item} value={String(item)}>
              {item}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="rounded-xl border border-[#303030] bg-black/30 px-4 py-2 text-sm text-white">
          <option value="latest">Latest</option>
          <option value="popular">Most Popular</option>
          <option value="rating">Top Rated</option>
        </select>
        <button type="submit" className="rounded-xl bg-[#E50914] px-4 py-2 text-sm font-bold text-white md:col-span-5">
          Apply Filters
        </button>
      </form>
      <ContentRow title={`All Series (${filtered.length})`} items={filtered} />
    </div>
  );
}
