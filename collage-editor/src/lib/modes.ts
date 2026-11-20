import { Columns3, GalleryHorizontal, LayoutGrid, SlidersHorizontal, Smartphone, Square, type LucideIcon } from "lucide-react";
import type { Project } from "./types";
import { panoramaCount } from "./formats";

export type ModeKey = "single" | "collage" | "carousel" | "panorama" | "story" | "edit";
export interface ModeInfo { label: string; noun: string; Icon: LucideIcon; blurb: string }

/** what each kind of project is called, and a plain sentence on what it is for */
export const MODES: Record<ModeKey, ModeInfo> = {
  single: { label: "Single post", noun: "post", Icon: Square, blurb: "One picture or design for one post." },
  collage: { label: "Collage", noun: "collage", Icon: LayoutGrid, blurb: "Several photos together in one layout." },
  carousel: { label: "Carousel", noun: "carousel", Icon: GalleryHorizontal, blurb: "A set of slides people swipe through. Each slide is its own design." },
  panorama: { label: "Panorama", noun: "panorama", Icon: Columns3, blurb: "One wide picture that is cut into slides when you export." },
  story: { label: "Story", noun: "story", Icon: Smartphone, blurb: "A tall 9:16 design for Stories and Reels." },
  edit: { label: "Photo & video edit", noun: "edit", Icon: SlidersHorizontal, blurb: "Adjust photos and videos one by one, or all together." },
};

/** a single wide canvas is a panorama; everything else is its project kind */
export function modeOf(p: Pick<Project, "kind" | "slides">): ModeKey {
  if (p.kind === "single" && panoramaCount(p.slides[0]?.width ?? 0) > 1) return "panorama";
  return p.kind;
}
