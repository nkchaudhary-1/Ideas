import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { compareAnalyses } from "../lib/analysis/compare";
import type { Attempt } from "../lib/types";
import { fmtDateTime } from "../lib/time";

/** Previous attempt against the new one. Only rows with real data on both sides get a direction. */
export function Compare({ prev, next }: { prev: Attempt; next: Attempt }) {
  if (!prev.analysis || !next.analysis || !prev.analysis.scored || !next.analysis.scored)
    return <p className="text-sm text-mute">One of the two attempts is too short to compare. Speak for at least 20 seconds each time.</p>;
  const rows = compareAnalyses(prev.analysis, next.analysis, prev.durationSec, next.durationSec);
  const better = rows.filter((r) => r.verdict === "better").length;
  const worse = rows.filter((r) => r.verdict === "worse").length;
  return (
    <div data-testid="compare">
      <p className="text-base text-ink mb-4">{better > worse ? `${better} measures improved and ${worse} got worse.` : better === worse ? "Mixed: some measures improved, some did not." : `${worse} measures got worse and ${better} improved. One take is a small sample, so try again.`}</p>
      <div role="table" aria-label="Previous attempt compared with this one" className="text-sm">
        <div role="row" className="grid grid-cols-[1fr_5.5rem_5.5rem_1.5rem] gap-x-3 pb-2 text-xs text-mute">
          <span role="columnheader" />
          <span role="columnheader" className="text-right">Before<br />{fmtDateTime(prev.at).split(",")[0]}</span>
          <span role="columnheader" className="text-right">Now</span>
          <span role="columnheader" className="sr-only">Change</span>
        </div>
        {rows.map((r) => (
          <div role="row" key={r.label} className="grid grid-cols-[1fr_5.5rem_5.5rem_1.5rem] gap-x-3 items-center border-t border-line py-3">
            <span role="cell" className="text-ink">{r.label}</span>
            <span role="cell" className="text-right tnum text-mute">{r.prev}</span>
            <span role="cell" className="text-right tnum text-ink">{r.next}</span>
            <span role="cell" className="flex justify-end" aria-label={r.verdict ?? "no direction"}>
              {r.verdict === "better" && <ArrowUp size={16} className="text-accentfg" aria-hidden />}
              {r.verdict === "worse" && <ArrowDown size={16} className="text-rec" aria-hidden />}
              {r.verdict === "same" && <Minus size={16} className="text-mute" aria-hidden />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
