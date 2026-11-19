import artworksJson from "./artworks.json";
import rowsJson from "./rows.json";
import collectionsJson from "./collections.json";
import layoutJson from "./layout.json";
import type { Artwork, Collection, LayoutConfig, Row } from "../types";

export const artworks = artworksJson as Artwork[];
export const rows = rowsJson as Row[];
export const collections = collectionsJson as Collection[];
export const layout = layoutJson as LayoutConfig;

export const artworkById = new Map(artworks.map((a) => [a.id, a]));
export const collectionById = new Map(collections.map((c) => [c.id, c]));
