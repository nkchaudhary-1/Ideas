import { h } from './dom';

export interface MarkupWord {
  text: string;
  dim: boolean;
}

/**
 * Reads caption markup into lines of words: `_text_` marks words dim, `\n` forces a new line.
 * Pure, so it is unit-tested without a DOM.
 */
export function parseMarkup(text: string): MarkupWord[][] {
  const lines: MarkupWord[][] = [[]];
  let dim = false;
  let buffer = '';
  const flush = () => {
    if (buffer) lines[lines.length - 1]!.push({ text: buffer, dim });
    buffer = '';
  };
  for (const ch of text) {
    if (ch === '_') {
      flush();
      dim = !dim;
    } else if (ch === '\n') {
      flush();
      lines.push([]);
    } else if (/\s/.test(ch)) {
      flush();
    } else {
      buffer += ch;
    }
  }
  flush();
  return lines.filter((line) => line.length > 0);
}

export interface Split {
  /** One element per visual line. Animate these to move a whole line. */
  lines: HTMLElement[];
  words: HTMLElement[];
  /** Only filled when `chars` is on. */
  chars: HTMLElement[];
}

/**
 * A tiny SplitText: fills `host` with words (and optionally characters), measures where the
 * browser actually wrapped them, then rebuilds the host as one masked line per visual line.
 * The host must already be in the document, laid out, with its font loaded.
 * Lines are masks (`overflow: hidden`), so words that start below them rise into view.
 * Pass `mask: false` when nothing will rise through the lines (hero words animated per character).
 */
export function splitText(host: HTMLElement, text: string, options: { chars?: boolean; mask?: boolean } = {}): Split {
  const parsed = parseMarkup(text.replace(/'/g, '’'));
  const words: HTMLElement[] = [];
  const chars: HTMLElement[] = [];

  // Pass 1: lay the words out naturally so we can read the line breaks.
  host.textContent = '';
  parsed.forEach((line, i) => {
    for (const word of line) {
      const el = h('span', word.dim ? 'w dim' : 'w');
      if (options.chars) {
        for (const ch of word.text) {
          const c = h('span', 'c', [ch]);
          chars.push(c);
          el.append(c);
        }
      } else {
        el.textContent = word.text;
      }
      words.push(el);
      host.append(el, ' ');
    }
    if (i < parsed.length - 1) host.append(document.createElement('br'));
  });

  // Pass 2: group by vertical position, then rebuild as masked lines.
  const groups: HTMLElement[][] = [];
  let lastTop = Number.NaN;
  for (const word of words) {
    const top = word.offsetTop;
    if (!(Math.abs(top - lastTop) < 2)) groups.push([]);
    groups[groups.length - 1]!.push(word);
    lastTop = top;
  }

  host.textContent = '';
  const lines = groups.map((group) => {
    const inner = h('span', 'li');
    group.forEach((word, i) => {
      if (i > 0) inner.append(' ');
      inner.append(word);
    });
    host.append(h('span', options.mask === false ? 'l l--open' : 'l', [inner]));
    return inner;
  });

  if (import.meta.env.DEV) warnIfClipped(host, text);
  return { lines, words, chars };
}

/** Lines are masks, so a line wider than its box is silently cut off. Say so while developing. */
function warnIfClipped(host: HTMLElement, text: string): void {
  for (const mask of host.querySelectorAll<HTMLElement>('.l:not(.l--open)')) {
    if (mask.scrollWidth > mask.clientWidth + 2) {
      console.warn(`Caption is wider than its column and will be clipped: "${text.replace(/\n/g, ' ')}". Shorten it, add a line break or lower its font size.`);
      return;
    }
  }
}
