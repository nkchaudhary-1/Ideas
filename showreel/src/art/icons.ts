/** Small monochrome glyphs, drawn on a 24 x 24 grid and stroked with `currentColor`. */
const glyph = (body: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

/** The award trophy, a real icon instead of an emoji so the chip stays monochrome everywhere. */
export const trophy = glyph('<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3"/><path d="M12 13v3M9 20h6M10 16h4v4h-4z"/>');
export const check = glyph('<path d="M5 12.5l4.5 4.5L19 7.5"/>');
export const play = glyph('<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>');
export const sparkle = glyph('<path d="M12 3v5M12 16v5M3 12h5M16 12h5M7 7l2.5 2.5M14.5 14.5L17 17M17 7l-2.5 2.5M9.5 14.5L7 17"/>');
