import HeroBanner from "@/components/home/HeroBanner";
import ContinueWatchingRow from "@/components/home/ContinueWatchingRow";
import TopTenRow from "@/components/home/TopTenRow";
import MyListRow from "@/components/home/MyListRow";
import ContentRow from "@/components/common/ContentRow";
import { getHomeBrowseSections, getHomeRows } from "@/lib/content";

export const revalidate = 180;

const GENRES = ["Action", "Comedy", "Horror", "Thriller", "Romance", "Sci-Fi"];
const LANGUAGES = ["English", "Telugu", "Hindi", "Tamil", "Korean", "Japanese", "Spanish"];

export default async function HomePage() {
  const [data, browseData] = await Promise.all([getHomeRows(), getHomeBrowseSections(GENRES, LANGUAGES)]);
  const { genreData, languageData } = browseData;

  return (
    <div className="space-y-10">
      <HeroBanner item={data.trending[0] || null} />

      <TopTenRow items={data.trending} />
      <MyListRow />
      <ContinueWatchingRow />
      
      <ContentRow title="Trending Now" items={data.trending} />
      <ContentRow title="Top Rated" items={data.topRated} />
      <ContentRow title="Popular Movies" items={data.popularMovies} />
      <ContentRow title="Popular Series" items={data.popularSeries} />
      <ContentRow title="Recently Added" items={data.recentlyAdded} />

      {genreData.map((genre) => (
        genre.items.length > 0 && (
          <ContentRow key={genre.name} title={`${genre.name}`} items={genre.items} />
        )
      ))}

      {languageData.map((lang) => (
        lang.items.length > 0 && (
          <ContentRow key={lang.name} title={`${lang.name} Movies`} items={lang.items} />
        )
      ))}
    </div>
  );
}
