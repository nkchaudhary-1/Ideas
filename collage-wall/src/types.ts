export type ArtworkType = "portrait" | "wide";
export type Composition = "photo" | "photo-type" | "collage" | "spread";

export interface Artwork {
  id: string;
  /** Node id of the frame in the Figma file – the source of truth for the image. */
  figmaId: string;
  /** Raw Figma frame name. */
  name: string;
  /** Public label (derived from the frame name, overridable in data/source/overrides.json). */
  label: string;
  /** Whether the label is drawn above this artwork on the wall. */
  showLabel: boolean;
  image: string;
  thumbnail: string;
  placeholder: string;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
  displayWidth: number;
  displayHeight: number;
  type: ArtworkType;
  composition: Composition;
  category: string;
  tags: string[];
  collection: string;
  carouselId: string | null;
  slideIndex: number;
  slideCount: number;
  /** Average photo colour, used as the loading placeholder. */
  color: string;
  /** False until the frame has been exported from Figma. */
  available: boolean;
  /** An exact duplicate of the previous frame – kept in the data, hidden from the wall. */
  hidden: boolean;
  duplicateOf: string | null;
  /** Set on a joined panorama: the two slides it was built from (this artwork's image is the joined 2:1.25 result). */
  panorama: { left: string; right: string } | null;
  /** Set on the right-hand slide of a panorama: it is shown as part of the joined artwork instead. */
  joinedInto: string | null;
  rowId: string;
  order: number;
}

export interface Row {
  id: string;
  /** Optional contextual heading shown above the row. */
  title: string;
  order: number;
  collectionId: string;
  artworks: string[];
}

export interface Collection {
  id: string;
  title: string;
  order: number;
  rowIds: string[];
  count: number;
}

export interface LayoutConfig {
  rowHeight: number;
  gap: number;
  carouselGap: number;
  rowGap: number;
  collectionGap: number;
  labelHeight: number;
}

export interface PlacedArtwork {
  art: Artwork;
  x: number;
  y: number;
  w: number;
  h: number;
  rowIndex: number;
  index: number;
}

export interface PlacedRow {
  row: Row;
  top: number;
  headingY: number;
  artY: number;
  height: number;
  width: number;
  items: PlacedArtwork[];
}

export interface World {
  rows: PlacedRow[];
  items: PlacedArtwork[];
  width: number;
  height: number;
  pad: number;
  collectionAnchors: { collection: Collection; y: number; firstLabel: string }[];
}
