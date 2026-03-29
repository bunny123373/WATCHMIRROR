import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { WatchProgressModel } from "@/lib/models/WatchProgress";

type ProgressItem = {
  slug: string;
  type: "movie" | "series";
  title: string;
  poster: string;
  currentTime: number;
  duration: number;
  seasonNumber?: number;
  episodeNumber?: number;
  updatedAt: string;
};

function normalizeEpisodeNumber(value: string | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializeProgressItem(item: any): ProgressItem {
  return {
    slug: item.slug,
    type: item.type,
    title: item.title,
    poster: item.poster,
    currentTime: item.currentTime,
    duration: item.duration,
    seasonNumber: item.seasonNumber ?? undefined,
    episodeNumber: item.episodeNumber ?? undefined,
    updatedAt: new Date(item.updatedAt).toISOString()
  };
}

export async function GET(request: NextRequest) {
  const profileName = request.nextUrl.searchParams.get("profile")?.trim() || "";
  const slug = request.nextUrl.searchParams.get("slug")?.trim() || "";
  const seasonNumber = normalizeEpisodeNumber(request.nextUrl.searchParams.get("seasonNumber"));
  const episodeNumber = normalizeEpisodeNumber(request.nextUrl.searchParams.get("episodeNumber"));

  if (!profileName) {
    return NextResponse.json({ error: "Missing profile" }, { status: 400 });
  }

  try {
    await connectDB();

    if (slug) {
      const item = await WatchProgressModel.findOne({
        profileName,
        slug,
        seasonNumber,
        episodeNumber
      })
        .sort({ updatedAt: -1 })
        .lean();

      return NextResponse.json({
        item: item ? serializeProgressItem(item) : null
      });
    }

    const items = await WatchProgressModel.find({ profileName })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      items: items.map((item) => serializeProgressItem(item))
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const profileName = typeof body.profileName === "string" ? body.profileName.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const type = body.type === "movie" || body.type === "series" ? body.type : null;
    const title = typeof body.title === "string" ? body.title : "";
    const poster = typeof body.poster === "string" ? body.poster : "";
    const currentTime = Number(body.currentTime);
    const duration = Number(body.duration);
    const seasonNumber = typeof body.seasonNumber === "number" ? body.seasonNumber : null;
    const episodeNumber = typeof body.episodeNumber === "number" ? body.episodeNumber : null;

    if (!profileName || !slug || !type || !Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ error: "Invalid progress payload" }, { status: 400 });
    }

    const progress = currentTime / duration;

    await connectDB();

    if (progress < 0.05 || progress > 0.95) {
      await WatchProgressModel.findOneAndDelete({
        profileName,
        slug,
        seasonNumber,
        episodeNumber
      });

      return NextResponse.json({ removed: true });
    }

    const item = await WatchProgressModel.findOneAndUpdate(
      { profileName, slug, seasonNumber, episodeNumber },
      {
        profileName,
        slug,
        type,
        title,
        poster,
        currentTime,
        duration,
        seasonNumber,
        episodeNumber
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      item: item ? serializeProgressItem(item) : null
    });
  } catch {
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
