/**
 * Concept artwork for the four hook frames. Every piece is drawn in a 1080 x 1080 box, stroked
 * with the beat's accent, and sits behind its word. Artwork, not UI: its corners are its own.
 */

const polar = (cx: number, cy: number, r: number, degrees: number): [number, number] => {
  const a = (degrees * Math.PI) / 180;
  return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))];
};

const open = '<svg class="hf-art" viewBox="0 0 1080 1080" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

/** A bezier curve with its anchors and handles showing: the sketch. */
const sketchArt = `${open}
  <g class="art-guides" opacity=".45" stroke-dasharray="3 14">
    <path d="M120 540H960M540 120V960"/>
    <circle cx="540" cy="540" r="372"/>
  </g>
  <path class="art-main" d="M156 744C288 252 552 252 648 528S852 864 924 336" stroke-width="7"/>
  <g class="art-handles" stroke-width="2" opacity=".75">
    <path d="M156 744L288 252M648 528L552 252M648 528L744 804M924 336L852 864"/>
  </g>
  <g class="art-anchors" fill="currentColor" stroke="none">
    <rect x="148" y="736" width="16" height="16" rx="2"/>
    <rect x="640" y="520" width="16" height="16" rx="2"/>
    <rect x="916" y="328" width="16" height="16" rx="2"/>
    <circle cx="288" cy="252" r="8"/><circle cx="552" cy="252" r="8"/>
    <circle cx="744" cy="804" r="8"/><circle cx="852" cy="864" r="8"/>
  </g>
</svg>`;

/**
 * An aperture: each edge of a hexagon runs on out to the ring, which is how an iris reads as an
 * iris. The shutter.
 */
const shutterArt = (() => {
  const inner = 210;
  const outer = 420;
  const vertex = (k: number): [number, number] => polar(540, 540, inner, k * 60 - 30);
  const blades = Array.from({ length: 6 }, (_, k) => {
    const [ax, ay] = vertex(k);
    const [bx, by] = vertex(k + 1);
    const length = Math.hypot(bx - ax, by - ay);
    const [dx, dy] = [(bx - ax) / length, (by - ay) / length];
    // Where the edge, continued past B, meets the outer ring: solve |B - centre + t.d| = outer for t.
    const [ox, oy] = [bx - 540, by - 540];
    const b = ox * dx + oy * dy;
    const t = -b + Math.sqrt(b * b - (ox * ox + oy * oy - outer * outer));
    return `M${ax} ${ay}L${Math.round(bx + t * dx)} ${Math.round(by + t * dy)}`;
  }).join('');
  return `${open}
  <g class="art-rings" opacity=".5"><circle cx="540" cy="540" r="${outer}"/><circle cx="540" cy="540" r="470" stroke-dasharray="3 14"/></g>
  <g class="art-main" stroke-width="5"><path d="${blades}"/></g>
</svg>`;
})();

/** A selection box with handles, a size label and a cursor: the Figma frame. */
const figmaArt = (() => {
  const [x, y, w, hgt] = [168, 312, 744, 456];
  const handles = [
    [x, y], [x + w / 2, y], [x + w, y],
    [x, y + hgt / 2], [x + w, y + hgt / 2],
    [x, y + hgt], [x + w / 2, y + hgt], [x + w, y + hgt],
  ].map(([hx, hy]) => `<rect x="${hx! - 10}" y="${hy! - 10}" width="20" height="20" rx="3"/>`).join('');
  return `${open}
  <rect class="art-main" x="${x}" y="${y}" width="${w}" height="${hgt}" stroke-width="4"/>
  <g class="art-handles" fill="currentColor" stroke="none">${handles}</g>
  <g class="art-label">
    <rect x="${x}" y="${y + hgt + 28}" width="248" height="44" rx="22" fill="currentColor" stroke="none"/>
    <text x="${x + 124}" y="${y + hgt + 58}" text-anchor="middle" fill="#0b0d10" stroke="none" font-size="22" font-weight="650">1920 × 1080</text>
  </g>
  <path class="art-cursor" d="M884 800L884 856L899 842L912 872L926 866L913 837L934 835Z" fill="currentColor" stroke="#0b0d10" stroke-width="3"/>
</svg>`;
})();

/** A padlock whose shackle lifts, with sparks: the unlock. */
const unlockArt = (() => {
  const sparks = Array.from({ length: 5 }, (_, k) => {
    const deg = -150 + k * 30;
    const [x1, y1] = polar(540, 400, 190, deg);
    const [x2, y2] = polar(540, 400, 250, deg);
    return `M${x1} ${y1}L${x2} ${y2}`;
  }).join('');
  return `${open}
  <g class="art-sparks" stroke-width="5" opacity=".8"><path d="${sparks}"/></g>
  <rect class="art-main" x="380" y="500" width="320" height="272" rx="32" stroke-width="6"/>
  <path class="art-shackle" d="M440 500V420a100 100 0 0 1 200 0V500" stroke-width="6"/>
  <circle cx="540" cy="624" r="28" stroke-width="5"/>
  <path d="M540 652V704" stroke-width="5"/>
</svg>`;
})();

/** Artwork in the same order as the config's `flashes`. Extra flashes beyond four reuse the set in turn. */
export const HOOK_ART = [sketchArt, shutterArt, figmaArt, unlockArt];
