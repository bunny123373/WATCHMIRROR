import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src") || "";
  const poster = request.nextUrl.searchParams.get("poster") || "";
  const thumbnails = request.nextUrl.searchParams.get("thumbnails") || "";
  const title = request.nextUrl.searchParams.get("title") || "Video";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.vidstack.io/player/styles/base.css" />
  <link rel="stylesheet" href="https://cdn.vidstack.io/player/styles/default/theme.css" />
  <link rel="stylesheet" href="https://cdn.vidstack.io/player/styles/default/layouts/video.css" />
  <script type="module" src="https://cdn.vidstack.io/player"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; background: black; overflow: hidden; height: 100vh; }
    #target { width: 100%; height: 100%; }
  </style>
</head>
<body>
<div id="target"></div>
<script type="module">
  import { VidstackPlayer, VidstackPlayerLayout } from 'https://cdn.vidstack.io/player';

  const player = await VidstackPlayer.create({
    target: '#target',
    title: '${title}',
    src: '${src}',
    ${poster ? `poster: '${poster}',` : ''}
    layout: new VidstackPlayerLayout({
      ${thumbnails ? `thumbnails: '${thumbnails}',` : ''}
    }),
  });
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
