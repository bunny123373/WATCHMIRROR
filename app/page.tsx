import HeroBanner from "@/components/home/HeroBanner";
import ContinueWatchingRow from "@/components/home/ContinueWatchingRow";
import PersonalizedRow from "@/components/home/PersonalizedRow";
import EpisodeAlerts from "@/components/home/EpisodeAlerts";
import ContentRow from "@/components/common/ContentRow";
import { getHomeRows } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeRows();
  const languageCount = Object.keys(data.languages).length;
  const totalHighlights = data.trending.length + data.latest.length;
  const categorySet = Array.from(
    new Set([...data.trending, ...data.latest].map((item) => item.category).filter(Boolean))
  ).slice(0, 8);
  const spotlightGrid = [...data.trending, ...data.latest].slice(0, 6);

  return (
    <div className="space-y-12">
      <HeroBanner item={data.trending[0] || data.latest[0] || null} />
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
          <p className="text-xs uppercase tracking-widest text-[#b3b3b3]">Trending Now</p>
          <p className="mt-2 font-[var(--font-heading)] text-3xl text-[#e50914]">{data.trending.length}</p>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
          <p className="text-xs uppercase tracking-widest text-[#b3b3b3]">Languages</p>
          <p className="mt-2 font-[var(--font-heading)] text-3xl text-[#e50914]">{languageCount}</p>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
          <p className="text-xs uppercase tracking-widest text-[#b3b3b3]">Featured Titles</p>
          <p className="mt-2 font-[var(--font-heading)] text-3xl text-[#e50914]">{totalHighlights}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-[var(--font-heading)] text-2xl">Categories</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          {categorySet.map((category) => (
            <div key={category} className="rounded-xl border border-[#2a2a2a] bg-[#1b1b1b] px-4 py-3 text-sm font-semibold text-[#f5f5f1]">
              {category}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-[var(--font-heading)] text-2xl">Spotlight Grid</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spotlightGrid.map((item) => (
            <div key={`${item.type}-${item.slug}`} className="rounded-xl border border-[#2a2a2a] bg-[#181818] p-3">
              <p className="line-clamp-1 font-semibold">{item.title}</p>
              <p className="mt-1 text-xs text-[#b3b3b3]">
                {item.year} | {item.language} | {Number.isFinite(item.rating) ? item.rating.toFixed(1) : "N/A"}
              </p>
            </div>
          ))}
        </div>
      </section>
      <EpisodeAlerts />
      <ContinueWatchingRow />
      <PersonalizedRow />
      <ContentRow title="Trending" items={data.trending} />
      <ContentRow title="Latest" items={data.latest} />

      {Object.entries(data.languages).map(([language, items]) => (
        <ContentRow key={language} title={`${language} Picks`} items={items} />
      ))}
    </div>
  );
}
