import { CUES, type CueId } from "../../lib/script";
import { cx } from "../ui/controls";

const tone = {
  pause: "bg-accent/15 text-accentfg",
  emphasis: "bg-blue/15 text-blue",
  other: "bg-panel2 text-mute border border-line",
};

/** A speaking cue. Visually unlike the script (small, upper case, a pill) so it is never read aloud by mistake. */
export function CueChip({ cue, left }: { cue: CueId; left?: number | null }) {
  const c = CUES[cue];
  return (
    <span
      role="note"
      aria-label={`Cue, do not read aloud: ${c.label}. ${c.hint}`}
      title={c.hint}
      className={cx("mx-1 inline-flex h-6 items-center rounded-full px-3 align-middle text-xs font-medium uppercase tracking-wider whitespace-nowrap select-none", tone[c.group])}
      style={{ fontSize: 12, lineHeight: "16px", letterSpacing: "0.06em", fontStyle: "normal", fontWeight: 500 }}
    >
      {c.label}
      {left != null && left > 0 && <span className="ml-2 tnum">{left.toFixed(1)}s</span>}
    </span>
  );
}

/** Advanced mode: a pause is just a dot. */
export function CueDot({ cue }: { cue: CueId }) {
  return <span role="note" aria-label={`Cue, do not read aloud: ${CUES[cue].label}`} title={CUES[cue].label} className="mx-2 inline-block h-2 w-2 rounded-full bg-accentfg/70 align-middle" />;
}
