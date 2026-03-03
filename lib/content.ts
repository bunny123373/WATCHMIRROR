import { connectDB } from "@/lib/db";
import { ContentModel } from "@/lib/models/Content";
import { Content } from "@/types/content";

const visibilityQuery = {
  $or: [{ publishAt: { $exists: false } }, { publishAt: null }, { publishAt: { $lte: new Date() } }]
};

export async function getHomeRows(): Promise<{
  trending: Content[];
  latest: Content[];
  movies: Content[];
  series: Content[];
  languages: Record<string, Content[]>;
}> {
  await connectDB();

  const [trending, latest, movies, series] = await Promise.all([
    ContentModel.find({ $and: [visibilityQuery, { $or: [{ popularity: { $gt: 100 } }, { rating: { $gt: 7.5 } }] }] }).sort({ popularity: -1 }).limit(16).lean<Content[]>(),
    ContentModel.find(visibilityQuery).sort({ createdAt: -1 }).limit(16).lean<Content[]>(),
    ContentModel.find({ ...visibilityQuery, type: "movie" }).sort({ createdAt: -1 }).limit(16).lean<Content[]>(),
    ContentModel.find({ ...visibilityQuery, type: "series" }).sort({ createdAt: -1 }).limit(16).lean<Content[]>()
  ]);

  const languageRows = await ContentModel.aggregate([
    { $sort: { popularity: -1 } },
    {
      $group: {
        _id: "$language",
        items: { $push: "$$ROOT" }
      }
    },
    {
      $project: {
        _id: 1,
        items: { $slice: ["$items", 12] }
      }
    }
  ]);

  const languages = languageRows.reduce((acc: Record<string, Content[]>, row: { _id: string; items: Content[] }) => {
    acc[row._id || "Other"] = row.items;
    return acc;
  }, {});

  return {
    trending,
    latest,
    movies,
    series,
    languages
  };
}

export async function getContentBySlug(slug: string): Promise<Content | null> {
  await connectDB();
  const data = await ContentModel.findOne({ slug, ...visibilityQuery }).lean<Content | null>();
  return data;
}

export async function getSimilarContent(content: Content): Promise<Content[]> {
  await connectDB();
  const primary = await ContentModel.find({
    _id: { $ne: content._id },
    ...visibilityQuery,
    type: content.type,
    $or: [{ tags: { $in: content.tags } }, { category: content.category }]
  })
    .sort({ popularity: -1 })
    .limit(12)
    .lean<Content[]>();

  if (primary.length >= 6) {
    return primary;
  }

  const existingIds = primary.map((item) => item._id).filter(Boolean);
  const fallback = await ContentModel.find({
    _id: { $nin: [content._id, ...existingIds] },
    ...visibilityQuery,
    type: content.type
  })
    .sort({ createdAt: -1, popularity: -1 })
    .limit(12 - primary.length)
    .lean<Content[]>();

  return [...primary, ...fallback];
}

export async function getAllContent(type?: "movie" | "series"): Promise<Content[]> {
  await connectDB();
  const query = type ? { ...visibilityQuery, type } : visibilityQuery;
  const data = await ContentModel.find(query).sort({ createdAt: -1 }).lean<Content[]>();
  return data;
}
