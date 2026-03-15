import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const ADMIN_KEY = process.env.ADMIN_KEY || "watchmirror_admin_key";

async function verifyAdmin(key: string) {
  return key === ADMIN_KEY;
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const adminKey = headersList.get("x-admin-key");

    if (!adminKey || !(await verifyAdmin(adminKey))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { externalId } = body;

    if (!externalId) {
      return NextResponse.json({ error: "External ID is required" }, { status: 400 });
    }

    const seasons: any[] = [];

    // Try to fetch from multiple external sources
    // Example: vidfast.pro format - /tv/{id}/{season}/{episode}
    
    // First, try to get season info from TMDB or similar
    const sources = [
      {
        name: "vidfast",
        baseUrl: `https://vidfast.pro/tv/${externalId}`,
        pattern: /data-season="(\d+)"/g
      },
      {
        name: "vidplay", 
        baseUrl: `https://vidplay.online/tv/${externalId}`,
        pattern: /data-season="(\d+)"/g
      }
    ];

    // Try to fetch main page to get season list
    for (const source of sources) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(source.baseUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Referer": "https://www.google.com"
          }
        });

        clearTimeout(timeout);

        if (!response.ok) continue;

        const html = await response.text();
        
        // Extract season numbers from the page
        const seasonMatches = [...html.matchAll(/data-season="(\d+)"/g)];
        const seasonNumbers = [...new Set(seasonMatches.map(m => parseInt(m[1])))].sort((a, b) => a - b);

        if (seasonNumbers.length > 0) {
          // For each season, try to get episode links
          for (const seasonNum of seasonNumbers) {
            const episodes: any[] = [];
            
            // Try to get episodes for this season
            for (let epNum = 1; epNum <= 20; epNum++) {
              try {
                const episodeUrl = `${source.baseUrl}/${seasonNum}/${epNum}`;
                const epResponse = await fetch(episodeUrl, {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": source.baseUrl
                  }
                });

                if (!epResponse.ok) break;

                const epHtml = await epResponse.text();
                
                // Look for video source in the page
                let videoUrl = "";
                
                // Check for m3u8 links
                const m3u8Match = epHtml.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/);
                if (m3u8Match) {
                  videoUrl = m3u8Match[1];
                }
                
                // Check for iframe embeds
                const iframeMatch = epHtml.match(/<iframe[^>]+src=["']([^"']+)["']/);
                if (iframeMatch && !videoUrl) {
                  videoUrl = iframeMatch[1];
                }

                // Check for video src in javascript
                const jsMatch = epHtml.match(/sources\s*=\s*\[{[^}]*file:\s*["']([^"']+)["']/);
                if (jsMatch && !videoUrl) {
                  videoUrl = jsMatch[1];
                }

                if (videoUrl) {
                  episodes.push({
                    episodeNumber: epNum,
                    episodeTitle: `Episode ${epNum}`,
                    hlsLink: videoUrl.includes('.m3u8') ? videoUrl : "",
                    embedIframeLink: !videoUrl.includes('.m3u8') ? videoUrl : ""
                  });
                } else {
                  // No more episodes in this season
                  break;
                }
              } catch {
                break;
              }
            }

            if (episodes.length > 0) {
              seasons.push({
                seasonNumber: seasonNum,
                episodes
              });
            }
          }

          if (seasons.length > 0) {
            break;
          }
        }
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
        continue;
      }
    }

    // If no seasons found, try a simpler approach - just create one season with placeholder
    if (seasons.length === 0) {
      // Try direct episode links
      try {
        const testUrls = [
          `https://vidfast.pro/tv/${externalId}/1/1`,
          `https://vidplay.online/tv/${externalId}/1/1`
        ];

        for (const testUrl of testUrls) {
          const response = await fetch(testUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
          });

          if (response.ok) {
            const html = await response.text();
            const m3u8Match = html.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/);
            const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/);

            if (m3u8Match || iframeMatch) {
              seasons.push({
                seasonNumber: 1,
                episodes: [{
                  episodeNumber: 1,
                  episodeTitle: "Episode 1",
                  hlsLink: m3u8Match ? m3u8Match[1] : "",
                  embedIframeLink: iframeMatch ? iframeMatch[1] : ""
                }]
              });
              break;
            }
          }
        }
      } catch (error) {
        console.error("Error testing direct URL:", error);
      }
    }

    if (seasons.length === 0) {
      return NextResponse.json({ error: "No episodes found. Please add episodes manually." }, { status: 404 });
    }

    return NextResponse.json({ seasons });
  } catch (error) {
    console.error("Auto-fill error:", error);
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 });
  }
}
