import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WATCHMIRROR",
    short_name: "WATCHMIRROR",
    description: "Stream Without Limits.",
    start_url: "/",
    display: "standalone",
    background_color: "#050608",
    theme_color: "#050608",
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
