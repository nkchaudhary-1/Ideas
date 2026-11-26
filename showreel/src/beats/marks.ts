import { h } from '../core/dom';

/**
 * Four viewfinder corners that frame the safe area. The hook and the end card both use them,
 * which is most of why the end of the reel rhymes with its start.
 */
export function createMarks(): HTMLElement {
  return h('div', 'marks', ['tl', 'tr', 'bl', 'br'].map((corner) => h('i', `mk mk--${corner}`)), { 'aria-hidden': 'true' });
}
