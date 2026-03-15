import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src") || "";
  const poster = request.nextUrl.searchParams.get("poster") || "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script type="module" src="https://cdn.jsdelivr.net/npm/vidstack@1.12.13/+esm"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; background: black; }
    media-player { width: 100%; height: 100vh; }
  </style>
</head>
<body>
<media-player
  title="Player"
  src="${src}"
  crossorigin
  playsinline
  ${poster ? `poster="${poster}"` : ''}
>
  <media-provider></media-provider>
  <media-video-layout></media-video-layout>
</media-player>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
