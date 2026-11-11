import type { MetadataRoute } from "next";

const icon96 = [{ src: "/icons/96.png", sizes: "96x96", type: "image/png" }];

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NONI",
    short_name: "NONI",
    description: "Fictional powerscaling backed by cited evidence.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["entertainment", "games"],
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshots/wide.png", sizes: "1280x720", type: "image/png", form_factor: "wide", label: "How NONI ranks characters" },
      { src: "/screenshots/narrow.png", sizes: "720x1280", type: "image/png", form_factor: "narrow", label: "How NONI ranks characters" },
    ],
    shortcuts: [
      { name: "Battle", url: "/battle", icons: icon96 },
      { name: "Play", url: "/play", icons: icon96 },
      { name: "Leaderboard", url: "/leaderboard", icons: icon96 },
    ],
  };
}