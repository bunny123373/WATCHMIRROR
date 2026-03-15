import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const ADMIN_KEY = process.env.ADMIN_KEY || "watchmirror_admin_key";

async function verifyAdmin(key: string) {
  return key === ADMIN_KEY;
}

async function fetchWithTimeout(url: string, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

function extractVideoUrl(html: string): { hlsLink: string; embedIframeLink: string } {
  let hlsLink = "";
  let embedIframeLink = "";

  // Try to find m3u8
  const m3u8Patterns = [
    /"file":\s*"([^"]+)"/,
    /"src":\s*"([^"]+)"/,
    /file:\s*'([^']+)'/,
    /source[^>]*src=["']([^"']+)["']/i,
    /(?:file|src)\s*[:=]\s*['"]([^'"]+\.m3u8[^'"]*)['"]/i,
  ];
  
  for (const pattern of m3u8Patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = match[1];
      if (url.includes('.m3u8')) {
        hlsLink = url;
        break;
      }
    }
  }

  // Try iframe
  if (!embedIframeLink) {
    const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (iframeMatch && iframeMatch[1]) {
      embedIframeLink = iframeMatch[1];
    }
  }

  // Try video tag
  if (!hlsLink && !embedIframeLink) {
    const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (videoMatch && videoMatch[1]) {
      hlsLink = videoMatch[1];
    }
  }

  // Try data-src
  if (!hlsLink && !embedIframeLink) {
    const dataSrcMatch = html.match(/data-src=["']([^"']+)["']/);
    if (dataSrcMatch && dataSrcMatch[1]) {
      if (dataSrcMatch[1].includes('.m3u8')) {
        hlsLink = dataSrcMatch[1];
      } else {
        embedIframeLink = dataSrcMatch[1];
      }
    }
  }

  return { hlsLink, embedIframeLink };
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const adminKey = headersList.get("x-admin-key");

    if (!adminKey || !(await verifyAdmin(adminKey))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let { externalId, baseUrl, seasons: seasonCount, episodesPerSeason } = body;

    if (!externalId && !baseUrl) {
      return NextResponse.json({ error: "External ID or Base URL is required" }, { status: 400 });
    }

    const seasons: any[] = [];

    // If baseUrl provided, use it directly
    if (baseUrl) {
      const numSeasons = parseInt(seasonCount) || 1;
      const numEpisodes = parseInt(episodesPerSeason) || 10;

      for (let s = 1; s <= numSeasons; s++) {
        const episodes: any[] = [];
        
        for (let e = 1; e <= numEpisodes; e++) {
          const episodeUrl = baseUrl
            .replace('{season}', s.toString())
            .replace('{episode}', e.toString())
            .replace('{seasonNumber}', s.toString())
            .replace('{episodeNumber}', e.toString())
            .replace('{ep}', e.toString())
            .replace(/\/1\//, `/${s}/`)
            .replace(/\/1$/, `/${s}`)
            .replace(/(\.\w+)$/, `.${e}$1`)
            .replace(/\.html$/, `-${s}-${e}.html`)
            .replace(/\/tv\/(\d+)/, `/tv/$1/${s}/${e}`);

          try {
            const epResponse = await fetchWithTimeout(episodeUrl, 8000);
            
            if (epResponse.ok) {
              const epHtml = await epResponse.text();
              const { hlsLink, embedIframeLink } = extractVideoUrl(epHtml);
              
              if (hlsLink || embedIframeLink) {
                episodes.push({
                  episodeNumber: e,
                  episodeTitle: `Episode ${e}`,
                  hlsLink: hlsLink || "",
                  embedIframeLink: embedIframeLink || "",
                });
              }
            }
          } catch {
            // Episode might not exist
          }
        }

        if (episodes.length > 0) {
          seasons.push({ seasonNumber: s, episodes });
        }
      }

      if (seasons.length > 0) {
        return NextResponse.json({ seasons });
      }
    }

    // Try various streaming site patterns with externalId
    const patterns = [
      // vidfast patterns
      `https://vidfast.pro/tv/${externalId}/SEASON/EPISODE`,
      `https://vidfast.pro/embed/SEASON-EPISODE-${externalId}`,
      // vidplay patterns
      `https://vidplay.online/tv/${externalId}/SEASON/EPISODE`,
      // superstream
      `https://superstream.bz/tv/${externalId}/SEASON/EPISODE`,
      // streamwish
      `https://streamwish.com/embed/SEASON${externalId}`,
      // filemoon
      `https://filemoon.sx/e/${externalId}`,
      // mixdrop
      `https://mixdrop.co/e/${externalId}`,
      // doodstream
      `https://doodstream.com/e/${externalId}`,
    ];

    for (const pattern of patterns) {
      seasons.length = 0;
      
      // Try seasons 1-10, episodes 1-20
      for (let s = 1; s <= 10; s++) {
        const episodes: any[] = [];
        
        for (let e = 1; e <= 20; e++) {
          let episodeUrl = pattern
            .replace('SEASON', s.toString())
            .replace('EPISODE', e.toString())
            .replace(`-${externalId}`, `-${s}${e}-${externalId}`);

          try {
            const epResponse = await fetchWithTimeout(episodeUrl, 5000);
            
            if (epResponse.ok) {
              const epHtml = await epResponse.text();
              const { hlsLink, embedIframeLink } = extractVideoUrl(epHtml);
              
              if (hlsLink || embedIframeLink) {
                episodes.push({
                  episodeNumber: e,
                  episodeTitle: `Episode ${e}`,
                  hlsLink: hlsLink || "",
                  embedIframeLink: embedIframeLink || "",
                });
              }
            }
          } catch {
            // Continue to next episode
          }
        }

        if (episodes.length > 0) {
          seasons.push({ seasonNumber: s, episodes });
        }
      }

      if (seasons.length > 0) {
        console.log(`Found ${seasons.length} seasons with pattern: ${pattern.slice(0, 50)}...`);
        return NextResponse.json({ seasons });
      }
    }

    // Last resort: create one season with placeholder
    seasons.push({
      seasonNumber: 1,
      episodes: [{
        episodeNumber: 1,
        episodeTitle: "Episode 1",
        hlsLink: "",
        embedIframeLink: ""
      }]
    });

    return NextResponse.json({ 
      seasons,
      hint: "No episodes found automatically. You can use 'Base URL' option with pattern like: https://vidfast.pro/tv/ID/{season}/{episode}"
    });

  } catch (error) {
    console.error("Auto-fill error:", error);
    return NextResponse.json({ error: "Failed: " + (error as Error).message }, { status: 500 });
  }
}
