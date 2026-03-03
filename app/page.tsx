import HeroBanner from "@/components/home/HeroBanner";
import ContinueWatchingRow from "@/components/home/ContinueWatchingRow";
import PersonalizedRow from "@/components/home/PersonalizedRow";
import ContentRow from "@/components/common/ContentRow";
import { getHomeRows } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeRows();

  return (
    <div className="space-y-10">
      <HeroBanner item={data.trending[0] || data.latest[0] || null} />
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
