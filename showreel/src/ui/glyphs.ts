/** Icons for the player controls, drawn on a 24 x 24 grid. Each button also carries an `aria-label`. */
const icon = (body: string) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const GLYPHS = {
  play: icon('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>'),
  pause: icon('<path d="M8 5v14M16 5v14" stroke-width="3"/>'),
  restart: icon('<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.5h4.5"/>'),
  subtitles: icon('<rect x="3" y="5" width="18" height="14" rx="4"/><path d="M7 11h3M13 11h4M7 15h5M15 15h2"/>'),
  sound: icon('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  muted: icon('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
};
