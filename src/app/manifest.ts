import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "星愿 — 送给TA的一份特别祝福",
    short_name: "星愿",
    description: "写一段话 · 选几张照片 · 剩下的交给星光",
    start_url: "/",
    display: "standalone",
    background_color: "#080c18",
    theme_color: "#080c18",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
