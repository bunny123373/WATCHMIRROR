import HeroBanner from "@/components/home/HeroBanner";
import ContinueWatchingRow from "@/components/home/ContinueWatchingRow";
import PersonalizedRow from "@/components/home/PersonalizedRow";
import ContentRow from "@/components/common/ContentRow";
import { getHomeRows } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeRows();
  const languageCount = Object.keys(data.languages).length;
  const totalHighlights = data.trending.length + data.latest.length;

  return (
    <div className="space-y-10">
      <HeroBanner item={data.trending[0] || data.latest[0] || null} />
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted">Trending Now</p>
          <p className="mt-2 font-[var(--font-heading)] text-3xl text-primary">{data.trending.length}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted">Languages</p>
          <p className="mt-2 font-[var(--font-heading)] text-3xl text-primary">{languageCount}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted">Featured Titles</p>
          <p className="mt-2 font-[var(--font-heading)] text-3xl text-primary">{totalHighlights}</p>
        </div>
      </section>
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
