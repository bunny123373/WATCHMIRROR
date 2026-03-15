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
  <script type="module" src="https://cdn.jsdelivr.net/npm/vidstack@1.12.13/player/layouts/default/+esm"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; background: black; overflow: hidden; }
    media-player { width: 100%; height: 100vh; display: block; }
    .vds-video { width: 100%; height: 100%; object-fit: contain; }
  </style>
</head>
<body>
<media-player
  class="player"
  title="Player"
  src="${src}"
  crossorigin
  playsinline
  ${poster ? `poster="${poster}"` : ''}
>
  <media-provider></media-provider>
  <media-video-layout 
    ${poster ? `thumbnails="${poster}"` : ''}
  ></media-video-layout>
</media-player>
<script>
  const player = document.querySelector('media-player');
  player.addEventListener('ready', () => {
    console.log('Player ready');
  });
  player.addEventListener('error', (e) => {
    console.error('Player error:', e);
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
