import { NextRequest, NextResponse } from "next/server";

function sanitizeFilename(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim();
}

function extensionFromContentType(contentType: string | null) {
  const type = (contentType || "").toLowerCase();
  if (type.includes("mp4")) return ".mp4";
  if (type.includes("webm")) return ".webm";
  if (type.includes("mpegurl") || type.includes("m3u8")) return ".m3u8";
  if (type.includes("quicktime")) return ".mov";
  return "";
}

function extensionFromUrl(rawUrl: string) {
  try {
    const pathname = new URL(rawUrl).pathname;
    const match = pathname.match(/(\.[a-z0-9]{2,5})$/i);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest) {
  const fileUrl = request.nextUrl.searchParams.get("url");
  const title = request.nextUrl.searchParams.get("title") || "video";

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(fileUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  const upstream = await fetch(parsedUrl.toString(), {
    headers: {
      "user-agent": "WATCHMIRROR-Downloader/1.0"
    }
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  const ext = extensionFromUrl(parsedUrl.toString()) || extensionFromContentType(contentType) || ".mp4";
  const filename = `${sanitizeFilename(title) || "video"}${ext.startsWith(".") ? ext : `.${ext}`}`;

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store"
    }
  });
}
