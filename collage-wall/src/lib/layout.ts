import type { Artwork, Collection, LayoutConfig, PlacedArtwork, PlacedRow, Row, World } from "../types";

const HEADING_H = 44; // room for an optional row heading (world px at zoom 1)

/**
 * Pure function: data in, world geometry out.
 * Rows flow left to right in curated order; vertical rhythm is tight inside a collection
 * and opens up between collections, mirroring the gaps on the Figma canvas.
 */
export function buildWorld(
  artworks: Map<string, Artwork>,
  rows: Row[],
  collections: Collection[],
  cfg: LayoutConfig,
): World {
  const pad = 180;
  const placedRows: PlacedRow[] = [];
  const items: PlacedArtwork[] = [];
  const anchors: World["collectionAnchors"] = [];
  const collectionById = new Map(collections.map((c) => [c.id, c]));
  const seen = new Set<string>();

  let y = pad;
  let maxW = 0;
  let prev: Row | null = null;

  rows.forEach((row, rowIndex) => {
    if (prev) y += prev.collectionId !== row.collectionId ? cfg.collectionGap : cfg.rowGap;
    const headingH = row.title ? HEADING_H : 0;
    const top = y;
    const artY = top + headingH + cfg.labelHeight;
    const arts = row.artworks.map((id) => artworks.get(id)).filter((a): a is Artwork => !!a);
    const rowH = Math.max(...arts.map((a) => a.displayHeight), cfg.rowHeight);

    let x = pad;
    const placed: PlacedArtwork[] = [];
    arts.forEach((art, i) => {
      if (i > 0) {
        const p = arts[i - 1];
        x += p.carouselId && p.carouselId === art.carouselId ? cfg.carouselGap : cfg.gap;
      }
      const item: PlacedArtwork = { art, x, y: artY, w: art.displayWidth, h: art.displayHeight, rowIndex, index: items.length };
      placed.push(item);
      items.push(item);
      x += art.displayWidth;
    });

    if (!seen.has(row.collectionId)) {
      seen.add(row.collectionId);
      const c = collectionById.get(row.collectionId);
      if (c) anchors.push({ collection: c, y: top, firstLabel: arts.find((a) => a.label)?.label ?? "" });
    }

    placedRows.push({ row, top, headingY: top, artY, height: rowH, width: x - pad, items: placed });
    maxW = Math.max(maxW, x - pad);
    y = artY + rowH;
    prev = row;
  });

  return { rows: placedRows, items, width: maxW + pad * 2, height: y + pad, pad, collectionAnchors: anchors };
}

export type Tier = "xs" | "md" | "full";

/** Pick the smallest image tier that still looks sharp at the current on-screen size. */
export function pickTier(art: Artwork, k: number, dpr: number): Tier {
  const screenW = art.displayWidth * k * dpr;
  const xsW = Math.round(225 * art.aspectRatio);
  const mdW = Math.round(675 * art.aspectRatio);
  if (screenW <= xsW * 1.05) return "xs";
  if (screenW <= mdW * 1.05) return "md";
  return "full";
}

export function tierSrc(art: Artwork, tier: Tier): string {
  return tier === "xs" ? art.placeholder : tier === "md" ? art.thumbnail : art.image;
}
