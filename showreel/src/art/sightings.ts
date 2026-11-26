import type { SightingArt } from '../types';

/**
 * Line drawings for the three "design is everywhere" tiles, on a 200 x 200 grid. The warm accent
 * picks out one detail in each. Artwork, so the corners are its own.
 */
const open = '<svg class="tile-art" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

export const SIGHTING_ART: Record<SightingArt, string> = {
  signboard: `${open}
  <path d="M64 188V122M136 188V122"/>
  <g class="sign-board"><rect x="24" y="40" width="152" height="86" rx="8"/><path d="M48 70H152M48 94H114"/><path class="accent" d="M130 106h22M144 98l8 8-8 8"/></g>
</svg>`,
  sunset: `${open}
  <path d="M16 144H184M40 168H160M64 190H136"/>
  <g class="sun"><path class="accent" d="M60 144a40 40 0 0 1 80 0" fill="currentColor"/>
  <path d="M100 70V52M58 86L45 73M142 86L155 73M34 116H16M166 116H184"/></g>
</svg>`,
  app: `${open}
  <rect x="36" y="36" width="128" height="128" rx="32"/>
  <g class="dots" fill="currentColor" stroke="none"><circle cx="80" cy="80" r="11"/><circle cx="120" cy="80" r="11"/><circle cx="80" cy="120" r="11"/><circle class="accent" cx="120" cy="120" r="11"/></g>
</svg>`,
};
