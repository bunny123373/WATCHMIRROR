import { NextRequest, NextResponse } from "next/server";
import { validateAdminKey } from "@/lib/admin";
import { connectDB } from "@/lib/db";
import { ContentModel } from "@/lib/models/Content";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const items = await ContentModel.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const payload = await request.json();

    if (!payload.title || !payload.type) {
      return NextResponse.json({ error: "title and type are required" }, { status: 400 });
    }

    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);

    const created = await ContentModel.create({
      ...payload,
      slug,
      metaTitle: payload.metaTitle || `${payload.title} | WATCHMIRROR`,
      metaDescription: payload.metaDescription || `${payload.title} streaming on WATCHMIRROR.`
    });

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const payload = await request.json();
    const id = payload?._id;

    if (!id) {
      return NextResponse.json({ error: "_id is required" }, { status: 400 });
    }

    if (!payload.title || !payload.type) {
      return NextResponse.json({ error: "title and type are required" }, { status: 400 });
    }

    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);

    const updated = await ContentModel.findByIdAndUpdate(
      id,
      {
        ...payload,
        slug,
        metaTitle: payload.metaTitle || `${payload.title} | WATCHMIRROR`,
        metaDescription: payload.metaDescription || `${payload.title} streaming on WATCHMIRROR.`
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await ContentModel.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}
