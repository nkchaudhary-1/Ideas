import type { Element, GroupEl, Paint, ShapeEl, TextEl } from "./types";
import { baseEl, makeShape, makeText, makeGroup, makeFrame } from "./factory";
import { PALETTES } from "./colors";

/** text colour that reads on the slide background */
export const autoInk = (bg: { type: string; color?: string } | undefined) => {
  const c = bg && bg.type === "solid" && bg.color ? bg.color.replace("#", "") : "ffffff";
  const n = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c.slice(0, 6), 16) || 0;
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.6 ? "#111111" : "#ffffff";
};

/** default ink for something new on `slide`: white over a full-bleed photo/video/collage, otherwise whatever reads on the background */
export const inkFor = (slide: { width: number; height: number; background: { type: string; color?: string }; elements: { type: string; visible: boolean; width: number; height: number }[] }) => {
  const area = slide.width * slide.height;
  const bleed = slide.elements.some((e) => e.visible && (e.type === "image" || e.type === "video" || e.type === "grid") && e.width * e.height >= area * 0.6);
  return bleed || slide.background.type === "image" ? "#ffffff" : autoInk(slide.background);
};

export interface TextPreset { id: string; name: string; sample: string; family: string; weight: number; italic?: boolean; build: (w: number, h: number, ink: string) => TextEl[] }

const solid = (color: string): Paint => ({ type: "solid", color });

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: "editorial-headline", name: "Editorial headline", sample: "Slow mornings", family: "Fraunces", weight: 300,
    build: (w, h, ink) => [makeText({ text: "Slow mornings, long light", fontFamily: "Fraunces", fontWeight: 300, fontSize: 118, lineHeight: 1.0, letterSpacing: -2, width: w - 160, fill: solid(ink), name: "Editorial headline" }, 80, h * 0.12)],
  },
  {
    id: "magazine-title", name: "Magazine title", sample: "ATLAS", family: "Playfair Display", weight: 700,
    build: (w, h, ink) => [makeText({ text: "ATLAS", fontFamily: "Playfair Display", fontWeight: 700, fontSize: 190, align: "center", letterSpacing: 10, lineHeight: 1, width: w - 120, fill: solid(ink), name: "Magazine title" }, 60, 80)],
  },
  {
    id: "minimal-caption", name: "Minimal caption", sample: "Shot on a quiet Sunday", family: "Outfit", weight: 300,
    build: (w, h, ink) => [makeText({ text: "Shot on a quiet Sunday", fontFamily: "Outfit", fontWeight: 300, fontSize: 28, letterSpacing: 2.8, width: 560, fill: solid(ink), name: "Caption" }, 84, h - 140)],
  },
  {
    id: "large-type", name: "Large typography", sample: "MOVE", family: "Anton", weight: 400,
    build: (w, h, ink) => [makeText({ text: "MOVE", fontFamily: "Anton", fontWeight: 400, fontSize: 330, lineHeight: 0.9, align: "center", width: w - 80, fill: solid(ink), name: "Large type" }, 40, h / 2 - 150)],
  },
  {
    id: "poster", name: "Poster typography", sample: "SUMMER\nSESSIONS", family: "Bebas Neue", weight: 400,
    build: (w, h, ink) => [
      makeText({ text: "SUMMER\nSESSIONS", fontFamily: "Bebas Neue", fontWeight: 400, fontSize: 250, lineHeight: 0.88, width: w - 120, fill: solid(ink), name: "Poster title" }, 60, 90),
      makeText({ text: "LIVE · 21 JUNE · GOA", fontFamily: "Outfit", fontWeight: 500, fontSize: 30, letterSpacing: 8, width: w - 120, fill: solid(ink), name: "Poster details" }, 64, h - 150),
    ],
  },
  {
    id: "vertical", name: "Vertical typography", sample: "JOURNAL", family: "Oswald", weight: 500,
    build: (w, h, ink) => { const t = makeText({ text: "JOURNAL / 2025", fontFamily: "Oswald", fontWeight: 500, fontSize: 64, letterSpacing: 14, align: "center", width: h * 0.7, fill: solid(ink), name: "Vertical type" }, w - 150, h * 0.15); t.rotation = 90; t.x = w - 150 - (h * 0.7) / 2 + 40; t.y = h / 2 - 35; return [t]; },
  },
  {
    id: "quote", name: "Centred quote", sample: "“Go where it’s quiet.”", family: "Instrument Serif", weight: 400, italic: true,
    build: (w, h, ink) => [makeText({ text: "“Go where it’s quiet and the light is long.”", fontFamily: "Instrument Serif", fontWeight: 400, italic: true, fontSize: 92, lineHeight: 1.1, align: "center", width: w - 240, fill: solid(ink), name: "Quote" }, 120, h / 2 - 160)],
  },
  {
    id: "overlay", name: "Text overlay", sample: "Golden hour", family: "Outfit", weight: 600,
    build: (w, h) => [makeText({ text: "Golden hour", fontFamily: "Outfit", fontWeight: 600, fontSize: 96, width: w - 160, fill: solid("#ffffff"), shadow: { color: "#000000", blur: 40, x: 0, y: 4, opacity: 0.35 }, name: "Overlay title" }, 80, h - 260)],
  },
  {
    id: "bold-condensed", name: "Bold condensed", sample: "NEW DROP", family: "Barlow Condensed", weight: 700,
    build: (w, h, ink) => [makeText({ text: "NEW DROP", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 230, textTransform: "uppercase", lineHeight: 0.9, width: w - 120, fill: solid(ink), name: "Condensed headline" }, 60, h / 2 - 120)],
  },
  {
    id: "serif-editorial", name: "Serif editorial", sample: "Quiet luxury", family: "Cormorant Garamond", weight: 400, italic: true,
    build: (w, h, ink) => [
      makeText({ text: "Quiet luxury", fontFamily: "Cormorant Garamond", fontWeight: 400, italic: true, fontSize: 150, lineHeight: 0.95, width: w - 160, fill: solid(ink), name: "Serif headline" }, 80, h * 0.5),
      makeText({ text: "A small study in restraint", fontFamily: "Inter", fontWeight: 400, fontSize: 26, letterSpacing: 3, textTransform: "uppercase", width: w - 160, fill: solid(ink), name: "Subtitle" }, 84, h * 0.5 + 180),
    ],
  },
  // ───── straight from the Figma posts ─────
  {
    id: "photo-title", name: "Photo title (soft serif)", sample: "Sunset", family: "Fraunces", weight: 300,
    build: (w, h) => [makeText({ text: "wanna go on a long weekend getaway", fontFamily: "Fraunces", fontWeight: 300, fontSize: 72, lineHeight: 1.09, width: 620, fill: solid("rgba(255,255,255,0.92)"), name: "Photo title" }, 116, 190)],
  },
  {
    id: "handle-tag", name: "Handle tag", sample: "@handle", family: "Outfit", weight: 300,
    build: (w, h) => [makeText({ text: "yourhandle", fontFamily: "Outfit", fontWeight: 300, fontSize: 24, letterSpacing: 2.4, width: 300, fill: solid("rgba(255,255,255,0.7)"), name: "Handle" }, 84, h - 142)],
  },
  {
    id: "location-tag", name: "Location tag", sample: "Location : Goa", family: "Outfit", weight: 300,
    build: (w, h) => [makeText({ text: "Location : Goa", fontFamily: "Outfit", fontWeight: 300, fontSize: 24, letterSpacing: 2.4, align: "right", width: 320, fill: solid("rgba(255,255,255,0.7)"), name: "Location" }, w - 84 - 320, h - 142)],
  },
  {
    id: "script-name", name: "Script name tag", sample: "Anupama", family: "Mrs Saint Delafield", weight: 400,
    build: (w, h) => [makeText({ text: "hi it's me", fontFamily: "Mrs Saint Delafield", fontWeight: 400, fontSize: 84, width: 520, fill: solid("#ffffff"), name: "Script tag" }, 120, 140)],
  },
  {
    id: "spaced-title", name: "Spaced uppercase title", sample: "MY PLAYLIST", family: "Fraunces", weight: 300,
    build: (w, h) => [makeText({ text: "MY SRK PLAYLIST\nPART I", fontFamily: "Fraunces", fontWeight: 300, fontSize: 34, letterSpacing: 13.6, lineHeight: 1.5, align: "center", width: w - 160, fill: solid("#ffffff"), name: "Spaced title" }, 80, 110)],
  },
  {
    id: "giant-word", name: "Giant gradient word", sample: "CREW", family: "Outfit", weight: 800,
    build: (w, h) => [makeText({ text: "CREW", fontFamily: "Outfit", fontWeight: 800, fontSize: 560, letterSpacing: -40, lineHeight: 1, align: "right", width: w, height: 560, autoHeight: false, fill: { type: "gradient", angle: 180, stops: [{ offset: 0, color: "rgba(255,255,255,0.95)" }, { offset: 1, color: "rgba(255,255,255,0)" }] }, name: "Giant word" }, 0, h - 640)],
  },
];

// ───────────────────────── shapes & graphic elements ─────────────────────────

export interface ElementPreset { id: string; name: string; group: "Basic" | "Decor" | "Labels" | "Icons" | "UI"; svg?: string; build: (w: number, h: number, ink: string) => Element }

const P = {
  heart: "M50 88 C20 66 6 48 6 30 C6 16 17 8 28 8 C38 8 46 14 50 22 C54 14 62 8 72 8 C83 8 94 16 94 30 C94 48 80 66 50 88 Z",
  sparkle: "M50 4 C53 30 70 47 96 50 C70 53 53 70 50 96 C47 70 30 53 4 50 C30 47 47 30 50 4 Z",
  cloud: "M26 76 C8 76 2 58 16 50 C14 32 36 22 48 34 C56 18 82 22 84 42 C100 44 102 70 84 76 Z",
  bubble: "M8 12 H92 V68 H46 L26 90 V68 H8 Z",
  blob: "M52 6 C76 4 96 22 94 48 C92 74 74 96 48 94 C22 92 4 72 8 46 C10 24 30 8 52 6 Z",
  ticket: "M6 20 H94 V42 A8 8 0 0 0 94 58 V80 H6 V58 A8 8 0 0 0 6 42 Z",
  arch: "M10 96 V50 A40 40 0 0 1 90 50 V96 Z",
  wave: "M0 50 Q12.5 20 25 50 T50 50 T75 50 T100 50",
  play: "M28 16 L86 50 L28 84 Z",
  pin: "M50 96 C20 60 16 46 16 36 A34 34 0 0 1 84 36 C84 46 80 60 50 96 Z",
  plus: "M50 14 V86 M14 50 H86",
  check: "M18 52 L40 74 L82 26",
  swirl: "M10 70 C10 30 50 20 60 45 C68 66 38 74 36 54 C35 40 55 38 62 50",
};

const pathShape = (key: keyof typeof P, name: string, over: Partial<ShapeEl> = {}) => (w: number, h: number): ShapeEl => {
  const stroked = key === "wave" || key === "plus" || key === "check" || key === "swirl";
  return makeShape("path", w, h, {
    name, path: P[key], pathBox: { w: 100, h: 100 },
    fill: stroked ? null : { type: "solid", color: "#ffffff" },
    stroke: stroked ? { color: "#ffffff", width: 6 } : null,
    ...over,
  }, 140, 140);
};

function pill(text: string, w: number, h: number, bg: string, color: string, name: string): GroupEl {
  const bw = Math.max(200, text.length * 26 + 70);
  const rect = makeShape("rect", bw, 64, { fill: { type: "solid", color: bg }, radius: 32, name: "Pill" }, 0, 0);
  const t = makeText({ text, fontFamily: "Outfit", fontWeight: 500, fontSize: 28, letterSpacing: 2, align: "center", fill: { type: "solid", color }, width: bw, name: "Label", autoHeight: false, vAlign: "middle" }, 0, 0);
  t.height = 64;
  const g = makeGroup([rect, t], (w - bw) / 2, h / 2 - 32, bw, 64);
  g.name = name;
  return g;
}

function musicPlayer(w: number, h: number): GroupEl {
  const pw = 835, ph = 425;
  const kids: Element[] = [];
  kids.push(makeShape("rect", pw, ph, { name: "Glass panel", radius: 50, fill: { type: "solid", color: "rgba(0,0,0,0.3)" }, stroke: { color: "#ffffff", width: 2 } }, 0, 0));
  kids.push(makeFrame(172, 172, { name: "Album art", radius: 42, bg: "#ffffff" }, 38, 38));
  kids.push(makeText({ text: "Hawayein", fontFamily: "Outfit", fontWeight: 600, fontSize: 44, width: 520, fill: { type: "solid", color: "#ffffff" }, name: "Track" }, 242, 70));
  kids.push(makeText({ text: "Jab Harry Met Sejal", fontFamily: "Outfit", fontWeight: 300, fontSize: 34, width: 520, fill: { type: "solid", color: "#ffffff" }, name: "Album" }, 242, 135));
  kids.push(makeShape("rect", 592, 16, { name: "Track bar", radius: 8, fill: { type: "solid", color: "rgba(255,255,255,0.3)" } }, 116, 245));
  kids.push(makeShape("rect", 289, 16, { name: "Progress", radius: 8, fill: { type: "solid", color: "#ffffff" } }, 116, 245));
  kids.push(makeText({ text: "00:00", fontFamily: "Outfit", fontWeight: 400, fontSize: 24, width: 90, fill: { type: "solid", color: "rgba(255,255,255,0.8)" }, name: "Elapsed" }, 20, 238));
  kids.push(makeText({ text: "04:28", fontFamily: "Outfit", fontWeight: 400, fontSize: 24, width: 90, align: "right", fill: { type: "solid", color: "rgba(255,255,255,0.8)" }, name: "Length" }, pw - 110, 238));
  kids.push(makeShape("triangle", 54, 60, { name: "Play", fill: { type: "solid", color: "#ffffff" } }, pw / 2 - 20, 310));
  kids[kids.length - 1].rotation = 90;
  kids.push(makeShape("triangle", 40, 44, { name: "Previous", fill: { type: "solid", color: "#ffffff" } }, pw / 2 - 140, 322));
  kids[kids.length - 1].rotation = -90;
  kids.push(makeShape("triangle", 40, 44, { name: "Next", fill: { type: "solid", color: "#ffffff" } }, pw / 2 + 100, 322));
  kids[kids.length - 1].rotation = 90;
  const g = makeGroup(kids, (w - pw) / 2, 224, pw, ph);
  g.name = "Music player";
  return g;
}

export const ELEMENT_PRESETS: ElementPreset[] = [
  { id: "rect", name: "Rectangle", group: "Basic", build: () => makeShape("rect", 360, 240, { radius: 0 }) },
  { id: "rounded", name: "Rounded", group: "Basic", build: () => makeShape("rect", 360, 240, { radius: 48, name: "Rounded rectangle" }) },
  { id: "square", name: "Square", group: "Basic", build: () => makeShape("rect", 280, 280, { name: "Square" }) },
  { id: "circle", name: "Circle", group: "Basic", build: () => makeShape("ellipse", 280, 280, { name: "Circle" }) },
  { id: "ellipse", name: "Ellipse", group: "Basic", build: () => makeShape("ellipse", 400, 240) },
  { id: "line", name: "Line", group: "Basic", build: () => makeShape("line", 420, 0, { name: "Line" }) },
  { id: "arrow", name: "Arrow", group: "Basic", build: () => makeShape("arrow", 400, 0, { name: "Arrow" }) },
  { id: "triangle", name: "Triangle", group: "Basic", build: () => makeShape("triangle", 300, 260) },
  { id: "polygon", name: "Polygon", group: "Basic", build: () => makeShape("polygon", 300, 300, { sides: 6 }) },
  { id: "star", name: "Star", group: "Basic", build: () => makeShape("star", 300, 300, { sides: 5 }) },
  { id: "badge", name: "Badge", group: "Decor", build: () => makeShape("star", 300, 300, { sides: 14, innerRatio: 0.86, name: "Badge" }) },
  { id: "heart", name: "Heart", group: "Decor", build: pathShape("heart", "Heart", { fill: { type: "solid", color: "#ff4d6d" } }) as never },
  { id: "sparkle", name: "Sparkle", group: "Decor", build: pathShape("sparkle", "Sparkle") as never },
  { id: "cloud", name: "Cloud", group: "Decor", build: pathShape("cloud", "Cloud") as never },
  { id: "blob", name: "Blob", group: "Decor", build: pathShape("blob", "Blob", { fill: { type: "solid", color: "#ce6161" } }) as never },
  { id: "bubble", name: "Speech bubble", group: "Decor", build: pathShape("bubble", "Speech bubble") as never },
  { id: "ticket", name: "Ticket", group: "Decor", build: pathShape("ticket", "Ticket", { fill: { type: "solid", color: "#e5ff65" } }) as never },
  { id: "arch", name: "Arch", group: "Decor", build: pathShape("arch", "Arch") as never },
  { id: "wave", name: "Wave line", group: "Decor", build: pathShape("wave", "Wave line", { height: 80 }) as never },
  { id: "swirl", name: "Swirl", group: "Decor", build: pathShape("swirl", "Swirl") as never },
  { id: "divider", name: "Thin divider", group: "Decor", build: (w) => makeShape("rect", w - 160, 2, { name: "Divider", fill: { type: "solid", color: "#ffffff" } }, 80, 200) },
  { id: "divider2", name: "Double rule", group: "Decor", build: (w, h, ink) => { const a = makeShape("rect", w - 160, 2, { name: "Rule", fill: { type: "solid", color: ink } }, 0, 0); const b = makeShape("rect", w - 160, 6, { name: "Rule", fill: { type: "solid", color: ink } }, 0, 10); const g = makeGroup([a, b], 80, 200, w - 160, 16); g.name = "Double rule"; return g; } },
  { id: "photo-border", name: "Photo border", group: "Decor", build: (w, h) => makeShape("rect", w - 96, h - 96, { name: "Border frame", fill: null, stroke: { color: "#ffffff", width: 6 }, radius: 48 }, 48, 48) },
  { id: "label-location", name: "Location label", group: "Labels", build: (w, h) => pill("Location : Goa", w, h, "#ffffff", "#111111", "Location label") },
  { id: "label-day", name: "Day badge", group: "Labels", build: (w, h) => pill("DAY 01", w, h, "#e5ff65", "#111111", "Day badge") },
  { id: "label-swipe", name: "Swipe →", group: "Labels", build: (w, h) => pill("Swipe →", w, h, "rgba(0,0,0,0.55)", "#ffffff", "Swipe label") },
  { id: "label-new", name: "New", group: "Labels", build: (w, h) => pill("NEW", w, h, "#ce6161", "#ffffff", "New badge") },
  { id: "icon-play", name: "Play", group: "Icons", build: pathShape("play", "Play icon") as never },
  { id: "icon-pin", name: "Pin", group: "Icons", build: pathShape("pin", "Pin icon") as never },
  { id: "icon-plus", name: "Plus", group: "Icons", build: pathShape("plus", "Plus icon") as never },
  { id: "icon-check", name: "Check", group: "Icons", build: pathShape("check", "Check icon") as never },
  { id: "glass", name: "Glass panel", group: "UI", build: () => makeShape("rect", 640, 280, { name: "Glass panel", radius: 50, fill: { type: "solid", color: "rgba(0,0,0,0.3)" }, stroke: { color: "#ffffff", width: 2 }, glass: 1 }, 220, 500) },
  { id: "player", name: "Music player", group: "UI", build: (w, h) => musicPlayer(w, h) },
];

// pathShape returns (w,h) builders, but presets get (w,h,ink): normalise
for (const p of ELEMENT_PRESETS) {
  const b = p.build as unknown as (w: number, h: number, ink: string) => Element;
  p.build = (w, h, ink) => { const e = b(w, h, ink); return e; };
}

// ───────────────────────── backgrounds ─────────────────────────

export const GRADIENT_PRESETS: { name: string; angle: number; stops: [string, string] }[] = [
  { name: "Peach", angle: 160, stops: ["#ffe0d1", "#ce6161"] },
  { name: "Dusk", angle: 180, stops: ["#2b1b3d", "#ef5b5b"] },
  { name: "Sea glass", angle: 150, stops: ["#d9f2ee", "#2f80b7"] },
  { name: "Lime", angle: 135, stops: ["#e5ff65", "#2c7a4b"] },
  { name: "Night", angle: 180, stops: ["#0b1220", "#2d3b5b"] },
  { name: "Cream", angle: 180, stops: ["#fbf7ef", "#e9e0cf"] },
  { name: "Berry", angle: 140, stops: ["#6a0f2f", "#c22b4a"] },
  { name: "Mist", angle: 180, stops: ["#ffffff", "#cfd8e3"] },
];

export const SOLID_BACKGROUNDS = [...new Set(PALETTES.flatMap((p) => p.colors))];

export { baseEl };
