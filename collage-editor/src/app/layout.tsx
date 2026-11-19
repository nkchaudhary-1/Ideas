import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Collage Studio — Instagram photo, video & carousel editor",
  description: "Design Instagram posts, collages, typography and mixed photo-and-video carousels in the browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
