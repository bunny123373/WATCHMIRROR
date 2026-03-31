import { NextRequest, NextResponse } from "next/server";
import { getAllContent, getContentBySlug } from "@/lib/content";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slugs = searchParams.get("slugs");
    const slug = searchParams.get("slug");

    if (slug) {
      const item = await getContentBySlug(slug);
      return NextResponse.json({ items: item ? [item] : [] });
    }

    if (slugs) {
      const slugList = slugs.split(",");
      const items = await Promise.all(slugList.map((s) => getContentBySlug(s.trim())));
      return NextResponse.json({ items: items.filter(Boolean) });
    }

    const items = await getAllContent();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}
