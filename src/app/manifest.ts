import type { MetadataRoute } from "next";

// Lets Chrome on Android install AIPOD to the home screen and open it full
// screen, like an app. The icons are drawn from public/icon.svg.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "AIPOD",
    short_name: "AIPOD",
    description:
      "Turn your own study notes into spoken scripts you can revise from on your commute.",
    // Open on the list of scripts, which is what is wanted on the road.
    start_url: "/scripts",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#171717",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
