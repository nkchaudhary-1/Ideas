import { useEffect, useRef, useState } from "react";
import { fmtDate } from "../../lib/time";

export interface Pt {
  at: string;
  day: number;
  v: number;
}
interface Props {
  title: string;
  unit?: string;
  data: Pt[];
  /** Fixed y range. Defaults to the data with some room. */
  domain?: [number, number];
  /** A band of "good" values, drawn behind the line. */
  band?: { from: number; to: number; label: string };
  decimals?: number;
  /** Which way is better, said in words, for people who cannot see the colour. */
  note?: string;
}

const H = 168;
const PAD = { l: 36, r: 12, t: 12, b: 28 };

/** A single-series line chart: 2px line, 8px markers, a quiet grid, a hover readout and a table view. */
export function LineChart({ title, unit = "", data, domain, band, decimals = 0, note }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.floor(e.contentRect.width))));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  const vals = data.map((d) => d.v);
  const lo = domain ? domain[0] : Math.max(0, Math.floor(Math.min(...vals, band?.from ?? Infinity) - 1));
  const hi = domain ? domain[1] : Math.ceil(Math.max(...vals, band?.to ?? -Infinity) + 1);
  const iw = w - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const ticks = [lo, (lo + hi) / 2, hi];
  const fmt = (v: number) => v.toFixed(decimals);
  const last = data[data.length - 1];

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    let bd = Infinity;
    data.forEach((_, i) => {
      const d = Math.abs(x(i) - px);
      if (d < bd) (bd = d), (best = i);
    });
    setHover(best);
  };

  return (
    <figure className="m-0">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="text-base text-ink">{title}</span>
        {last && <span className="text-sm tnum text-mute">Latest {fmt(last.v)}{unit}</span>}
      </figcaption>
      <div ref={box} className="relative mt-3">
        {data.length === 0 ? (
          <p className="flex h-32 items-center rounded bg-panel2 px-4 text-sm text-mute">No scored answers yet.</p>
        ) : (
          <>
            <svg
              width={w}
              height={H}
              role="img"
              aria-label={`${title}: ${data.length} ${data.length === 1 ? "answer" : "answers"}, latest ${fmt(last.v)}${unit}${note ? `. ${note}` : ""}`}
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
              className="touch-pan-y"
            >
              {band && <rect x={PAD.l} width={iw} y={y(band.to)} height={Math.max(0, y(band.from) - y(band.to))} fill="rgb(var(--c-accentfg))" opacity={0.1} />}
              {band && (
                <text x={PAD.l + iw - 4} y={y(band.to) + 14} textAnchor="end" fontSize={11} fill="rgb(var(--c-mute))">
                  {band.label}
                </text>
              )}
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={PAD.l} x2={PAD.l + iw} y1={y(t)} y2={y(t)} stroke="rgb(var(--c-line))" strokeWidth={1} />
                  <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="rgb(var(--c-mute))" className="tnum">
                    {fmt(t)}
                  </text>
                </g>
              ))}
              <text x={PAD.l} y={H - 8} fontSize={11} fill="rgb(var(--c-mute))">{fmtDate(data[0].at)}</text>
              {data.length > 1 && (
                <text x={PAD.l + iw} y={H - 8} textAnchor="end" fontSize={11} fill="rgb(var(--c-mute))">{fmtDate(last.at)}</text>
              )}
              {data.length > 1 && <polyline points={data.map((d, i) => `${x(i)},${y(d.v)}`).join(" ")} fill="none" stroke="rgb(var(--c-accentfg))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
              {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} stroke="rgb(var(--c-mute))" strokeWidth={1} strokeDasharray="3 3" />}
              {data.map((d, i) => (
                <circle key={i} cx={x(i)} cy={y(d.v)} r={hover === i ? 6 : 4} fill="rgb(var(--c-accentfg))" stroke="rgb(var(--c-panel))" strokeWidth={2} />
              ))}
            </svg>
            {hover !== null && (
              <div className="pointer-events-none absolute top-0 z-10 rounded bg-ink px-3 py-2 text-xs text-bg shadow-pop whitespace-nowrap" style={{ left: Math.min(Math.max(x(hover) - 50, 0), w - 120), top: -4 }}>
                <span className="tnum font-medium">{fmt(data[hover].v)}{unit}</span> · Day {data[hover].day} · {fmtDate(data[hover].at)}
              </div>
            )}
          </>
        )}
      </div>
      {data.length > 0 && (
        <details className="mt-2 text-sm text-mute">
          <summary className="inline-flex min-h-8 cursor-pointer items-center">View as a table</summary>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-xs text-mute">
                <th className="py-1 font-normal">Date</th>
                <th className="py-1 font-normal">Day</th>
                <th className="py-1 text-right font-normal">{title}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="py-1">{fmtDate(d.at)}</td>
                  <td className="py-1 tnum">{d.day}</td>
                  <td className="py-1 text-right tnum text-ink">{fmt(d.v)}{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </figure>
  );
}
