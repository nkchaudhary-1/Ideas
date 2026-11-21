// More ready-made templates: stories, quotes, fashion, food, sales, events, travel, collages, carousels and a panorama.
// Photos are tinted placeholder frames (tap one to add yours); type, colour and layout are all editable.
import type { Background, Element, MediaEl, Paint, ShapeEl, Slide, TextEl } from "./types";
import type { Template, TemplateCategory } from "./templates";
import { makeFrame, makeGrid, makeShape, makeSlide, makeText, solidBg } from "./factory";
import { presetById } from "./grid-engine";

const W = 1080, H = 1350, SH = 1920;

// ── tiny helpers ───────────────────────────────────────────────────────────────────────────────
const ink = (color: string): Paint => ({ type: "solid", color });
const grad = (angle: number, ...colors: string[]): Paint => ({ type: "gradient", angle, stops: colors.map((color, i) => ({ offset: colors.length === 1 ? 0 : i / (colors.length - 1), color })) });
const T = (text: string, x: number, y: number, w: number, o: Partial<TextEl> = {}) => makeText({ text, width: w, ...o, fill: o.fill ?? ink("#111111") }, x, y);
const ph = (x: number, y: number, w: number, h: number, bg: string, o: Partial<MediaEl> = {}) => makeFrame(w, h, { radius: 32, bg, name: "Photo", ...o }, x, y);
const R = (x: number, y: number, w: number, h: number, color: string | Paint, o: Partial<ShapeEl> = {}) => makeShape("rect", w, h, { fill: typeof color === "string" ? ink(color) : color, name: "Block", ...o }, x, y);
const O = (x: number, y: number, w: number, h: number, color: string | Paint, o: Partial<ShapeEl> = {}) => makeShape("ellipse", w, h, { fill: typeof color === "string" ? ink(color) : color, name: "Circle", ...o }, x, y);
const sl = (name: string, bg: string | Background, els: Element[], w = W, h = H): Slide => {
  const s = makeSlide(w, h, name, typeof bg === "string" ? solidBg(bg) : bg);
  s.elements = els;
  return s;
};
const grid = (id: string, w: number, h: number, over = {}) => makeGrid(presetById(id), w, h, over);
const lift = { color: "#000000", blur: 48, x: 0, y: 24, opacity: 0.22 };
const pill = (text: string, x: number, y: number, w: number, bg: string, fg: string, o: Partial<TextEl> = {}) =>
  T(text, x, y, w, { fontFamily: "Outfit", fontWeight: 600, fontSize: 30, align: "center", fill: ink(fg), background: { color: bg, radius: 999 }, padding: 20, name: "Button", ...o });
const mono = (text: string, x: number, y: number, w: number, color: string, o: Partial<TextEl> = {}) =>
  T(text, x, y, w, { fontFamily: "Space Mono", fontWeight: 400, fontSize: 26, letterSpacing: 2, fill: ink(color), ...o });

const tpl = (id: string, name: string, categories: TemplateCategory[], description: string, w: number, h: number, kind: Template["kind"], build: () => Slide[]): Template =>
  ({ id, name, categories, description, size: { w, h }, kind, build });

export const MORE_TEMPLATES: Template[] = [
  // ───────────────────────────── Instagram portrait ─────────────────────────────
  tpl("polaroid", "Polaroid", ["Instagram portrait", "Minimal", "Personal"], "A white instant-photo frame on warm paper, with a handwritten caption.", W, H, "single", () => [
    sl("Polaroid", "#efe8dc", [
      R(120, 130, 840, 1030, "#ffffff", { radius: 12, shadow: lift, name: "Polaroid" }),
      ph(160, 170, 760, 760, "#c9b79c", { radius: 8 }),
      T("summer ’26", 160, 975, 760, { fontFamily: "Caveat", fontWeight: 700, fontSize: 110, align: "center", fill: ink("#2b2b2b"), name: "Caption" }),
    ]),
  ]),
  tpl("arch-window", "Arch window", ["Instagram portrait", "Minimal", "Fashion"], "An arched photo on blush, with a soft serif title.", W, H, "single", () => [
    sl("Arch", "#f3e4d9", [
      ph(230, 120, 620, 840, "#d99c85", { shape: "arch" }),
      T("golden hour", 90, 1010, 900, { fontFamily: "Fraunces", fontWeight: 300, italic: true, fontSize: 120, align: "center", fill: ink("#4a2c22"), name: "Title" }),
      T("A SLOW EVENING IN THE HILLS", 90, 1190, 900, { fontFamily: "Outfit", fontWeight: 300, fontSize: 26, letterSpacing: 7, align: "center", fill: ink("#8b5e4c"), name: "Subtitle" }),
    ]),
  ]),
  tpl("circle-intro", "Round portrait", ["Instagram portrait", "Personal"], "A circular portrait over a soft gradient: name, handle, one line about you.", W, H, "single", () => [
    sl("Intro", { type: "gradient", angle: 160, stops: [{ offset: 0, color: "#ffd9cc" }, { offset: 1, color: "#f5a8bd" }] }, [
      ph(190, 150, 700, 700, "#c98a78", { shape: "circle" }),
      T("Your name", 90, 920, 900, { fontFamily: "Playfair Display", fontWeight: 700, fontSize: 104, align: "center", fill: ink("#3b1f2b"), name: "Name" }),
      T("@yourname", 90, 1060, 900, { fontFamily: "Outfit", fontWeight: 500, fontSize: 38, letterSpacing: 2, align: "center", fill: ink("#7a3d56"), name: "Handle" }),
      T("photographer · storyteller · tea person", 90, 1130, 900, { fontFamily: "Outfit", fontWeight: 300, fontSize: 32, align: "center", fill: ink("#7a3d56"), name: "Bio" }),
    ]),
  ]),
  tpl("split-statement", "Split statement", ["Instagram portrait", "Typography", "Minimal"], "Half photo, half bold statement.", W, H, "single", () => [
    sl("Split", "#f2e8cf", [
      ph(0, 0, 540, H, "#3b5b52", { radius: 0 }),
      T("LESS\nBUT\nBETTER", 590, 190, 450, { fontFamily: "Anton", fontSize: 150, lineHeight: 0.98, fill: ink("#1f3a33"), name: "Statement" }),
      T("Pick fewer things and look at them for longer.", 590, 780, 410, { fontFamily: "DM Sans", fontWeight: 400, fontSize: 34, lineHeight: 1.4, fill: ink("#1f3a33"), name: "Body" }),
      mono("N° 07", 590, 1230, 300, "#1f3a33", { name: "Issue" }),
    ]),
  ]),
  tpl("caption-bar", "Caption bar", ["Instagram portrait", "Travel", "Minimal"], "Full-width photo with a clean white caption bar.", W, H, "single", () => [
    sl("Caption bar", "#ffffff", [
      ph(0, 0, W, 1120, "#3a4a63", { radius: 0 }),
      T("Weekend in Lisbon", 60, 1165, 760, { fontFamily: "Outfit", fontWeight: 600, fontSize: 64, name: "Title" }),
      T("Alfama · Belém · LX Factory", 60, 1255, 760, { fontFamily: "Outfit", fontWeight: 300, fontSize: 32, fill: ink("#6b6b6b"), name: "Places" }),
      mono("01 / 06", 800, 1190, 220, "#111111", { align: "right", name: "Count" }),
    ]),
  ]),
  tpl("offset-duo", "Offset duo", ["Instagram portrait", "Photo collage", "Storytelling"], "Two overlapping photos and a quiet title.", W, H, "single", () => [
    sl("Duo", "#e8e4dc", [
      ph(70, 100, 560, 780, "#b5835a", { radius: 40 }),
      ph(450, 540, 560, 700, "#5d7b6f", { radius: 40, stroke: { color: "#e8e4dc", width: 16 } }),
      T("Two\nof us", 70, 930, 340, { fontFamily: "Fraunces", fontWeight: 300, fontSize: 120, lineHeight: 0.98, name: "Title" }),
    ]),
  ]),
  tpl("big-date", "Dear diary", ["Instagram portrait", "Typography", "Personal"], "A photo above an oversized date and a diary line.", W, H, "single", () => [
    sl("Diary", "#101010", [
      ph(60, 60, 960, 800, "#8c6a4f", { radius: 48 }),
      T("14.06", 50, 880, 980, { fontFamily: "Bebas Neue", fontSize: 380, lineHeight: 0.9, fill: ink("#ffffff"), name: "Date" }),
      T("dear diary, today was perfect", 70, 1235, 940, { fontFamily: "Instrument Serif", italic: true, fontSize: 60, fill: ink("#f6d96b"), name: "Line" }),
    ]),
  ]),
  tpl("magazine-cover-2", "Cover story", ["Instagram portrait", "Magazine", "Fashion"], "A tall cover with a Didone masthead and cover lines.", W, H, "single", () => [
    sl("Cover", "#111111", [
      ph(0, 0, W, H, "#7d6a5c", { radius: 0 }),
      R(0, 0, W, 560, grad(180, "rgba(0,0,0,0.55)", "rgba(0,0,0,0)"), { name: "Shade" }),
      T("MODE", 40, 50, 1000, { fontFamily: "Bodoni Moda", fontWeight: 700, fontSize: 300, align: "center", letterSpacing: -4, lineHeight: 1, fill: ink("#ffffff"), name: "Masthead" }),
      T("The spring issue\nColour, calm and linen", 60, 1090, 560, { fontFamily: "Outfit", fontWeight: 500, fontSize: 40, lineHeight: 1.25, fill: ink("#ffffff"), name: "Cover lines" }),
      T("No. 12 · APRIL", 640, 1250, 380, { fontFamily: "Outfit", fontWeight: 400, fontSize: 24, letterSpacing: 5, align: "right", fill: ink("#ffffff"), name: "Issue" }),
    ]),
  ]),
  tpl("lookbook", "Lookbook", ["Instagram portrait", "Fashion", "Editorial"], "Three tall looks side by side with numbered captions.", W, H, "single", () => [
    sl("Lookbook", "#f1eee8", [
      T("Lookbook", 60, 50, 960, { fontFamily: "Bodoni Moda", fontWeight: 600, fontSize: 170, letterSpacing: -3, lineHeight: 1, name: "Title" }),
      ph(60, 330, 300, 780, "#cdbfae", { radius: 0 }), ph(390, 330, 300, 780, "#a99b8a", { radius: 0 }), ph(720, 330, 300, 780, "#8f8272", { radius: 0 }),
      mono("01 — Linen set", 60, 1140, 300, "#111111", { fontSize: 22 }), mono("02 — Wool coat", 390, 1140, 300, "#111111", { fontSize: 22 }), mono("03 — Silk slip", 720, 1140, 300, "#111111", { fontSize: 22 }),
      mono("SS / 26", 60, 1250, 400, "#111111", { name: "Season" }),
    ]),
  ]),
  tpl("ootd", "Outfit of the day", ["Instagram portrait", "Fashion"], "A big photo with the outfit list beside it.", W, H, "single", () => [
    sl("OOTD", "#ffffff", [
      ph(60, 60, 600, 1100, "#c7b8a3", { radius: 40 }),
      T("OOTD", 700, 60, 320, { fontFamily: "Anton", fontSize: 170, lineHeight: 1, name: "Title" }),
      R(700, 290, 320, 4, "#111111", { name: "Rule" }),
      T("Jacket\nCropped wool", 700, 330, 320, { fontFamily: "DM Sans", fontWeight: 500, fontSize: 34, lineHeight: 1.3, name: "Item 1" }),
      T("Tee\nBoxy cotton", 700, 520, 320, { fontFamily: "DM Sans", fontWeight: 500, fontSize: 34, lineHeight: 1.3, name: "Item 2" }),
      T("Denim\nStraight leg", 700, 710, 320, { fontFamily: "DM Sans", fontWeight: 500, fontSize: 34, lineHeight: 1.3, name: "Item 3" }),
      T("Shoes\nWhite trainers", 700, 900, 320, { fontFamily: "DM Sans", fontWeight: 500, fontSize: 34, lineHeight: 1.3, name: "Item 4" }),
      mono("@yourname", 60, 1230, 600, "#111111", { name: "Handle" }),
    ]),
  ]),
  tpl("recipe-card", "Recipe card", ["Instagram portrait", "Food"], "Photo, title, ingredients and method on cream.", W, H, "single", () => [
    sl("Recipe", "#fbf3e4", [
      ph(60, 60, 960, 620, "#d9a35f", { radius: 48 }),
      T("Lemon ricotta pancakes", 60, 720, 960, { fontFamily: "DM Serif Display", fontSize: 84, lineHeight: 1.05, fill: ink("#3b2a1d"), name: "Title" }),
      mono("SERVES 4 · 25 MIN", 60, 920, 600, "#a1612a", { name: "Meta" }),
      R(60, 985, 960, 3, "#3b2a1d", { name: "Rule" }),
      T("Ingredients", 60, 1020, 440, { fontFamily: "Outfit", fontWeight: 700, fontSize: 32, fill: ink("#3b2a1d"), name: "Ingredients title" }),
      T("200 g ricotta\n2 eggs\n1 lemon, zested\n150 g flour", 60, 1075, 440, { fontFamily: "Outfit", fontWeight: 400, fontSize: 30, lineHeight: 1.4, fill: ink("#3b2a1d"), name: "Ingredients" }),
      T("Method", 560, 1020, 460, { fontFamily: "Outfit", fontWeight: 700, fontSize: 32, fill: ink("#3b2a1d"), name: "Method title" }),
      T("Whisk, fold, rest 10 min.\nCook on medium heat until golden.", 560, 1075, 460, { fontFamily: "Outfit", fontWeight: 400, fontSize: 30, lineHeight: 1.4, fill: ink("#3b2a1d"), name: "Method" }),
    ]),
  ]),
  tpl("brunch-menu", "Brunch menu", ["Instagram portrait", "Food", "Typography"], "A weekend menu: four dishes with prices, and a round photo.", W, H, "single", () => {
    const item = (dish: string, detail: string, price: string, y: number): Element[] => [
      T(dish, 80, y, 700, { fontFamily: "Outfit", fontWeight: 600, fontSize: 46, fill: ink("#2b2118"), name: dish }),
      T(price, 800, y, 200, { fontFamily: "Outfit", fontWeight: 600, fontSize: 46, align: "right", fill: ink("#a1612a"), name: `${dish} price` }),
      T(detail, 80, y + 64, 760, { fontFamily: "DM Sans", fontWeight: 400, fontSize: 30, fill: ink("#6b5642"), name: `${dish} detail` }),
      R(80, y + 128, 920, 2, "#d8c8b0", { name: "Rule" }),
    ];
    return [sl("Menu", "#f6efe3", [
      ph(730, 70, 270, 270, "#d9a35f", { shape: "circle" }),
      T("Brunch", 80, 60, 640, { fontFamily: "Fraunces", fontWeight: 300, italic: true, fontSize: 190, lineHeight: 1, fill: ink("#2b2118"), name: "Title" }),
      mono("SAT & SUN · 10 AM TO 2 PM", 80, 300, 640, "#a1612a", { name: "Hours" }),
      ...item("Lemon ricotta pancakes", "Whipped ricotta, blueberries, maple", "₹ 395", 470),
      ...item("Shakshuka", "Baked eggs, tomato, feta, sourdough", "₹ 425", 640),
      ...item("Avocado toast", "Poached egg, chilli oil, microgreens", "₹ 365", 810),
      ...item("Cold brew", "Slow-steeped, served over ice", "₹ 220", 980),
      mono("@yourcafe", 80, 1230, 500, "#2b2118", { name: "Handle" }),
    ])];
  }),
  tpl("flash-sale", "Flash sale", ["Instagram portrait", "Sale", "Poster"], "Loud type, one offer, one button.", W, H, "single", () => [
    sl("Flash sale", "#111111", [
      T("FLASH\nSALE", 50, 110, 980, { fontFamily: "Anton", fontSize: 400, lineHeight: 0.86, fill: ink("#ffd23f"), name: "Headline" }),
      T("UP TO 50% OFF", 60, 860, 960, { fontFamily: "Outfit", fontWeight: 800, fontSize: 104, fill: ink("#ffffff"), name: "Offer" }),
      T("Friday to Sunday · everything in store", 60, 1000, 960, { fontFamily: "Outfit", fontWeight: 300, fontSize: 40, fill: ink("#ffffff"), name: "Detail" }),
      pill("Shop now  →", 60, 1130, 420, "#ffd23f", "#111111", { fontSize: 42 }),
    ]),
  ]),
  tpl("product-showcase", "Product showcase", ["Instagram portrait", "Sale", "Minimal"], "A product on a soft tile with name, price and a button.", W, H, "single", () => [
    sl("Product", "#e9e4f5", [
      ph(120, 120, 840, 840, "#c9bde8", { shape: "squircle" }),
      T("The everyday tote", 90, 1010, 900, { fontFamily: "Outfit", fontWeight: 600, fontSize: 76, name: "Product" }),
      T("Vegetable-tanned leather, fits a 14-inch laptop.", 90, 1110, 900, { fontFamily: "Outfit", fontWeight: 300, fontSize: 34, fill: ink("#5b5470"), name: "Detail" }),
      pill("₹ 3,499", 90, 1200, 260, "#111111", "#ffffff"),
      pill("Shop now", 380, 1200, 260, "#ffffff", "#111111"),
    ]),
  ]),
  tpl("giveaway", "Giveaway", ["Instagram portrait", "Sale", "Event"], "Prize photo and three steps to enter.", W, H, "single", () => [
    sl("Giveaway", { type: "gradient", angle: 150, stops: [{ offset: 0, color: "#7b3fe4" }, { offset: 1, color: "#e8437a" }] }, [
      T("GIVEAWAY", 60, 80, 960, { fontFamily: "Archivo Black", fontSize: 148, fill: ink("#ffffff"), name: "Title" }),
      ph(60, 290, 960, 440, "#f6d27a", { radius: 48 }),
      O(60, 790, 90, 90, "#ffffff", { name: "Step 1" }), T("1", 60, 806, 90, { fontFamily: "Outfit", fontWeight: 700, fontSize: 54, align: "center", name: "1" }),
      T("Follow @yourname", 180, 806, 840, { fontFamily: "Outfit", fontWeight: 500, fontSize: 52, fill: ink("#ffffff"), name: "Step 1 text" }),
      O(60, 930, 90, 90, "#ffffff", { name: "Step 2" }), T("2", 60, 946, 90, { fontFamily: "Outfit", fontWeight: 700, fontSize: 54, align: "center", name: "2" }),
      T("Like this post", 180, 946, 840, { fontFamily: "Outfit", fontWeight: 500, fontSize: 52, fill: ink("#ffffff"), name: "Step 2 text" }),
      O(60, 1070, 90, 90, "#ffffff", { name: "Step 3" }), T("3", 60, 1086, 90, { fontFamily: "Outfit", fontWeight: 700, fontSize: 54, align: "center", name: "3" }),
      T("Tag two friends", 180, 1086, 840, { fontFamily: "Outfit", fontWeight: 500, fontSize: 52, fill: ink("#ffffff"), name: "Step 3 text" }),
      mono("ENDS SUNDAY · 9 PM", 60, 1250, 960, "#ffffff", { name: "Deadline" }),
    ]),
  ]),
  tpl("party-invite", "Party invite", ["Instagram portrait", "Event"], "Arched photo, script headline and the details.", W, H, "single", () => [
    sl("Invite", "#1b1b3a", [
      ph(290, 90, 500, 620, "#ad8bd0", { shape: "arch" }),
      T("you are invited", 60, 745, 960, { fontFamily: "Mrs Saint Delafield", fontSize: 170, align: "center", fill: ink("#ffd6f0"), name: "Headline" }),
      mono("SATURDAY · 18 JULY · 7 PM", 60, 1030, 960, "#ffffff", { align: "center", fontSize: 34, letterSpacing: 4, name: "When" }),
      T("Rooftop at 21, Bandra", 60, 1100, 960, { fontFamily: "Outfit", fontWeight: 300, fontSize: 44, align: "center", fill: ink("#ffffff"), name: "Where" }),
      T("RSVP @yourname", 60, 1230, 960, { fontFamily: "Outfit", fontWeight: 500, fontSize: 28, letterSpacing: 6, align: "center", fill: ink("#ffd6f0"), name: "RSVP" }),
    ]),
  ]),
  tpl("save-the-date", "Save the date", ["Instagram portrait", "Event"], "A soft wedding announcement in script and serif.", W, H, "single", () => [
    sl("Save the date", "#f7efe6", [
      T("save the date", 60, 150, 960, { fontFamily: "Great Vibes", fontSize: 150, align: "center", lineHeight: 1, fill: ink("#8a5a44"), name: "Headline" }),
      ph(190, 430, 700, 520, "#d8c3ae", { shape: "pill" }),
      T("Sam & Jordan", 60, 1000, 960, { fontFamily: "Cormorant Garamond", fontWeight: 600, fontSize: 112, align: "center", fill: ink("#5a3a2b"), name: "Names" }),
      mono("12 DECEMBER 2026 · UDAIPUR", 60, 1160, 960, "#8a5a44", { align: "center", fontSize: 30, letterSpacing: 5, name: "Date" }),
    ]),
  ]),
  tpl("postcard", "Postcard", ["Instagram portrait", "Travel"], "Greetings-from postcard on kraft paper, with a stamp.", W, H, "single", () => [
    sl("Postcard", "#e4d5b8", [
      R(70, 150, 940, 1050, "#fffaf0", { radius: 14, shadow: lift, name: "Card" }),
      ph(110, 190, 860, 600, "#d1704a", { radius: 8 }),
      R(800, 215, 150, 190, "#d65a3a", { radius: 6, stroke: { color: "#fffaf0", width: 8 }, name: "Stamp" }),
      T("Greetings from Jaipur", 110, 840, 860, { fontFamily: "Pacifico", fontSize: 82, lineHeight: 1.1, fill: ink("#c0412c"), name: "Greeting" }),
      T("Pink walls, chai at every corner, and the best light of the whole trip.", 110, 1000, 860, { fontFamily: "Caveat", fontWeight: 400, fontSize: 58, lineHeight: 1.1, fill: ink("#4a3b2a"), name: "Note" }),
    ]),
  ]),
  tpl("quote-photo", "Quote on photo", ["Instagram portrait", "Quote", "Typography"], "A quote over a darkened photo.", W, H, "single", () => [
    sl("Quote", "#111111", [
      ph(0, 0, W, H, "#4a5a52", { radius: 0 }),
      R(0, 0, W, H, grad(180, "rgba(0,0,0,0.15)", "rgba(0,0,0,0.75)"), { name: "Shade" }),
      T("“Stay where the light is soft and the days are slow.”", 80, 760, 920, { fontFamily: "Instrument Serif", italic: true, fontSize: 104, lineHeight: 1.05, fill: ink("#ffffff"), name: "Quote" }),
      mono("— FIELD NOTES", 80, 1230, 600, "#f6d96b", { name: "Credit" }),
    ]),
  ]),
  tpl("six-grid", "Six-up recap", ["Instagram portrait", "Photo collage"], "Six photos in a grid with a recap title underneath.", W, H, "collage", () => [
    sl("Six-up", "#ffffff", [
      grid("six", W, 1190, { cellBg: "#d9cfc2", margin: 40, gutter: 16, radius: 28 }),
      T("summer recap ’26", 40, 1215, 1000, { fontFamily: "Outfit", fontWeight: 600, fontSize: 76, name: "Title" }),
    ]),
  ]),
  tpl("polaroid-trio", "Polaroid trio", ["Instagram portrait", "Photo collage", "Personal"], "Three instant photos, stacked across the post.", W, H, "single", () => [
    sl("Trio", "#dfe6e1", [
      R(70, 80, 520, 580, "#ffffff", { radius: 8, shadow: lift, name: "Polaroid 1" }), ph(100, 110, 460, 420, "#b9a58e", { radius: 4 }),
      R(490, 400, 520, 580, "#ffffff", { radius: 8, shadow: lift, name: "Polaroid 2" }), ph(520, 430, 460, 420, "#8aa59a", { radius: 4 }),
      R(70, 720, 520, 580, "#ffffff", { radius: 8, shadow: lift, name: "Polaroid 3" }), ph(100, 750, 460, 420, "#c9a28f", { radius: 4 }),
      T("three\nsmall\njoys", 640, 1020, 380, { fontFamily: "Caveat", fontWeight: 700, fontSize: 96, lineHeight: 0.95, fill: ink("#2b3a34"), name: "Note" }),
    ]),
  ]),

  // ───────────────────────────── Instagram square ─────────────────────────────
  tpl("quote-split", "Quote split", ["Instagram square", "Quote"], "Photo on one side, quote on a deep green block.", 1080, 1080, "single", () => [
    sl("Quote split", "#1f3a33", [
      ph(0, 0, 540, 1080, "#8a7f72", { radius: 0 }),
      T("“Stay curious.”", 590, 330, 440, { fontFamily: "Playfair Display", fontWeight: 700, italic: true, fontSize: 84, lineHeight: 1.1, fill: ink("#ffffff"), name: "Quote" }),
      T("— studio notes", 590, 700, 440, { fontFamily: "Outfit", fontWeight: 300, fontSize: 30, letterSpacing: 2, fill: ink("#c9e4d6"), name: "Credit" }),
    ], 1080, 1080),
  ]),
  tpl("announcement", "We’re open", ["Instagram square", "Sale", "Typography"], "A bright announcement tile with hours.", 1080, 1080, "single", () => [
    sl("Announcement", "#ff5b2e", [
      O(660, -180, 640, 640, "#ffd23f", { name: "Sun" }),
      T("We’re\nopen!", 70, 120, 900, { fontFamily: "Archivo Black", fontSize: 250, lineHeight: 0.92, fill: ink("#111111"), name: "Headline" }),
      T("Mon – Sat · 9 am to 6 pm", 70, 780, 900, { fontFamily: "Outfit", fontWeight: 500, fontSize: 52, fill: ink("#ffffff"), name: "Hours" }),
      pill("12 Park Street  →", 70, 900, 520, "#111111", "#ffffff", { fontSize: 38 }),
    ], 1080, 1080),
  ]),
  tpl("intro-post", "Intro post", ["Instagram square", "Personal", "Typography"], "A round photo, a friendly headline and three tags.", 1080, 1080, "single", () => [
    sl("Intro", "#f4efe8", [
      ph(110, 100, 340, 340, "#c49a7a", { shape: "circle" }),
      T("Hi, I’m Sam.", 110, 490, 860, { fontFamily: "Fraunces", fontWeight: 300, fontSize: 130, lineHeight: 1, fill: ink("#2b2118"), name: "Headline" }),
      T("I make small, honest things for the internet.", 110, 650, 780, { fontFamily: "DM Sans", fontWeight: 400, fontSize: 40, lineHeight: 1.3, fill: ink("#5a4a3c"), name: "Bio" }),
      pill("photographer", 110, 840, 260, "#2b2118", "#ffffff", { fontSize: 28 }), pill("illustrator", 400, 840, 230, "#2b2118", "#ffffff", { fontSize: 28 }), pill("writer", 660, 840, 180, "#2b2118", "#ffffff", { fontSize: 28 }),
      mono("@yourname", 110, 980, 500, "#5a4a3c", { name: "Handle" }),
    ], 1080, 1080),
  ]),
  tpl("quote-bold", "Bold quote", ["Instagram square", "Quote", "Typography"], "A big sans quote on lime.", 1080, 1080, "single", () => [
    sl("Quote", "#f6d96b", [
      T("“", 70, -20, 300, { fontFamily: "Archivo Black", fontSize: 420, lineHeight: 1, fill: ink("#111111"), name: "Mark" }),
      T("Make it\nsimple.\nMake it\nyours.", 70, 330, 940, { fontFamily: "Syne", fontWeight: 800, fontSize: 124, lineHeight: 1, fill: ink("#111111"), name: "Quote" }),
      mono("— FROM THE NOTEBOOK", 70, 990, 700, "#111111", { name: "Credit" }),
    ], 1080, 1080),
  ]),
  tpl("quote-handwritten", "Handwritten note", ["Instagram square", "Quote", "Personal"], "A handwritten reminder on lined paper.", 1080, 1080, "single", () => [
    sl("Note", { type: "pattern", pattern: "lines", color: "#e3d6bd", bg: "#f8f1e3", size: 56, opacity: 1 }, [
      T("be kind to your\nfuture self", 80, 250, 920, { fontFamily: "Caveat", fontWeight: 700, fontSize: 150, lineHeight: 1.0, align: "center", fill: ink("#2b2b2b"), name: "Note" }),
      T("— me", 600, 760, 380, { fontFamily: "Mrs Saint Delafield", fontSize: 170, align: "right", fill: ink("#c25b3d"), name: "Signature" }),
    ], 1080, 1080),
  ]),
  tpl("special-of-the-day", "Today’s special", ["Instagram square", "Food", "Sale"], "A round dish photo, a price and a tag.", 1080, 1080, "single", () => [
    sl("Special", "#1d3a2f", [
      pill("TODAY’S SPECIAL", 330, 70, 420, "#f6d96b", "#1d3a2f", { fontSize: 30, letterSpacing: 4 }),
      ph(190, 190, 700, 700, "#d9a35f", { shape: "circle" }),
      T("Charred corn risotto", 60, 905, 700, { fontFamily: "Fraunces", fontWeight: 300, fontSize: 70, fill: ink("#ffffff"), name: "Dish" }),
      T("₹ 349", 780, 920, 240, { fontFamily: "Outfit", fontWeight: 600, fontSize: 64, align: "right", fill: ink("#f6d96b"), name: "Price" }),
    ], 1080, 1080),
  ]),
  tpl("cafe-mornings", "Café mornings", ["Instagram square", "Food", "Minimal"], "A pill-shaped photo beside warm lowercase type.", 1080, 1080, "single", () => [
    sl("Café", "#f3ecdf", [
      ph(580, 90, 410, 900, "#a47c55", { shape: "pill" }),
      T("café\nmornings", 90, 150, 480, { fontFamily: "Fraunces", fontWeight: 300, fontSize: 96, lineHeight: 1.02, fill: ink("#3b2a1d"), name: "Title" }),
      T("open daily · 7 to 5", 90, 640, 460, { fontFamily: "Outfit", fontWeight: 400, fontSize: 36, fill: ink("#6b5642"), name: "Hours" }),
      mono("@yourcafe", 90, 930, 400, "#3b2a1d", { name: "Handle" }),
    ], 1080, 1080),
  ]),
  tpl("happy-birthday", "Happy birthday", ["Instagram square", "Event", "Personal"], "Confetti, a script name and a bright ground.", 1080, 1080, "single", () => [
    sl("Birthday", "#ffe45e", [
      makeShape("star", 90, 90, { fill: ink("#ff3d81"), name: "Confetti 1" }, 900, 50), O(90, 50, 60, 60, "#3d7dff", { name: "Confetti 2" }),
      makeShape("triangle", 90, 80, { fill: ink("#3d7dff"), name: "Confetti 3" }, 900, 560), makeShape("star", 70, 70, { fill: ink("#ff3d81"), name: "Confetti 4" }, 140, 880), O(860, 880, 60, 60, "#ff3d81", { name: "Confetti 5" }),
      T("HAPPY\nBIRTHDAY", 80, 160, 920, { fontFamily: "Unbounded", fontWeight: 900, fontSize: 118, lineHeight: 0.98, fill: ink("#1b1b1b"), name: "Headline" }),
      T("Sam", 80, 560, 920, { fontFamily: "Pacifico", fontSize: 260, lineHeight: 1, fill: ink("#ff3d81"), name: "Name" }),
    ], 1080, 1080),
  ]),

  // ───────────────────────────── Stories (1080 × 1920) ─────────────────────────────
  tpl("story-poll", "Story · poll", ["Story", "Personal"], "A photo with a two-option poll card.", 1080, SH, "story", () => [
    sl("Poll", "#111111", [
      ph(0, 0, 1080, SH, "#4b5d73", { radius: 0 }),
      R(0, 0, 1080, SH, "rgba(0,0,0,0.25)", { name: "Shade" }),
      R(90, 1010, 900, 540, "#ffffff", { radius: 56, name: "Card" }),
      T("Which one?", 150, 1080, 780, { fontFamily: "Outfit", fontWeight: 600, fontSize: 80, name: "Question" }),
      R(150, 1260, 360, 150, "#111111", { radius: 75, name: "Option A" }), T("A", 150, 1300, 360, { fontFamily: "Outfit", fontWeight: 600, fontSize: 64, align: "center", fill: ink("#ffffff"), name: "A" }),
      R(570, 1260, 360, 150, "#ff5b2e", { radius: 75, name: "Option B" }), T("B", 570, 1300, 360, { fontFamily: "Outfit", fontWeight: 600, fontSize: 64, align: "center", fill: ink("#ffffff"), name: "B" }),
    ], 1080, SH),
  ]),
  tpl("story-countdown", "Story · countdown", ["Story", "Event"], "A giant number and a date.", 1080, SH, "story", () => [
    sl("Countdown", { type: "gradient", angle: 180, stops: [{ offset: 0, color: "#111111" }, { offset: 1, color: "#3a1c0a" }] }, [
      T("3", 40, 330, 1000, { fontFamily: "Unbounded", fontWeight: 900, fontSize: 760, lineHeight: 1, align: "center", fill: ink("#ff6a1a"), name: "Number" }),
      T("DAYS TO GO", 40, 1230, 1000, { fontFamily: "Bebas Neue", fontSize: 190, align: "center", fill: ink("#ffffff"), name: "Label" }),
      mono("SAVE THE DATE · 24 JUNE", 40, 1480, 1000, "#ffd9bf", { align: "center", fontSize: 34, letterSpacing: 5, name: "Date" }),
    ], 1080, SH),
  ]),
  tpl("story-quote", "Story · quote", ["Story", "Quote"], "A large serif quote on warm paper.", 1080, SH, "story", () => [
    sl("Quote", "#f1e4d3", [
      T("“", 70, 220, 400, { fontFamily: "Fraunces", fontWeight: 400, fontSize: 520, lineHeight: 1, fill: ink("#d98e73"), name: "Mark" }),
      T("Slow down.\nThe good things are not in a hurry.", 90, 760, 900, { fontFamily: "Instrument Serif", fontSize: 130, lineHeight: 1.04, fill: ink("#3a2a22"), name: "Quote" }),
      mono("— @yourname", 90, 1560, 700, "#8a5a44", { name: "Credit" }),
    ], 1080, SH),
  ]),
  tpl("story-photo-dump", "Story · photo dump", ["Story", "Photo collage"], "Three stacked photos under a casual title.", 1080, SH, "story", () => [
    sl("Dump", "#ece7df", [
      T("photo dump", 90, 110, 900, { fontFamily: "Fraunces", fontWeight: 300, italic: true, fontSize: 150, lineHeight: 1, fill: ink("#2b2118"), name: "Title" }),
      grid("three-v", 900, 1290, { x: 90, y: 360, cellBg: "#cfc4b3", margin: 0, gutter: 36, radius: 32 }),
      mono("VOL. 12 · JUNE", 90, 1740, 900, "#2b2118", { name: "Volume" }),
    ], 1080, SH),
  ]),
  tpl("story-ask-me", "Story · ask me", ["Story", "Personal"], "A question box for your followers.", 1080, SH, "story", () => [
    sl("Ask me", { type: "gradient", angle: 160, stops: [{ offset: 0, color: "#ff9a5a" }, { offset: 1, color: "#ff4d6d" }] }, [
      T("Q&A", 40, 330, 1000, { fontFamily: "Anton", fontSize: 330, lineHeight: 1, align: "center", fill: ink("#ffffff"), name: "Title" }),
      R(90, 850, 900, 520, "#ffffff", { radius: 56, name: "Card" }),
      T("Ask me anything", 150, 920, 780, { fontFamily: "Outfit", fontWeight: 700, fontSize: 88, lineHeight: 1.05, name: "Prompt" }),
      R(150, 1150, 780, 120, "#f1f1f1", { radius: 60, name: "Field" }),
      T("Type something…", 200, 1184, 700, { fontFamily: "Outfit", fontWeight: 300, fontSize: 44, fill: ink("#9a9a9a"), name: "Hint" }),
      mono("REPLIES GO TO @YOURNAME", 90, 1600, 900, "#ffffff", { align: "center", name: "Handle" }),
    ], 1080, SH),
  ]),
  tpl("story-this-or-that", "Story · this or that", ["Story", "Personal"], "Two photos split by an OR.", 1080, SH, "story", () => [
    sl("This or that", "#111111", [
      ph(0, 0, 1080, 960, "#c98f6b", { radius: 0 }), ph(0, 960, 1080, 960, "#6f8fb3", { radius: 0 }),
      T("A", 70, 60, 300, { fontFamily: "Bebas Neue", fontSize: 220, lineHeight: 1, fill: ink("#ffffff"), name: "A" }),
      T("B", 710, 1650, 300, { fontFamily: "Bebas Neue", fontSize: 220, lineHeight: 1, align: "right", fill: ink("#ffffff"), name: "B" }),
      O(410, 830, 260, 260, "#ffffff", { name: "Badge" }),
      T("OR", 410, 905, 260, { fontFamily: "Anton", fontSize: 120, lineHeight: 1, align: "center", name: "Or" }),
    ], 1080, SH),
  ]),
  tpl("story-new-post", "Story · new post", ["Story", "Sale"], "Tease a new post with a framed preview.", 1080, SH, "story", () => [
    sl("New post", "#111111", [
      T("NEW POST", 40, 130, 1000, { fontFamily: "Outfit", fontWeight: 800, fontSize: 130, letterSpacing: 4, align: "center", fill: ink("#ffffff"), name: "Title" }),
      ph(120, 380, 840, 1050, "#7aa2c9", { radius: 64 }),
      O(450, 1530, 180, 180, "#f6d96b", { name: "Button" }),
      T("↓", 450, 1555, 180, { fontFamily: "Inter", fontWeight: 600, fontSize: 130, align: "center", lineHeight: 1, name: "Arrow" }),
    ], 1080, SH),
  ]),

  // ───────────────────────────── Carousels ─────────────────────────────
  tpl("carousel-photo-dump", "Photo dump carousel · 5 slides", ["Carousel", "Photo collage"], "Cover, a pair, a full-bleed, a grid and a sign-off.", W, H, "carousel", () => [
    sl("1 · Cover", "#ffffff", [ph(48, 48, W - 96, H - 96, "#b8715c", { radius: 64 }), T("photo\ndump", 110, 860, 700, { fontFamily: "Fraunces", fontWeight: 300, italic: true, fontSize: 190, lineHeight: 0.92, fill: ink("#ffffff"), shadow: { color: "#000000", blur: 30, x: 0, y: 6, opacity: 0.3 }, name: "Title" }), mono("SWIPE →", 760, 1240, 260, "#ffffff", { align: "right" })]),
    sl("2 · Pair", "#f1ede6", [grid("two-v", W, H, { cellBg: "#cdbfae", margin: 48, gutter: 24, radius: 48 })]),
    sl("3 · Full bleed", "#111111", [ph(0, 0, W, H, "#5d7b6f", { radius: 0 }), T("the quiet part", 60, 1180, 900, { fontFamily: "Instrument Serif", italic: true, fontSize: 96, fill: ink("#ffffff"), name: "Caption" })]),
    sl("4 · Grid", "#ffffff", [grid("four", W, H, { cellBg: "#d9cfc2", margin: 48, gutter: 24, radius: 40 })]),
    sl("5 · Sign-off", "#f6d96b", [T("thanks for\nscrolling", 60, 380, 960, { fontFamily: "Outfit", fontWeight: 800, fontSize: 160, lineHeight: 0.98, fill: ink("#111111"), name: "Thanks" }), mono("@yourname", 60, 1200, 700, "#111111")]),
  ]),
  tpl("carousel-tutorial", "Tutorial carousel · 5 slides", ["Carousel", "Typography", "Editorial"], "A cover and four numbered steps.", W, H, "carousel", () => {
    const step = (n: string, title: string, body: string, bg: string, fg: string): Slide => sl(`${n} · ${title}`, bg, [
      T(n, 60, 70, 500, { fontFamily: "Anton", fontSize: 420, lineHeight: 1, fill: ink(fg), opacity: 0.18, name: "Number" }),
      T(title, 60, 620, 960, { fontFamily: "Outfit", fontWeight: 800, fontSize: 112, lineHeight: 1.0, fill: ink(fg), name: "Step" }),
      T(body, 60, 790, 900, { fontFamily: "DM Sans", fontWeight: 400, fontSize: 44, lineHeight: 1.35, fill: ink(fg), name: "Body" }),
      mono(`${n} / 04`, 60, 1250, 300, fg),
    ]);
    return [
      sl("Cover", "#1f3a33", [T("How to edit a photo in 4 steps", 60, 330, 960, { fontFamily: "Fraunces", fontWeight: 300, fontSize: 150, lineHeight: 1.0, fill: ink("#ffffff"), name: "Title" }), mono("A QUICK GUIDE · SWIPE →", 60, 1200, 960, "#c9e4d6")]),
      step("01", "Straighten", "Level the horizon first. Everything else gets easier.", "#f4efe8", "#1f3a33"),
      step("02", "Set the light", "Lift the shadows, calm the highlights, then fix exposure.", "#f6d96b", "#111111"),
      step("03", "Tune colour", "Warm or cool it a touch. Keep skin tones honest.", "#ffd9c9", "#4a2418"),
      step("04", "Finish", "Crop to 4:5, add a little grain, export.", "#111111", "#ffffff"),
    ];
  }),
  tpl("carousel-listicle", "Listicle carousel · 5 slides", ["Carousel", "Typography", "Poster"], "A bold cover and four numbered tips.", W, H, "carousel", () => {
    const tip = (n: string, text: string, bg: string, fg: string): Slide => sl(`Tip ${n}`, bg, [
      T(n, 60, 80, 600, { fontFamily: "Archivo Black", fontSize: 360, lineHeight: 1, fill: ink(fg), name: "Number" }),
      T(text, 60, 560, 960, { fontFamily: "Outfit", fontWeight: 700, fontSize: 104, lineHeight: 1.05, fill: ink(fg), name: "Tip" }),
    ]);
    return [
      sl("Cover", "#ff5b2e", [T("4 habits for better photos", 60, 280, 960, { fontFamily: "Archivo Black", fontSize: 150, lineHeight: 0.98, fill: ink("#ffffff"), name: "Title" }), pill("Swipe  →", 60, 1150, 300, "#111111", "#ffffff", { fontSize: 36 })]),
      tip("1", "Shoot in the first and last hour of light.", "#ffffff", "#111111"),
      tip("2", "Move your feet before you zoom.", "#111111", "#f6d96b"),
      tip("3", "Look for one clean background.", "#f6d96b", "#111111"),
      tip("4", "Edit less than you want to.", "#ffd9c9", "#4a2418"),
    ];
  }),
  tpl("carousel-story-arc", "Story arc carousel · 5 slides", ["Carousel", "Storytelling", "Travel"], "Photo, text and full-bleed slides that read like a short film.", W, H, "carousel", () => [
    sl("1 · Opening", "#ffffff", [ph(48, 48, W - 96, H - 96, "#2f80b7", { radius: 64 }), T("Day one", 110, 1060, 700, { fontFamily: "Fraunces", fontWeight: 300, fontSize: 120, fill: ink("#ffffff"), name: "Title" })]),
    sl("2 · Text", "#f4efe8", [T("We almost\nmissed the\nlast bus.", 60, 260, 960, { fontFamily: "Instrument Serif", italic: true, fontSize: 170, lineHeight: 1.0, fill: ink("#2b2118"), name: "Line" })]),
    sl("3 · Scene", "#111111", [ph(0, 0, W, H, "#8c6a4f", { radius: 0 }), R(0, 800, W, 550, grad(180, "rgba(0,0,0,0)", "rgba(0,0,0,0.7)"), { name: "Shade" }), T("Then the sky opened up.", 60, 1120, 960, { fontFamily: "Outfit", fontWeight: 600, fontSize: 76, fill: ink("#ffffff"), name: "Caption" })]),
    sl("4 · Detail", "#ffffff", [grid("two-uneven", W, H, { cellBg: "#cdbfae", margin: 48, gutter: 24, radius: 48 })]),
    sl("5 · End", "#1f3a33", [T("Worth it.", 60, 460, 960, { fontFamily: "Fraunces", fontWeight: 300, fontSize: 220, fill: ink("#ffffff"), name: "End" }), mono("@yourname", 60, 1200, 700, "#c9e4d6")]),
  ]),
  tpl("panorama-3", "Panorama · 3 slides", ["Carousel", "Instagram portrait", "Travel"], "One wide photo across three slides, with type that crosses the seams.", 3240, H, "carousel", () => [
    sl("Panorama", "#f4efe8", [
      ph(48, 48, 3240 - 96, H - 96, "#7aa2c9", { radius: 64 }),
      T("one view, three slides", 140, 1010, 2400, { fontFamily: "Fraunces", fontWeight: 300, italic: true, fontSize: 190, lineHeight: 1, fill: ink("#ffffff"), shadow: { color: "#000000", blur: 30, x: 0, y: 6, opacity: 0.25 }, name: "Title" }),
      mono("SWIPE →", 2860, 1220, 300, "#ffffff", { align: "right" }),
    ], 3240, H),
  ]),
];
