import { TEMPLATES } from "../../src/lib/templates";
import { FONTS } from "../../src/lib/fonts";
import type { Element } from "../../src/lib/types";

let pass = 0, fail = 0;
const ok = (c: boolean, m: string, extra?: unknown) => { c ? pass++ : fail++; if (!c || process.env.VERBOSE) console.log((c ? "PASS " : "FAIL ") + m + (c || extra === undefined ? "" : "  → " + JSON.stringify(extra))); };

const CATEGORIES = new Set(["Personal", "Instagram portrait", "Instagram square", "Story", "Carousel", "Photo collage", "Editorial", "Typography", "Magazine", "Travel", "Event", "Minimal", "Storytelling", "Poster", "Quote", "Fashion", "Food", "Sale"]);
const KINDS = new Set(["single", "collage", "carousel", "story"]);
const fonts = new Set(FONTS.map((f) => f.family));
const flat = (els: Element[]): Element[] => els.flatMap((e) => (e.type === "group" ? [e, ...flat(e.children)] : [e]));

ok(TEMPLATES.length >= 50 && TEMPLATES.length <= 60, `the library has 50 to 60 templates (${TEMPLATES.length})`);
ok(new Set(TEMPLATES.map((t) => t.id)).size === TEMPLATES.length, "template ids are unique");
ok(new Set(TEMPLATES.map((t) => t.name)).size === TEMPLATES.length, "template names are unique");

const perCategory = new Map<string, number>();
for (const t of TEMPLATES) for (const c of t.categories) perCategory.set(c, (perCategory.get(c) ?? 0) + 1);
for (const c of CATEGORIES) ok((perCategory.get(c) ?? 0) >= 4, `category "${c}" has at least 4 templates`, perCategory.get(c));

for (const t of TEMPLATES) {
  const slides = t.build();
  const tag = `${t.id}:`;
  ok(slides.length > 0 && KINDS.has(t.kind), `${tag} builds slides and has a known kind`, t.kind);
  ok(t.categories.length > 0 && t.categories.every((c) => CATEGORIES.has(c)), `${tag} uses known categories`, t.categories);
  ok(/^[A-Z0-9]/.test(t.name) && !t.name.endsWith(".") && !t.name.endsWith("…"), `${tag} name is sentence case with no trailing stop`, t.name);
  ok(t.description.length > 12 && t.description.endsWith("."), `${tag} description is a full sentence`, t.description);
  ok(slides[0].width === t.size.w && slides[0].height === t.size.h, `${tag} first slide matches its declared size`, { slide: [slides[0].width, slides[0].height], size: t.size });
  if (t.kind === "carousel" && slides.length === 1) ok(t.size.w % 1080 === 0, `${tag} panorama width is a multiple of 1080`, t.size.w);
  if (t.kind === "story") ok(t.size.w === 1080 && t.size.h === 1920, `${tag} stories are 1080×1920`, t.size);

  const ids = new Set<string>();
  for (const s of slides) {
    ok(s.elements.length > 0, `${tag} ${s.name} has elements`);
    for (const e of flat(s.elements)) {
      ok(!ids.has(e.id), `${tag} element ids are unique`, e.id); ids.add(e.id);
      ok([e.x, e.y, e.width, e.height].every(Number.isFinite) && e.width > 0, `${tag} ${e.name} has a finite size`);
      // decorative shapes may bleed off the canvas, but nothing may sit entirely outside it
      ok(e.x < s.width && e.y < s.height && e.x + e.width > 0 && e.y + e.height > 0, `${tag} ${e.name} is on the canvas`, { x: e.x, y: e.y, w: e.width, h: e.height });
      if (e.type === "text") {
        ok(fonts.has(e.fontFamily), `${tag} font "${e.fontFamily}" is in the library`);
        ok(e.x >= -1 && e.x + e.width <= s.width + 1, `${tag} text "${e.text.slice(0, 18)}" stays inside the canvas width`, { x: e.x, w: e.width, canvas: s.width });
      }
    }
  }
}

// Only the layouts may come from the Figma file: no copy, names, handles or ids from it, and nothing that points back to it.
const BANNED = /figma|samwaad|vanshita|garba|da nang|\bgoa\b|yourhandle|hawayein|harry met|\bsrk\b|anupama|from your posts|\bfig-|exactly as in|\d+ ?px/i;
for (const t of TEMPLATES) {
  ok(!BANNED.test(`${t.id} ${t.name} ${t.description}`), `${t.id}: name and description are our own words`, `${t.name} / ${t.description}`);
  for (const s of t.build()) for (const e of flat(s.elements)) {
    if (e.type === "text") ok(!BANNED.test(e.text), `${t.id}: "${e.text.slice(0, 24)}" is our own copy`);
    if (e.type === "grid") ok(!/^fig-/.test(e.name), `${t.id}: layout name is our own`, e.name);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
