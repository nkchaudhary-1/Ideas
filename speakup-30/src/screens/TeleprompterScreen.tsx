import { PageHeader, EmptyState } from "../components/ui/layout";
import { Select, Button } from "../components/ui/controls";
import { Prompter } from "../components/prompter/Prompter";
import { go } from "../lib/router";
import { useStore } from "../lib/store";
import { currentDay } from "../lib/stats";
import { CURRICULUM, dayContent, levelFor } from "../content/curriculum";

export function TeleprompterScreen({ dayParam }: { dayParam?: string }) {
  const data = useStore((s) => s.data);
  const parsed = dayParam ? parseInt(dayParam, 10) : NaN;
  const day = Number.isFinite(parsed) && parsed >= 1 && parsed <= 30 ? parsed : Math.min(currentDay(data), 28);
  const c = dayContent(day);
  return (
    <div>
      <PageHeader
        compact
        eyebrow={`Day ${day} · ${levelFor(day).label}`}
        title="Teleprompter"
        actions={
          <div className="w-72 max-w-full">
            <Select aria-label="Choose a day's script" value={day} onChange={(e) => go(`/teleprompter/${e.target.value}`)}>
              {CURRICULUM.map((d) => (
                <option key={d.day} value={d.day}>
                  Day {d.day}{d.script ? ` · ${d.topic.slice(0, 32)}${d.topic.length > 32 ? "…" : ""}` : " · no script"}
                </option>
              ))}
            </Select>
          </div>
        }
      />
      {c.script ? (
        <Prompter key={day} day={day} heightClass="h-[calc(100dvh-17rem)] lg:h-[calc(100dvh-14rem)] min-h-[26rem]" />
      ) : (
        <EmptyState
          title={`Day ${day} has no script`}
          body="The final two days are spoken without reading, like a real interview. Choose an earlier day to use the teleprompter, or go to the day's practice."
          action={<Button variant="primary" onClick={() => go(`/practice/${day}`)}>Open Day {day}</Button>}
        />
      )}
    </div>
  );
}
