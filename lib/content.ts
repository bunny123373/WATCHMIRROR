import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { ContentModel } from "@/lib/models/Content";
import { Content } from "@/types/content";

const LIST_SELECT_FIELDS =
  "type title slug poster banner description year language category quality rating tags popularity createdAt";

function getVisibilityQuery() {
  return {
    $or: [{ publishAt: { $exists: false } }, { publishAt: null }, { publishAt: { $lte: new Date() } }]
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const getHomeRowsCached = unstable_cache(
  async (): Promise<{
    trending: Content[];
    topRated: Content[];
    popularMovies: Content[];
    popularSeries: Content[];
    recentlyAdded: Content[];
  }> => {
    await connectDB();
    const visible = getVisibilityQuery();

    const [trending, topRated, popularMovies, popularSeries, recentlyAdded] = await Promise.all([
      ContentModel.find({
        $and: [visible, { $or: [{ popularity: { $gt: 100 } }, { rating: { $gt: 7.5 } }] }]
      })
        .select(LIST_SELECT_FIELDS)
        .sort({ popularity: -1 })
        .limit(16)
        .lean<Content[]>(),
      ContentModel.find(visible).select(LIST_SELECT_FIELDS).sort({ rating: -1 }).limit(16).lean<Content[]>(),
      ContentModel.find({ ...visible, type: "movie" })
        .select(LIST_SELECT_FIELDS)
        .sort({ popularity: -1 })
        .limit(16)
        .lean<Content[]>(),
      ContentModel.find({ ...visible, type: "series" })
        .select(LIST_SELECT_FIELDS)
        .sort({ popularity: -1 })
        .limit(16)
        .lean<Content[]>(),
      ContentModel.find(visible).select(LIST_SELECT_FIELDS).sort({ createdAt: -1 }).limit(16).lean<Content[]>()
    ]);

    return {
      trending,
      topRated,
      popularMovies,
      popularSeries,
      recentlyAdded
    };
  },
  ["content:home-rows:v2"],
  { revalidate: 180, tags: ["content"] }
);

const getHomeBrowseSectionsCached = unstable_cache(
  async (genres: string[], languages: string[]) => {
    await connectDB();
    const items = await ContentModel.find(getVisibilityQuery())
      .select(LIST_SELECT_FIELDS)
      .sort({ popularity: -1, createdAt: -1 })
      .limit(500)
      .lean<Content[]>();

    const genreData = genres.map((name) => {
      const term = name.trim().toLowerCase();
      const filtered = items
        .filter((item) => {
          const category = (item.category || "").toLowerCase();
          const tags = (item.tags || []).map((tag) => tag.toLowerCase());
          return category.includes(term) || tags.includes(term);
        })
        .slice(0, 20);
      return { name, items: filtered };
    });

    const languageData = languages.map((name) => {
      const term = name.trim().toLowerCase();
      const filtered = items.filter((item) => (item.language || "").toLowerCase() === term).slice(0, 20);
      return { name, items: filtered };
    });

    return { genreData, languageData };
  },
  ["content:home-browse-sections:v1"],
  { revalidate: 180, tags: ["content"] }
);

const getContentBySlugCached = unstable_cache(
  async (slug: string): Promise<Content | null> => {
    await connectDB();
    const data = await ContentModel.findOne({ slug, ...getVisibilityQuery() }).lean<Content | null>();
    return data;
  },
  ["content:by-slug:v1"],
  { revalidate: 120, tags: ["content"] }
);

const getSimilarContentCached = unstable_cache(
  async (id: string, type: "movie" | "series", category: string, tags: string[]): Promise<Content[]> => {
    await connectDB();

    const relationClauses: Record<string, unknown>[] = [];
    if (Array.isArray(tags) && tags.length > 0) {
      relationClauses.push({ tags: { $in: tags } });
    }
    if (category) {
      relationClauses.push({ category });
    }

    let primary: Content[] = [];
    if (relationClauses.length > 0) {
      primary = await ContentModel.find({
        _id: { $ne: id },
        $and: [getVisibilityQuery(), { type }, { $or: relationClauses }]
      })
        .select(LIST_SELECT_FIELDS)
        .sort({ popularity: -1 })
        .limit(12)
        .lean<Content[]>();
    }

    if (primary.length >= 6) {
      return primary;
    }

    const existingIds = primary.map((item) => item._id).filter(Boolean);
    const fallback = await ContentModel.find({
      _id: { $nin: [id, ...existingIds] },
      ...getVisibilityQuery(),
      type
    })
      .select(LIST_SELECT_FIELDS)
      .sort({ createdAt: -1, popularity: -1 })
      .limit(12 - primary.length)
      .lean<Content[]>();

    return [...primary, ...fallback];
  },
  ["content:similar:v1"],
  { revalidate: 180, tags: ["content"] }
);

const getAllContentCached = unstable_cache(
  async (type?: "movie" | "series"): Promise<Content[]> => {
    await connectDB();
    const query = type ? { ...getVisibilityQuery(), type } : getVisibilityQuery();
    const data = await ContentModel.find(query).select(LIST_SELECT_FIELDS).sort({ createdAt: -1 }).lean<Content[]>();
    return data;
  },
  ["content:all:v1"],
  { revalidate: 180, tags: ["content"] }
);

const getContentByGenreCached = unstable_cache(
  async (genre: string, type?: "movie" | "series"): Promise<Content[]> => {
    await connectDB();
    const safeGenre = escapeRegex(genre);
    const query = {
      ...(type && { type }),
      $and: [
        getVisibilityQuery(),
        {
          $or: [{ category: { $regex: safeGenre, $options: "i" } }, { tags: { $in: [new RegExp(safeGenre, "i")] } }]
        }
      ]
    };
    const data = await ContentModel.find(query).select(LIST_SELECT_FIELDS).sort({ popularity: -1 }).limit(20).lean<Content[]>();
    return data;
  },
  ["content:by-genre:v1"],
  { revalidate: 180, tags: ["content"] }
);

const getContentByLanguageCached = unstable_cache(
  async (language: string, type?: "movie" | "series"): Promise<Content[]> => {
    await connectDB();
    const safeLanguage = escapeRegex(language);
    const query = {
      ...getVisibilityQuery(),
      ...(type && { type }),
      language: { $regex: new RegExp(`^${safeLanguage}$`, "i") }
    };
    const data = await ContentModel.find(query).select(LIST_SELECT_FIELDS).sort({ popularity: -1 }).limit(20).lean<Content[]>();
    return data;
  },
  ["content:by-language:v1"],
  { revalidate: 180, tags: ["content"] }
);

export async function getHomeBrowseSections(genres: string[], languages: string[]) {
  return getHomeBrowseSectionsCached(genres, languages);
}

export async function getHomeRows(): Promise<{
  trending: Content[];
  topRated: Content[];
  popularMovies: Content[];
  popularSeries: Content[];
  recentlyAdded: Content[];
}> {
  return getHomeRowsCached();
}

export async function getContentBySlug(slug: string): Promise<Content | null> {
  return getContentBySlugCached(slug);
}

export async function getSimilarContent(content: Content): Promise<Content[]> {
  if (!content._id) {
    return [];
  }

  return getSimilarContentCached(String(content._id), content.type, content.category || "", content.tags || []);
}

export async function getAllContent(type?: "movie" | "series"): Promise<Content[]> {
  return getAllContentCached(type);
}

export async function getContentByGenre(genre: string, type?: "movie" | "series"): Promise<Content[]> {
  return getContentByGenreCached(genre, type);
}

export async function getGenres(): Promise<{ name: string; slug: string }[]> {
  const genres = [
    { name: "Action", slug: "action" },
    { name: "Adventure", slug: "adventure" },
    { name: "Animation", slug: "animation" },
    { name: "Comedy", slug: "comedy" },
    { name: "Crime", slug: "crime" },
    { name: "Drama", slug: "drama" },
    { name: "Fantasy", slug: "fantasy" },
    { name: "Horror", slug: "horror" },
    { name: "Mystery", slug: "mystery" },
    { name: "Romance", slug: "romance" },
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Thriller", slug: "thriller" },
    { name: "War", slug: "war" },
    { name: "Western", slug: "western" }
  ];
  return genres;
}

export async function getContentByLanguage(language: string, type?: "movie" | "series"): Promise<Content[]> {
  return getContentByLanguageCached(language, type);
}
