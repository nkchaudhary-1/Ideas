import type { BeatKind, ResolvedBeat } from '../types';
import type { BeatContext } from './context';
import { buildBuilder } from './builder';
import { buildClose } from './close';
import { buildCompanies } from './companies';
import { buildCraft } from './craft';
import { buildCuriosity } from './curiosity';
import { buildEndCard } from './endcard';
import { buildHook } from './hook';
import { buildNumbers } from './numbers';

type Builders = { [K in BeatKind]: (ctx: BeatContext<Extract<ResolvedBeat, { kind: K }>>) => void };

/** One builder per beat kind. A builder fills the beat's DOM and timeline from its config. */
export const buildBeats: Builders = {
  hook: buildHook,
  companies: buildCompanies,
  numbers: buildNumbers,
  curiosity: buildCuriosity,
  builder: buildBuilder,
  craft: buildCraft,
  close: buildClose,
  endcard: buildEndCard,
};
