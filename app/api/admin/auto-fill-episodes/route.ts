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
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.google.com/",
        "Connection": "keep-alive",
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function extractVideoUrl(html: string): Promise<{ hlsLink: string; embedIframeLink: string }> {
  let hlsLink = "";
  let embedIframeLink = "";

  // Pattern 1: Direct .m3u8 links
  const m3u8Patterns = [
    /"file":\s*"([^"]+\.m3u8[^"]*)"/,
    /"src":\s*"([^"]+\.m3u8[^"]*)"/,
    /source[^>]*src=["']([^"']+\.m3u8[^"']*)["']/i,
    /(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/,
    /file:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/,
  ];
  
  for (const pattern of m3u8Patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      hlsLink = match[1].replace(/\\/g, "");
      break;
    }
  }

  // Pattern 2: Iframe embeds
  const iframePatterns = [
    /<iframe[^>]+src=["']([^"']+)["'][^>]*>/i,
    /data-src=["']([^"']+)["'][^>]*>/i,
    /player\.src\([^)]+['"]([^'"]+)['"]/,
  ];
  
  for (const pattern of iframePatterns) {
    const match = html.match(pattern);
    if (match && match[1] && !hlsLink) {
      const src = match[1].replace(/\\/g, "");
      // Only use as embed if it's an embed URL
      if (src.includes("embed") || src.includes("player") || src.includes("watch")) {
        embedIframeLink = src;
        break;
      }
    }
  }

  // Pattern 3: Check for JSON data in script tags
  const jsonPatterns = [
    /sources\s*:\s*\[([^\]]+)\]/,
    /videojs\([^)]+sources\s*:\s*\[([^\]]+)\]/,
  ];
  
  for (const pattern of jsonPatterns) {
    const match = html.match(pattern);
    if (match) {
      const m3u8InJson = match[1].match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/);
      if (m3u8InJson && !hlsLink) {
        hlsLink = m3u8InJson[1];
        break;
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
    const { externalId, season: requestedSeason } = body;

    if (!externalId) {
      return NextResponse.json({ error: "External ID is required" }, { status: 400 });
    }

    const seasons: any[] = [];
    
    // List of streaming sources to try
    const streamingSources = [
      {
        name: "vidfast",
        baseUrl: (id: string) => `https://vidfast.pro/tv/${id}`,
        seasonUrl: (id: string, season: number) => `https://vidfast.pro/season/${id}/${season}`,
        episodeUrl: (id: string, season: number, episode: number) => `https://vidfast.pro/tv/${id}/${season}/${episode}`,
      },
      {
        name: "vidplay",
        baseUrl: (id: string) => `https://vidplay.online/tv/${id}`,
        seasonUrl: (id: string, season: number) => `https://vidplay.online/season/${id}/${season}`,
        episodeUrl: (id: string, season: number, episode: number) => `https://vidplay.online/tv/${id}/${season}/${episode}`,
      },
      {
        name: "superstream",
        baseUrl: (id: string) => `https://superstream.bz/tv/${id}`,
        seasonUrl: (id: string, season: number) => `https://superstream.bz/season/${id}/${season}`,
        episodeUrl: (id: string, season: number, episode: number) => `https://superstream.bz/tv/${id}/${season}/${episode}`,
      },
      {
        name: "streamtape",
        baseUrl: (id: string) => `https://streamtape.com/e/${id}`,
        episodeUrl: (id: string, season: number, episode: number) => `https://streamtape.com/e/${id}`,
      },
    ];

    // Try each source
    for (const source of streamingSources) {
      try {
        console.log(`Trying source: ${source.name} with ID: ${externalId}`);
        
        // First, try to get episodes from main page or season page
        const seasonNumbers = requestedSeason ? [parseInt(requestedSeason.toString())] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        for (const seasonNum of seasonNumbers) {
          const episodes: any[] = [];
          
          // Try to get episodes 1-20 for this season
          for (let epNum = 1; epNum <= 20; epNum++) {
            try {
              let episodeUrl: string;
              
              if (source.episodeUrl) {
                episodeUrl = source.episodeUrl(externalId, seasonNum, epNum);
              } else {
                episodeUrl = source.baseUrl(externalId) + `/${seasonNum}/${epNum}`;
              }
              
              const epResponse = await fetchWithTimeout(episodeUrl, 10000);
              
              if (!epResponse.ok) {
                // No more episodes in this season
                break;
              }
              
              const epHtml = await epResponse.text();
              
              // Extract video URL
              const { hlsLink, embedIframeLink } = await extractVideoUrl(epHtml);
              
              if (hlsLink || embedIframeLink) {
                episodes.push({
                  episodeNumber: epNum,
                  episodeTitle: `Episode ${epNum}`,
                  hlsLink: hlsLink || "",
                  embedIframeLink: embedIframeLink || "",
                });
              } else {
                // No video found, try next episode
                continue;
              }
            } catch (error) {
              // Episode might not exist
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
          console.log(`Found ${seasons.length} seasons from ${source.name}`);
          break;
        }
      } catch (error) {
        console.error(`Error with source ${source.name}:`, error);
        continue;
      }
    }

    // If no seasons found, try a simpler approach - test if ID works as embed
    if (seasons.length === 0) {
      try {
        // Try vidfast with simple pattern
        const testUrl = `https://vidfast.pro/tv/${externalId}/1/1`;
        const response = await fetchWithTimeout(testUrl, 10000);
        
        if (response.ok) {
          const html = await response.text();
          const { hlsLink, embedIframeLink } = await extractVideoUrl(html);
          
          if (hlsLink || embedIframeLink) {
            seasons.push({
              seasonNumber: 1,
              episodes: [{
                episodeNumber: 1,
                episodeTitle: "Episode 1",
                hlsLink: hlsLink || "",
                embedIframeLink: embedIframeLink || "",
              }]
            });
          }
        }
      } catch (error) {
        console.error("Fallback test failed:", error);
      }
    }

    if (seasons.length === 0) {
      return NextResponse.json({ 
        error: "No episodes found. Please add episodes manually.",
        hint: "Try entering a different external ID or add episodes manually."
      }, { status: 404 });
    }

    return NextResponse.json({ seasons });
  } catch (error) {
    console.error("Auto-fill error:", error);
    return NextResponse.json({ error: "Failed to fetch episodes: " + (error as Error).message }, { status: 500 });
  }
}
