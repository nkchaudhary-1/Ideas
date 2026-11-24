import { ArrowDown, ArrowUp, Minus, Trash2 } from "lucide-react";
import { Button, Badge } from "../components/ui/controls";
import { Card, Disclosure, EmptyState, PageHeader, Stat } from "../components/ui/layout";
import { LineChart } from "../components/charts/LineChart";
import { go } from "../lib/router";
import { useStore } from "../lib/store";
import { completedDays, metricSeries, scoreSeries, scoredAttempts, streak, totals, weekRows } from "../lib/stats";
import { PROGRAMME_DAYS, dayContent } from "../content/curriculum";
import { fmtDate } from "../lib/time";
import { REFLECTION_QUESTIONS, type AppData, type SessionRecord } from "../lib/types";

function hm(sec: number) {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
}

function sessionStats(d: AppData, s: SessionRecord) {
  const at = d.attempts.filter((a) => s.attemptIds.includes(a.id) && a.analysis?.scored && a.kind !== "read-aloud");
  const avg = (f: (a: (typeof at)[number]) => number | null) => {
    const v = at.map(f).filter((x): x is number => x !== null);
    return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
  };
  return {
    minutes: Math.max(1, Math.round(s.activeSec / 60)),
    answers: at.length,
    readiness: avg((a) => a.analysis!.scores.readiness.value),
    fillers: avg((a) => a.analysis!.metrics.fillerPer100),
    wpm: avg((a) => a.analysis!.metrics.wpm),
  };
}

/** `centre` means closer to that value is better (pace), otherwise higher or lower is better. */
function Trend({ a, b, higherBetter, centre }: { a: number | null; b: number | null; higherBetter: boolean; centre?: number }) {
  if (a === null || b === null || a === b) return <Minus size={16} className="text-mute" aria-label="no change" />;
  const better = centre !== undefined ? Math.abs(b - centre) < Math.abs(a - centre) : higherBetter ? b > a : b < a;
  return better ? <ArrowUp size={16} className="text-accentfg" aria-label="better" /> : <ArrowDown size={16} className="text-rec" aria-label="worse" />;
}

export function ProgressScreen() {
  const data = useStore((s) => s.data);
  const delReflection = useStore((s) => s.deleteReflection);
  const t = totals(data);
  const scored = scoredAttempts(data);
  const sessions = data.sessions.slice().sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  const latest = sessions[sessions.length - 1];
  const before = sessions[sessions.length - 2];
  const ls = latest ? sessionStats(data, latest) : null;
  const bs = before ? sessionStats(data, before) : null;
  const reflections = data.reflections.slice().sort((a, b) => b.at.localeCompare(a.at));

  if (data.sessions.length === 0 && data.attempts.length === 0)
    return (
      <div>
        <PageHeader title="Progress & analytics" intro="What you practise and how it changes, shown simply. Nothing here until you have real data." />
        <EmptyState title="Nothing to show yet" body="Finish your first practice session and your numbers and trends appear here." action={<Button variant="primary" onClick={() => go("/practice")}>Start practising</Button>} />
      </div>
    );

  return (
    <div>
      <PageHeader eyebrow="Learning, not scoring" title="Progress & analytics" intro="Progress is a learning tool here. Every number comes from your real sessions and answers, and a trend only shows once there is more than one point." />

      <section aria-label="Totals" className="grid grid-cols-2 gap-x-8 gap-y-8 border-t border-line pt-10 sm:grid-cols-3">
        <Stat label="Days completed" value={`${completedDays(data).size} of ${PROGRAMME_DAYS}`} />
        <Stat label="Sessions completed" value={t.sessions} />
        <Stat label="Total practice time" value={hm(t.totalSec)} />
        <Stat label="Practice streak" value={`${streak(data)} ${streak(data) === 1 ? "day" : "days"}`} />
        <Stat label="Average session" value={t.sessions ? `${Math.round(t.avgSec / 60)} min` : "n/a"} />
        <Stat label="Answers scored" value={scored.length} />
      </section>

      <section aria-labelledby="trends" className="mt-16">
        <h2 id="trends" className="mb-6 text-2xl font-semibold tracking-tight text-ink">Trends</h2>
        {scored.length < 2 && <p className="mb-6 max-w-xl text-base text-mute">A line needs at least two scored answers. A scored answer is one of about 15 words or more.</p>}
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          <LineChart title="Interview readiness" unit="/10" data={scoreSeries(data, "readiness")} domain={[0, 10]} note="Higher is better." />
          <LineChart title="Clarity" unit="/10" data={scoreSeries(data, "clarity")} domain={[0, 10]} note="Higher is better." />
          <LineChart title="Fluency" unit="/10" data={scoreSeries(data, "fluency")} domain={[0, 10]} note="Higher is better." />
          <LineChart title="Speaking pace" unit=" wpm" data={metricSeries(data, "wpm")} band={{ from: 115, to: 155, label: "Comfortable pace" }} note="Words per minute. Inside the shaded band is comfortable." />
          <LineChart title="Filler words per 100 words" data={metricSeries(data, "fillerPer100")} decimals={1} note="Lower is better." />
          <LineChart title="Structure" unit="/10" data={scoreSeries(data, "structure")} domain={[0, 10]} note="Higher is better." />
        </div>
      </section>

      <section aria-labelledby="weeks" className="mt-16">
        <h2 id="weeks" className="mb-6 text-2xl font-semibold tracking-tight text-ink">Week by week</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs text-mute">
                <th className="py-2 pr-4 font-normal">Week</th>
                <th className="py-2 pr-4 text-right font-normal">Days</th>
                <th className="py-2 pr-4 text-right font-normal">Minutes</th>
                <th className="py-2 pr-4 text-right font-normal">Readiness</th>
                <th className="py-2 pr-4 text-right font-normal">Fillers per 100</th>
                <th className="py-2 text-right font-normal">Pace (wpm)</th>
              </tr>
            </thead>
            <tbody>
              {weekRows(data).map((r) => (
                <tr key={r.week.id} className="border-t border-line">
                  <td className="py-3 pr-4 text-ink">{r.week.short}<span className="block text-xs text-mute">{r.week.name}</span></td>
                  <td className="py-3 pr-4 text-right tnum">{r.days} of {r.week.to - r.week.from + 1}</td>
                  <td className="py-3 pr-4 text-right tnum">{r.minutes}</td>
                  <td className="py-3 pr-4 text-right tnum">{r.readiness ?? "n/a"}</td>
                  <td className="py-3 pr-4 text-right tnum">{r.fillers ?? "n/a"}</td>
                  <td className="py-3 text-right tnum">{r.wpm ?? "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="prev" className="mt-16">
        <h2 id="prev" className="mb-6 text-2xl font-semibold tracking-tight text-ink">Previous session comparison</h2>
        {!ls || !bs ? (
          <p className="max-w-xl text-base text-mute">Complete two sessions to compare them.</p>
        ) : (
          <Card>
            <p className="text-sm text-mute">Day {before.day} on {fmtDate(before.completedAt)} compared with Day {latest.day} on {fmtDate(latest.completedAt)}.</p>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-mute">
                  <th className="py-2 font-normal" />
                  <th className="py-2 text-right font-normal">Before</th>
                  <th className="py-2 text-right font-normal">Latest</th>
                  <th className="w-8 py-2" />
                </tr>
              </thead>
              <tbody>
                {[
                  { l: "Interview readiness", a: bs.readiness, b: ls.readiness, hb: true, u: "" },
                  { l: "Filler words per 100", a: bs.fillers, b: ls.fillers, hb: false, u: "" },
                  { l: "Speaking pace", a: bs.wpm, b: ls.wpm, hb: true, u: " wpm", c: 135 },
                  { l: "Practice time", a: bs.minutes, b: ls.minutes, hb: true, u: " min" },
                  { l: "Answers scored", a: bs.answers, b: ls.answers, hb: true, u: "" },
                ].map((r) => (
                  <tr key={r.l} className="border-t border-line">
                    <td className="py-3 text-ink">{r.l}</td>
                    <td className="py-3 text-right tnum text-mute">{r.a === null ? "n/a" : `${r.a}${r.u}`}</td>
                    <td className="py-3 text-right tnum text-ink">{r.b === null ? "n/a" : `${r.b}${r.u}`}</td>
                    <td className="py-3 pl-2"><Trend a={r.a} b={r.b} higherBetter={r.hb} centre={"c" in r ? r.c : undefined} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-mute">Different days ask different questions, so a single comparison is only a hint. Pace counts as better when it moves closer to a comfortable 135 words per minute.</p>
          </Card>
        )}
      </section>

      <section aria-labelledby="journal" className="mt-16">
        <h2 id="journal" className="mb-6 text-2xl font-semibold tracking-tight text-ink">Reflection journal</h2>
        {reflections.length === 0 ? (
          <p className="max-w-xl text-base text-mute">After each session you answer four short questions. They are saved here, on this device.</p>
        ) : (
          <div className="border-b border-line">
            {reflections.map((r) => (
              <Disclosure key={r.id} title={`Day ${r.day} · ${dayContent(r.day).topic}`} meta={<span>{fmtDate(r.at)}</span>}>
                <dl className="space-y-4">
                  {REFLECTION_QUESTIONS.map((q, i) => (
                    <div key={q}>
                      <dt className="text-sm text-mute">{q}</dt>
                      <dd className="mt-1 whitespace-pre-line text-base text-ink select-text">{r.answers[i]?.trim() || <span className="text-mute">No answer</span>}</dd>
                    </div>
                  ))}
                </dl>
                <Button variant="ghost" className="mt-4" icon={<Trash2 size={16} />} onClick={() => delReflection(r.id)}>Delete this reflection</Button>
              </Disclosure>
            ))}
          </div>
        )}
        {reflections.length > 0 && <Badge className="mt-4">{reflections.length} saved</Badge>}
      </section>
    </div>
  );
}
