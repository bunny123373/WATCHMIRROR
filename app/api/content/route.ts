import { NextResponse } from "next/server";
import { getAllContent } from "@/lib/content";

export async function GET() {
  try {
    const items = await getAllContent();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}