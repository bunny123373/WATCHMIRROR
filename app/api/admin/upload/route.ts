import { NextRequest, NextResponse } from "next/server";
import { validateAdminKey } from "@/lib/admin";
import { connectDB } from "@/lib/db";
import { ContentModel } from "@/lib/models/Content";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const metadataStr = formData.get("metadata") as string | null;
      
      let metadata: Record<string, any> = {};
      if (metadataStr) {
        try {
          metadata = JSON.parse(metadataStr);
        } catch {
          return NextResponse.json({ error: "Invalid metadata JSON" }, { status: 400 });
        }
      }

      if (!metadata.title) {
        return NextResponse.json({ error: "Title is required in metadata" }, { status: 400 });
      }

      await connectDB();

      const slug = slugify(metadata.title);
      
      let videoUrl = "";
      if (file && file.size > 0) {
        videoUrl = `/uploads/${file.name}`;
      }

      const created = await ContentModel.create({
        ...metadata,
        slug,
        hlsLink: metadata.hlsLink || videoUrl,
        embedIframeLink: metadata.embedIframeLink || "",
        metaTitle: metadata.metaTitle || `${metadata.title} | WATCHMIRROR`,
        metaDescription: metadata.metaDescription || `${metadata.title} streaming on WATCHMIRROR.`,
        uploadedFile: file ? {
          originalName: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date()
        } : undefined
      });

      return NextResponse.json({ item: created, fileUploaded: !!file }, { status: 201 });
    } else {
      const payload = await request.json();
      
      if (!payload.title) {
        return NextResponse.json({ error: "title is required" }, { status: 400 });
      }

      await connectDB();
      const slug = slugify(payload.title);

      const created = await ContentModel.create({
        ...payload,
        slug,
        metaTitle: payload.metaTitle || `${payload.title} | WATCHMIRROR`,
        metaDescription: payload.metaDescription || `${payload.title} streaming on WATCHMIRROR.`
      });

      return NextResponse.json({ item: created }, { status: 201 });
    }
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ 
    message: "Upload API endpoint. Use POST to upload files or create content.",
    supportedMethods: {
      "POST multipart/form-data": "Upload video file with metadata",
      "POST application/json": "Create content entry with video URL"
    },
    multipartFields: {
      file: "Video file (optional)",
      metadata: "JSON string with title, language, type, etc."
    },
    jsonFields: {
      title: "Content title (required)",
      language: "Language code (e.g., EN, TE)",
      type: "movie or series",
      hlsLink: "Video URL",
      quality: "HD, FHD, 4K"
    }
  });
}
