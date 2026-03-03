import { NextRequest, NextResponse } from "next/server";
import { getTMDBSimilar } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mediaType = (request.nextUrl.searchParams.get("mediaType") || "movie") as "movie" | "tv";

  try {
    const items = await getTMDBSimilar(id, mediaType);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=3600" } });
  } catch (error) {
    return NextResponse.json({ error: "TMDB similar failed" }, { status: 500 });
  }
}