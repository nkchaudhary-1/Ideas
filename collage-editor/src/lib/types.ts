/**
 * Document model.
 *
 * A Project owns Slides (a single post is a project with one slide, a carousel has many).
 * A Slide owns an ordered list of Elements (bottom → top). Photos and videos share one `MediaFill`
 * so an image frame, a video frame and a grid cell are all the same kind of thing: a window onto media.
 * Everything is plain JSON so history (structural sharing), persistence and templates are trivial.
 */

export type Id = string;

export interface Rect { x: number; y: number; w: number; h: number }

// ───────────────────────────── media ─────────────────────────────

/** the numeric sliders (everything except the nested colour tools below) */
export interface Tone {
  exposure: number;     // -100..100  (±2 stops)
  brightness: number;   // -100..100
  contrast: number;     // -100..100
  highlights: number;   // -100..100
  shadows: number;      // -100..100
  whites: number;       // -100..100  (the very brightest tones)
  blacks: number;       // -100..100  (the very darkest tones; + lifts them)
  saturation: number;   // -100..100
  vibrance: number;     // -100..100  (saturation that protects already-vivid colour and skin)
  temperature: number;  // -100..100  (cool → warm)
  tint: number;         // -100..100  (green → magenta)
  hue: number;          // -180..180
  sharpness: number;    // 0..100
  blur: number;         // 0..100
  grayscale: number;    // 0..100
  sepia: number;        // 0..100
  fade: number;         // 0..100  (lifts blacks)
  vignette: number;     // 0..100
  grain: number;        // 0..100
}
export type ToneKey = keyof Tone;

export type HslKey = "red" | "orange" | "yellow" | "green" | "aqua" | "blue" | "purple" | "magenta";
/** [hue shift, saturation, luminance], each -100..100 */
export type Tri = [number, number, number];
/** one colour-grading wheel: [hue 0..360, saturation 0..100, luminance -100..100] */
export type Wheel = [number, number, number];
export interface Grade { sh: Wheel; mid: Wheel; hi: Wheel; bal: number }
/** curve control points, x and y both 0..255 */
export type CurvePts = [number, number][];
export interface Curves { m?: CurvePts; r?: CurvePts; g?: CurvePts; b?: CurvePts }

export interface Adjustments extends Tone {
  hsl?: Partial<Record<HslKey, Tri>>;
  grade?: Grade;
  curves?: Curves;
}

/** a partial set of the above, used by filter presets and the match layer */
export type AdjustDelta = Partial<Tone> & { hsl?: Adjustments["hsl"]; grade?: Grade; curves?: Curves };

/** "Match look": a stored, additive layer with its own strength, so it can be dialled back or fine-tuned over */
export interface MatchLayer { ref: string; intensity: number; adj: AdjustDelta }

export interface FilterRef { id: string; intensity: number } // intensity 0..100

export interface VideoSettings {
  trimStart: number;          // seconds into the original file
  trimEnd: number | null;     // null = to the end
  muted: boolean;
  volume: number;             // 0..1
  coverTime: number;          // seconds (absolute, inside the trim) used for stills, thumbnails and posters
  loop: boolean;
}

/** A window onto an image or video. Non-destructive: the asset is never touched. */
export interface MediaFill {
  assetId: Id | null;
  kind: "image" | "video";
  /** magnification relative to "cover" (1 = fill the frame exactly, 2 = 2× closer) */
  zoom: number;
  /** centre of the visible region, in source-normalised coordinates (0..1) */
  fx: number;
  fy: number;
  flipX: boolean;
  flipY: boolean;
  rotation90: 0 | 90 | 180 | 270;
  adjustments: Adjustments;
  filter: FilterRef;
  match?: MatchLayer;
  video?: VideoSettings;
}

export interface Asset {
  id: Id;
  kind: "image" | "video";
  name: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  duration?: number;
  createdAt: number;
  thumb: string; // small data URL
  status: "ready" | "unsupported";
  note?: string;
  hasAudio?: boolean;
}

// ───────────────────────────── styling ─────────────────────────────

export interface Shadow { color: string; blur: number; x: number; y: number; opacity: number }
export interface Stroke { color: string; width: number }
export interface GradientStop { offset: number; color: string }
export type Paint =
  | { type: "solid"; color: string }
  | { type: "gradient"; angle: number; stops: GradientStop[] };

export type BlendMode = "source-over" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light" | "darken" | "lighten" | "difference" | "color-dodge";

// ───────────────────────────── elements ─────────────────────────────

export interface BaseEl {
  id: Id;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  blend: BlendMode;
  shadow: Shadow | null;
}

export type FrameShape = "rect" | "circle" | "arch" | "squircle" | "pill";

export interface MediaEl extends BaseEl {
  type: "image" | "video";
  shape: FrameShape;
  radius: number;
  fill: MediaFill | null;
  bg: string;               // colour behind / around the media (shows while empty)
  stroke: Stroke | null;
}

export interface TextEl extends BaseEl {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  align: "left" | "center" | "right" | "justify";
  vAlign: "top" | "middle" | "bottom";
  lineHeight: number;        // multiplier
  letterSpacing: number;     // px
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  fill: Paint;
  stroke: Stroke | null;
  padding: number;
  background: { color: string; radius: number } | null;
  autoHeight: boolean;
}

export type ShapeKind = "rect" | "ellipse" | "line" | "arrow" | "polygon" | "star" | "triangle" | "path";

export interface ShapeEl extends BaseEl {
  type: "shape";
  kind: ShapeKind;
  fill: Paint | null;
  stroke: Stroke | null;
  radius: number;            // corner radius (rect)
  sides: number;             // polygon / star points
  innerRatio: number;        // star inner radius ratio
  path?: string;             // svg path (kind = "path"), authored in a viewBox of `pathBox`
  pathBox?: { w: number; h: number };
  glass?: number;            // 0..1 backdrop-blur style translucency used by "glass panel" elements
  lineCap?: "butt" | "round";
}

// ─────────────── grids: a tree of splits and cells ───────────────

export interface GridCell { kind: "cell"; id: Id; fill: MediaFill | null; bg: string | null; radius: number | null }
export interface GridSplit { kind: "split"; id: Id; dir: "h" | "v"; weights: number[]; children: GridNode[] }
export type GridNode = GridCell | GridSplit;

export interface GridEl extends BaseEl {
  type: "grid";
  margin: number;
  gutter: number;
  radius: number;
  cellBg: string;
  cellStroke: Stroke | null;
  tree: GridNode;
}

export interface GroupEl extends BaseEl {
  type: "group";
  children: Element[];
}

export type Element = MediaEl | TextEl | ShapeEl | GridEl | GroupEl;
export type ElementType = Element["type"];

// ───────────────────────────── slide / project ─────────────────────────────

export type Background =
  | { type: "solid"; color: string }
  | { type: "gradient"; angle: number; stops: GradientStop[] }
  | { type: "pattern"; pattern: "dots" | "grid" | "lines" | "checker" | "noise" | "paper"; color: string; bg: string; size: number; opacity: number }
  | { type: "image"; fill: MediaFill; color: string };

export interface LayoutGrid {
  visible: boolean;
  kind: "columns" | "modular" | "baseline" | "none";
  columns: number;
  rows: number;
  gutter: number;
  margin: number;
  baseline: number;
  color: string;
  snap: boolean;
}

export interface Slide {
  id: Id;
  name: string;
  width: number;
  height: number;
  background: Background;
  elements: Element[];
  guides: { x: number[]; y: number[] };
  grid: LayoutGrid;
  /** seconds; null = longest trimmed video on the slide (or 5s for a video-less slide exported as video) */
  duration: number | null;
}

export type ProjectKind = "single" | "collage" | "carousel" | "story" | "edit";

export interface Format { id: string; label: string; ratio: string; width: number; height: number }

export interface Project {
  id: Id;
  schema: 1;
  name: string;
  kind: ProjectKind;
  format: Format;
  slides: Slide[];
  activeSlideId: Id;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectMeta { id: Id; name: string; kind: ProjectKind; updatedAt: number; slideCount: number; thumb?: string; ratio: string }

// ───────────────────────────── user presets ─────────────────────────────

/** A saved photo/video look: the filter and every adjustment. */
export interface LookData { filter: FilterRef; adjustments: Adjustments }
/** A saved text style. Sizes are stored relative to the canvas width so a style fits any format. */
export interface TextStyleData {
  fontFamily: string; sizeRatio: number; fontWeight: number; italic: boolean; underline: boolean; strike: boolean;
  align: TextEl["align"]; lineHeight: number; letterRatio: number; textTransform: TextEl["textTransform"];
  fill: Paint; stroke: Stroke | null; background: TextEl["background"]; shadow: Shadow | null;
}
export interface SizeData { width: number; height: number }
/** A saved collage layout: the cell structure (no photos) plus its spacing, relative to the canvas it was made on. */
export interface LayoutData { tree: GridNode; margin: number; gutter: number; radius: number; cellBg: string; cellStroke: Stroke | null; refWidth: number }

export type UserPreset = { id: Id; name: string; createdAt: number } & (
  | { kind: "look"; data: LookData }
  | { kind: "text"; data: TextStyleData }
  | { kind: "size"; data: SizeData }
  | { kind: "layout"; data: LayoutData }
);
export type PresetKind = UserPreset["kind"];
export type NewPreset = UserPreset extends infer U ? (U extends UserPreset ? Omit<U, "id" | "createdAt"> : never) : never;
