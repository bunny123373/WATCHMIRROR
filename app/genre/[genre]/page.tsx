import { Metadata } from "next";
import ContentRow from "@/components/common/ContentRow";
import { getContentByGenre, getGenres } from "@/lib/content";

export const revalidate = 180;

export async function generateStaticParams() {
  const genres = await getGenres();
  return genres.map((genre) => ({ genre: genre.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ genre: string }> }): Promise<Metadata> {
  const { genre } = await params;
  const genreName = genre.charAt(0).toUpperCase() + genre.slice(1);
  return {
    title: `${genreName} Movies & TV Shows`
  };
}

export default async function GenrePage({ params }: { params: Promise<{ genre: string }> }) {
  const { genre } = await params;
  const genreName = genre.charAt(0).toUpperCase() + genre.slice(1);
  
  const [movies, series] = await Promise.all([
    getContentByGenre(genre, "movie"),
    getContentByGenre(genre, "series")
  ]);
  
  const allContent = [...movies, ...series];

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-heading)] text-3xl text-white md:text-4xl">{genreName}</h1>
      
      <ContentRow 
        title={`${genreName} Movies & TV Shows (${allContent.length})`} 
        items={allContent} 
      />
    </div>
  );
}
