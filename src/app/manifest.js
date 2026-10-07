// PWA manifest (Next serves it at /manifest.webmanifest and links it automatically).
export default function manifest() {
  return {
    name: "Freshly. Grocery",
    short_name: "Freshly",
    description: "Fresh groceries delivered to your door",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdf8ee",
    theme_color: "#1f6b3a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
