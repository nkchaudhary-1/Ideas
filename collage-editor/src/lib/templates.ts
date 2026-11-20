import type { Element, MediaEl, ProjectKind, Slide } from "./types";
import { makeFrame, makeGrid, makeShape, makeSlide, makeText, makeGroup, solidBg, defaultLayoutGrid } from "./factory";
import { presetById } from "./grid-engine";
import { ELEMENT_PRESETS } from "./presets";
import { scaleElement } from "./scale-element";
import { MORE_TEMPLATES } from "./templates-more";

export type TemplateCategory = "Personal" | "Instagram portrait" | "Instagram square" | "Story" | "Carousel" | "Photo collage" | "Editorial" | "Typography" | "Magazine" | "Travel" | "Event" | "Minimal" | "Storytelling" | "Poster" | "Quote" | "Fashion" | "Food" | "Sale";

export interface Template {
  id: string;
  name: string;
  categories: TemplateCategory[];
  description: string;
  size: { w: number; h: number };
  kind: ProjectKind;
  build: () => Slide[];
}

const W = 1080, H = 1350;
const white = { type: "solid" as const, color: "#ffffff" };
const dim = { type: "solid" as const, color: "rgba(255,255,255,0.7)" };

const tag = (text: string, x: number, y: number, align: "left" | "right" = "left", w = 320) =>
  makeText({ text, fontFamily: "Outfit", fontWeight: 300, fontSize: 24, letterSpacing: 2.4, fill: dim, width: w, align, name: align === "left" ? "Handle" : "Location" }, x, y);
const handle = (y = H - 142) => tag("yourhandle", 84, y);
const location = (text = "Location : Goa", y = H - 142) => tag(text, W - 84 - 320, y, "right");
const card = (over: Partial<MediaEl> = {}, x = 48, y = 48, w = W - 96, h = H - 96) => makeFrame(w, h, { radius: 64, bg: "#ce6161", name: "Photo card", ...over }, x, y);
const slide = (name: string, bg: string, els: Element[], w = W, h = H): Slide => { const s = makeSlide(w, h, name, solidBg(bg)); s.elements = els; return s; };
const grid = (id: string, w = W, h = H, over = {}) => makeGrid(presetById(id), w, h, { ...over });
const preset = (id: string, w = W, h = H, ink = "#111111") => ELEMENT_PRESETS.find((p) => p.id === id)!.build(w, h, ink);

const BASE_TEMPLATES: Template[] = [
  {
    id: "photo-card-title", name: "Photo card · soft title", categories: ["Instagram portrait", "Minimal"], description: "Rounded photo card, soft serif title, handle and location tags.", size: { w: W, h: H }, kind: "single",
    build: () => [slide("Photo card", "#ffffff", [card(), makeText({ text: "wanna go on a long weekend getaway", fontFamily: "Fraunces", fontWeight: 300, fontSize: 72, lineHeight: 1.09, width: 620, fill: { type: "solid", color: "rgba(255,255,255,0.92)" }, name: "Title" }, 116, 190), handle(), location()])],
  },
  {
    id: "photo-card-handle", name: "Photo card · handle", categories: ["Instagram portrait", "Minimal", "Personal"], description: "Just a photo card and your handle.", size: { w: W, h: H }, kind: "single",
    build: () => [slide("Photo card", "#ffffff", [card({ bg: "#000000" }), handle()])],
  },
  {
    id: "quad", name: "2×2 collage", categories: ["Photo collage", "Instagram portrait"], description: "Four 32 px-radius cells on white, exactly as in your posts.", size: { w: W, h: H }, kind: "collage",
    build: () => [slide("2×2", "#ffffff", [grid("fig-quad", W, H, { cellBg: "#ce6161" })])],
  },
  {
    id: "stack3", name: "Three stacked cards", categories: ["Photo collage", "Storytelling"], description: "Three full-width cards with a serif word on each.", size: { w: W, h: H }, kind: "collage",
    build: () => [slide("Three cards", "#ffffff", [
      grid("fig-stack3", W, H, { cellBg: "#000000" }),
      makeText({ text: "Picnic", fontFamily: "Fraunces", fontWeight: 300, fontSize: 60, lineHeight: 1.09, fill: white, width: 400, name: "Word 1" }, 110, 214),
      makeText({ text: "Sunset", fontFamily: "Fraunces", fontWeight: 300, fontSize: 60, lineHeight: 1.09, fill: white, width: 400, align: "right", name: "Word 2" }, W - 110 - 400, 642),
      makeText({ text: "& Dance", fontFamily: "Fraunces", fontWeight: 300, fontSize: 60, lineHeight: 1.09, fill: white, width: 400, name: "Word 3" }, 110, 1070),
    ])],
  },
  {
    id: "stack2", name: "Two stacked cards", categories: ["Photo collage"], description: "Two big cards.", size: { w: W, h: H }, kind: "collage",
    build: () => [slide("Two cards", "#ffffff", [grid("fig-stack2", W, H, { cellBg: "#111111" }), handle()])],
  },
  {
    id: "fullbleed-headline", name: "Full-bleed headline", categories: ["Instagram portrait", "Typography"], description: "Edge-to-edge photo with a bold headline and soft shadow.", size: { w: W, h: H }, kind: "single",
    build: () => [slide("Full bleed", "#000000", [makeFrame(W, H, { radius: 0, bg: "#111111", name: "Photo" }, 0, 0), makeText({ text: "Design\nSamwaad 3.0", fontFamily: "Outfit", fontWeight: 800, fontSize: 110, lineHeight: 1.03, width: 900, fill: white, shadow: { color: "#000000", blur: 60, x: 0, y: 4, opacity: 0.25 }, name: "Headline" }, 64, 780), handle()])],
  },
  {
    id: "music-player", name: "Music player overlay", categories: ["Instagram portrait", "Personal"], description: "Photo with a glass music-player panel.", size: { w: W, h: H }, kind: "single",
    build: () => [slide("Playlist", "#ffffff", [card({ bg: "#e5ff65" }), makeText({ text: "MY PLAYLIST\nPART I", fontFamily: "Fraunces", fontWeight: 300, fontSize: 34, letterSpacing: 13.6, lineHeight: 1.5, align: "center", fill: white, width: 900, name: "Title" }, 90, 117), preset("player"), handle()])],
  },
  {
    id: "giant-word", name: "Giant word", categories: ["Typography", "Poster"], description: "Photo with an oversized gradient word.", size: { w: W, h: H }, kind: "single",
    build: () => [slide("Giant word", "#ffffff", [card({ bg: "#2b2b2b" }), makeText({ text: "CREW", fontFamily: "Outfit", fontWeight: 800, fontSize: 330, letterSpacing: -20, lineHeight: 1, align: "right", width: 984, height: 380, autoHeight: false, fill: { type: "gradient", angle: 180, stops: [{ offset: 0, color: "rgba(255,255,255,0.95)" }, { offset: 1, color: "rgba(255,255,255,0)" }] }, name: "Giant word" }, 48, 880), handle()])],
  },
  {
    id: "quote", name: "Centred quote", categories: ["Typography", "Minimal", "Instagram square"], description: "Quiet serif quote on cream.", size: { w: 1080, h: 1080 }, kind: "single",
    build: () => [slide("Quote", "#f5efe6", [makeText({ text: "“Go where it’s quiet and the light is long.”", fontFamily: "Instrument Serif", fontWeight: 400, italic: true, fontSize: 92, lineHeight: 1.1, align: "center", width: 840, fill: { type: "solid", color: "#1c1c1c" }, name: "Quote" }, 120, 330), makeText({ text: "— a note to self", fontFamily: "Outfit", fontWeight: 300, fontSize: 26, letterSpacing: 4, align: "center", width: 840, fill: { type: "solid", color: "#6b6560" }, name: "Attribution" }, 120, 820)], 1080, 1080)],
  },
  {
    id: "magazine-cover", name: "Magazine cover", categories: ["Magazine", "Editorial"], description: "Masthead, big photo and cover lines.", size: { w: W, h: H }, kind: "single",
    build: () => [slide("Cover", "#f3f0ea", [makeFrame(W - 80, 980, { radius: 0, bg: "#d9d4c7", name: "Cover photo" }, 40, 250), makeText({ text: "ATLAS", fontFamily: "Playfair Display", fontWeight: 700, fontSize: 190, letterSpacing: 10, align: "center", width: W - 80, lineHeight: 1, fill: { type: "solid", color: "#111111" }, name: "Masthead" }, 40, 30), makeText({ text: "THE SLOW ISSUE · SUMMER 2025", fontFamily: "Inter", fontWeight: 600, fontSize: 22, letterSpacing: 6, width: W - 80, fill: { type: "solid", color: "#111111" }, name: "Dateline" }, 44, 228), makeText({ text: "Where the\nlight lives", fontFamily: "Instrument Serif", fontWeight: 400, italic: true, fontSize: 110, lineHeight: 0.95, width: 700, fill: white, name: "Cover line" }, 80, 930)])],
  },
  {
    id: "swiss", name: "Swiss editorial", categories: ["Editorial", "Typography", "Magazine"], description: "12-column grid with a big sans heading, image and body copy.", size: { w: W, h: H }, kind: "single",
    build: () => {
      const s = slide("Swiss", "#f3f0ea", [
        makeText({ text: "Form follows\nfeeling", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 132, lineHeight: 0.95, letterSpacing: -3, width: 960, fill: { type: "solid", color: "#111111" }, name: "Heading" }, 60, 60),
        makeFrame(520, 640, { radius: 0, bg: "#d9d4c7", name: "Image" }, 60, 450),
        makeText({ text: "A short paragraph of body copy sits on the grid beside the picture. It is set small, with a generous line height, so the headline can carry the page.", fontFamily: "Inter", fontWeight: 400, fontSize: 28, lineHeight: 1.45, width: 380, fill: { type: "solid", color: "#111111" }, name: "Body" }, 640, 450),
        makeShape("rect", 12, 160, { fill: { type: "solid", color: "#e63b2e" }, name: "Accent" }, 640, 960),
      ]);
      s.grid = { ...defaultLayoutGrid(), visible: true, kind: "columns", columns: 12, gutter: 20, margin: 60 };
      return [s];
    },
  },
  {
    id: "poster", name: "Typographic poster", categories: ["Poster", "Typography"], description: "Black poster, condensed giant type.", size: { w: W, h: H }, kind: "single",
    build: () => [slide("Poster", "#0e0e0e", [makeText({ text: "SUMMER\nSESSIONS", fontFamily: "Bebas Neue", fontWeight: 400, fontSize: 290, lineHeight: 0.86, width: 960, fill: { type: "solid", color: "#e5ff65" }, name: "Title" }, 60, 90), makeText({ text: "LIVE · 21 JUNE · GOA", fontFamily: "Outfit", fontWeight: 500, fontSize: 30, letterSpacing: 8, width: 960, fill: white, name: "Details" }, 64, H - 150)])],
  },
  {
    id: "minimal-caption", name: "Minimal caption", categories: ["Minimal", "Instagram portrait"], description: "One photo, one quiet line.", size: { w: W, h: H }, kind: "single",
    build: () => [slide("Minimal", "#ffffff", [makeFrame(W - 160, H - 340, { radius: 0, bg: "#e7e3da", name: "Photo" }, 80, 80), makeText({ text: "shot on a quiet Sunday", fontFamily: "Outfit", fontWeight: 300, fontSize: 28, letterSpacing: 2.8, width: 700, fill: { type: "solid", color: "#111111" }, name: "Caption" }, 80, H - 200)])],
  },
  {
    id: "story-collage", name: "Storytelling grid", categories: ["Storytelling", "Photo collage", "Magazine"], description: "Magazine grid with room to tell it.", size: { w: W, h: H }, kind: "collage",
    build: () => [slide("Story", "#111111", [grid("magazine", W, H, { cellBg: "#2b2b2b", gutter: 14, margin: 40, radius: 20 })])],
  },
  {
    id: "travel", name: "Travel day", categories: ["Travel", "Instagram portrait"], description: "Photo card with day badge and location.", size: { w: W, h: H }, kind: "single",
    build: () => [slide("Travel", "#ffffff", [card({ bg: "#2f80b7" }), { ...(preset("label-day", W, 220) as never as Element), x: 96, y: 96 }, makeText({ text: "day 4 — Da Nang", fontFamily: "Fraunces", fontWeight: 300, fontSize: 84, lineHeight: 1.05, width: 700, fill: white, name: "Title" }, 100, 1020), location("Location : Da Nang", 1210), handle(1210)])],
  },
  {
    id: "event", name: "Event recap", categories: ["Event", "Photo collage"], description: "Collage with a bold date.", size: { w: W, h: H }, kind: "collage",
    build: () => [slide("Event", "#fff7bd", [grid("fig-quad", W, H, { cellBg: "#c22b4a", margin: 48 }), makeText({ text: "GARBA\nNIGHT", fontFamily: "Anton", fontWeight: 400, fontSize: 200, lineHeight: 0.9, width: 800, fill: white, shadow: { color: "#000000", blur: 30, x: 0, y: 6, opacity: 0.35 }, name: "Title" }, 120, 470)])],
  },
  {
    id: "panorama-2", name: "Panorama · 2 slides", categories: ["Carousel", "Instagram portrait"], description: "One photo runs across two slides; export cuts it at the seam.", size: { w: 2160, h: 1350 }, kind: "carousel",
    build: () => [slide("Panorama", "#ffffff", [makeFrame(2160 - 96, 1254, { radius: 64, bg: "#ce6161", name: "Panorama photo" }, 48, 48), makeText({ text: "vanshita", fontFamily: "Mrs Saint Delafield", fontSize: 84, width: 400, fill: white, name: "Script 1" }, 220, 150), makeText({ text: "attendee", fontFamily: "Mrs Saint Delafield", fontSize: 84, width: 400, fill: white, name: "Script 2" }, 1500, 200), handle()], 2160, 1350)],
  },
  {
    id: "carousel-mixed", name: "Mixed-media carousel · 7 slides", categories: ["Carousel", "Storytelling"], description: "Photo, collage, video, typography, photo + text, video + text, multi-image.", size: { w: W, h: H }, kind: "carousel",
    build: () => {
      const s1 = slide("1 · Edited photo", "#ffffff", [card(), makeText({ text: "A weekend in the hills", fontFamily: "Fraunces", fontWeight: 300, fontSize: 84, lineHeight: 1.05, width: 760, fill: white, name: "Title" }, 100, 170), handle()]);
      const s2 = slide("2 · Collage", "#ffffff", [grid("fig-quad", W, H, { cellBg: "#2b2b2b" })]);
      const s3 = slide("3 · Video", "#000000", [makeFrame(W, H, { radius: 0, bg: "#111111", name: "Video" }, 0, 0)]);
      const s4 = slide("4 · Typography", "#e5ff65", [makeText({ text: "SLOW\nDOWN", fontFamily: "Anton", fontWeight: 400, fontSize: 330, lineHeight: 0.9, width: 960, fill: { type: "solid", color: "#111111" }, name: "Type" }, 60, 280), makeText({ text: "swipe →", fontFamily: "Outfit", fontWeight: 400, fontSize: 30, letterSpacing: 6, align: "right", width: 400, fill: { type: "solid", color: "#111111" }, name: "Swipe" }, 620, H - 150)]);
      const s5 = slide("5 · Photo + text", "#ffffff", [card({ bg: "#2f80b7" }), makeText({ text: "the best view was the one we hiked for", fontFamily: "Instrument Serif", italic: true, fontSize: 88, lineHeight: 1.05, width: 760, fill: white, shadow: { color: "#000000", blur: 40, x: 0, y: 4, opacity: 0.3 }, name: "Quote" }, 110, 840)]);
      const s6 = slide("6 · Video + text", "#000000", [makeFrame(W, H, { radius: 0, bg: "#111111", name: "Video" }, 0, 0), makeText({ text: "golden hour", fontFamily: "Outfit", fontWeight: 600, fontSize: 96, width: 860, fill: white, shadow: { color: "#000000", blur: 40, x: 0, y: 4, opacity: 0.35 }, name: "Overlay" }, 80, 1100)]);
      const s7 = slide("7 · Multi-image", "#111111", [grid("magazine", W, H, { cellBg: "#2b2b2b", gutter: 14, margin: 40, radius: 20 })]);
      return [s1, s2, s3, s4, s5, s6, s7];
    },
  },
  {
    id: "story-9-16", name: "Story · photo + sticker", categories: ["Story", "Personal"], description: "Full-height story with safe-area friendly type.", size: { w: 1080, h: 1920 }, kind: "story",
    build: () => [slide("Story", "#111111", [makeFrame(1080, 1920, { radius: 0, bg: "#222222", name: "Photo" }, 0, 0), makeText({ text: "Saturday\nplans", fontFamily: "Fraunces", fontWeight: 300, fontSize: 150, lineHeight: 0.95, width: 900, fill: white, name: "Title" }, 90, 1300)], 1080, 1920)],
  },
];

/** every ready-made template: the first set above plus the rest from templates-more.ts */
export const TEMPLATES: Template[] = [...BASE_TEMPLATES, ...MORE_TEMPLATES];

/** scale a built slide to another canvas size (stretch, like Resize → Stretch) */
export function fitSlide(s: Slide, w: number, h: number): Slide {
  const out = structuredClone(s);
  if (out.width === w && out.height === h) return out;
  const sx = w / out.width, sy = h / out.height;
  out.elements.forEach((e) => scaleElement(e as never, sx, sy));
  out.width = w;
  out.height = h;
  return out;
}

export { makeGroup };
