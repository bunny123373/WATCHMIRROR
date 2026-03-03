import { NextRequest, NextResponse } from "next/server";
import { getTMDBDetails } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mediaType = (request.nextUrl.searchParams.get("mediaType") || "movie") as "movie" | "tv";

  try {
    const details = await getTMDBDetails(id, mediaType);
    return NextResponse.json({ details }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=3600" } });
  } catch (error) {
    return NextResponse.json({ error: "TMDB details failed" }, { status: 500 });
  }
}