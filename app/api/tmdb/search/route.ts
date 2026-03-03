import { NextRequest, NextResponse } from "next/server";
import { searchTMDB } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") || "";
  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTMDB(query);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=3600" } });
  } catch (error) {
    return NextResponse.json({ error: "TMDB search failed" }, { status: 500 });
  }
}