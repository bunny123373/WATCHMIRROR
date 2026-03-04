import HeroBanner from "@/components/home/HeroBanner";
import ContinueWatchingRow from "@/components/home/ContinueWatchingRow";
import TopTenRow from "@/components/home/TopTenRow";
import MyListRow from "@/components/home/MyListRow";
import ContentRow from "@/components/common/ContentRow";
import { getHomeRows } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeRows();
  return (
    <div className="space-y-12">
      <HeroBanner item={data.trending[0] || null} />

      <TopTenRow items={data.trending} />
      <MyListRow />
      <ContinueWatchingRow />
      <ContentRow title="Trending Now" items={data.trending} />
      <ContentRow title="Top Rated" items={data.topRated} />
      <ContentRow title="Popular Movies" items={data.popularMovies} />
      <ContentRow title="Popular Series" items={data.popularSeries} />
      <ContentRow title="Recently Added" items={data.recentlyAdded} />
    </div>
  );
}
