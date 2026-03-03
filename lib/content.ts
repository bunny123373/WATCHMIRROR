import { connectDB } from "@/lib/db";
import { ContentModel } from "@/lib/models/Content";
import { Content } from "@/types/content";

export async function getHomeRows(): Promise<{
  trending: Content[];
  latest: Content[];
  movies: Content[];
  series: Content[];
  languages: Record<string, Content[]>;
}> {
  await connectDB();

  const [trending, latest, movies, series] = await Promise.all([
    ContentModel.find({ $or: [{ popularity: { $gt: 100 } }, { rating: { $gt: 7.5 } }] }).sort({ popularity: -1 }).limit(16).lean<Content[]>(),
    ContentModel.find({}).sort({ createdAt: -1 }).limit(16).lean<Content[]>(),
    ContentModel.find({ type: "movie" }).sort({ createdAt: -1 }).limit(16).lean<Content[]>(),
    ContentModel.find({ type: "series" }).sort({ createdAt: -1 }).limit(16).lean<Content[]>()
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
  const data = await ContentModel.findOne({ slug }).lean<Content | null>();
  return data;
}

export async function getSimilarContent(content: Content): Promise<Content[]> {
  await connectDB();
  const data = await ContentModel.find({
    _id: { $ne: content._id },
    type: content.type,
    $or: [{ tags: { $in: content.tags } }, { category: content.category }]
  })
    .sort({ popularity: -1 })
    .limit(12)
    .lean<Content[]>();

  return data;
}

export async function getAllContent(type?: "movie" | "series"): Promise<Content[]> {
  await connectDB();
  const query = type ? { type } : {};
  const data = await ContentModel.find(query).sort({ createdAt: -1 }).lean<Content[]>();
  return data;
}
