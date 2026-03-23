import { NextRequest, NextResponse } from "next/server";
import { getTMDBSeasonEpisodes } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const seasonNumber = request.nextUrl.searchParams.get("season");

  if (!seasonNumber) {
    return NextResponse.json({ error: "Season number required" }, { status: 400 });
  }

  try {
    const episodes = await getTMDBSeasonEpisodes(id, parseInt(seasonNumber));
    return NextResponse.json({ episodes }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=3600" } });
  } catch (error) {
    return NextResponse.json({ error: "TMDB season episodes fetch failed" }, { status: 500 });
  }
}
