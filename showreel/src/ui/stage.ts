import type { WorldName } from '../types';
import type { ReelOptions } from '../params';
import { h } from '../core/dom';

export interface StageRefs {
  app: HTMLElement;
  stage: HTMLElement;
  /** Beats are appended here. */
  frame: HTMLElement;
  worlds: Record<WorldName, HTMLElement>;
  /** Black layer that darkens the grade. */
  shade: HTMLElement;
  bloom: { warm: HTMLElement; cool: HTMLElement };
  flash: HTMLElement;
}

/**
 * Builds the stage: three world layers, a shade, two heat blooms, the frame the beats live in,
 * then vignette, grain and the cut flash on top. Layer order is set in stage.css.
 */
export function createStage(root: HTMLElement, options: ReelOptions, description: string): StageRefs {
  root.textContent = '';
  const worlds: Record<WorldName, HTMLElement> = {
    cool: h('div', 'world world--cool'),
    warm: h('div', 'world world--warm'),
    neutral: h('div', 'world world--neutral'),
  };
  const shade = h('div', 'shade');
  const bloom = { cool: h('div', 'bloom bloom--cool'), warm: h('div', 'bloom bloom--warm') };
  const frame = h('div', 'frame');
  const flash = h('div', 'flash');

  // The stage is a picture: one description for assistive tech, everything inside hidden from it.
  const stage = h(
    'div',
    'stage',
    [worlds.cool, worlds.warm, worlds.neutral, shade, bloom.cool, bloom.warm, frame, h('div', 'vignette'), h('div', 'grain'), flash],
    { 'data-aspect': options.aspect, 'data-motion': options.motion, role: 'img', 'aria-label': description },
  );
  for (const child of Array.from(stage.children)) child.setAttribute('aria-hidden', 'true');
  stage.style.setProperty('--stage-radius', `${options.radius}px`);

  const app = h('div', 'app', [stage], { 'data-mode': options.mode, 'data-aspect': options.aspect });
  root.append(app);
  return { app, stage, frame, worlds, shade, bloom, flash };
}
