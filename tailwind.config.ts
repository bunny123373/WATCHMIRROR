import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050608",
        card: "#0E1015",
        border: "#1F232D",
        primary: "#F5C542",
        secondary: "#8B5CF6",
        accent: "#22C55E",
        text: "#F9FAFB",
        muted: "#9CA3AF"
      },
      boxShadow: {
        glass: "0 8px 40px rgba(0,0,0,0.45)"
      }
    }
  },
  plugins: []
};

export default config;