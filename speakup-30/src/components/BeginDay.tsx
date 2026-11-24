import { useState } from "react";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/controls";
import { go } from "../lib/router";
import { useStore } from "../lib/store";
import { dayContent } from "../content/curriculum";

/** Start a day's practice. If another day is in progress, ask before replacing it. */
export function useBeginDay() {
  const active = useStore((s) => s.data.active);
  const start = useStore((s) => s.startSession);
  const abandon = useStore((s) => s.abandonSession);
  const [pending, setPending] = useState<number | null>(null);

  const launch = (day: number) => {
    start(day);
    go(`/practice/${day}/run`);
  };
  const begin = (day: number) => {
    if (active && active.day !== day) setPending(day);
    else launch(day);
  };
  const node = (
    <Dialog open={pending !== null} onClose={() => setPending(null)} title="Replace the session in progress?">
      <p className="text-base text-mute">
        Day {active?.day}{active ? ` (${dayContent(active.day).topic})` : ""} is still in progress. Starting Day {pending} ends it without saving it as complete.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button
          variant="primary"
          onClick={() => {
            const d = pending!;
            setPending(null);
            abandon();
            launch(d);
          }}
        >
          Start Day {pending}
        </Button>
        <Button
          onClick={() => {
            const d = active!.day;
            setPending(null);
            go(`/practice/${d}/run`);
            start(d);
          }}
        >
          Continue Day {active?.day}
        </Button>
      </div>
    </Dialog>
  );
  return { begin, node };
}
