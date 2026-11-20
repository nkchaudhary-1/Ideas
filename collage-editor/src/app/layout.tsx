import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Collage Studio — Instagram photo, video & carousel editor",
  description: "Design Instagram posts, collages, typography and mixed photo-and-video carousels in the browser.",
  // "Add to Home Screen" opens it full screen like an app
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Collage", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

// notches and home indicators: the editor pads itself with env(safe-area-inset-*)
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#eaeaea" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
