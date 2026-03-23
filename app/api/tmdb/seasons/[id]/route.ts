import { NextRequest, NextResponse } from "next/server";
import { getTMDBSeasons } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const seasons = await getTMDBSeasons(id);
    return NextResponse.json({ seasons }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=3600" } });
  } catch (error) {
    return NextResponse.json({ error: "TMDB seasons fetch failed" }, { status: 500 });
  }
}
