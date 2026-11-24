import { Dialog } from "../ui/Dialog";
import { Button, TextArea } from "../ui/controls";
import { ProgressBar } from "../ui/layout";
import { dayContent } from "../../content/curriculum";
import { extractPlaceholders } from "../../lib/script";
import { useStore } from "../../lib/store";

/** Fill the {{placeholders}} in a script with your own true details. Each one comes with coaching. */
export function ScriptCustomiser({ day, open, onClose }: { day: number; open: boolean; onClose: () => void }) {
  const content = dayContent(day);
  const fills = useStore((s) => s.data.fills[day]) ?? {};
  const setFill = useStore((s) => s.setFill);
  const clear = useStore((s) => s.clearFills);
  const list = extractPlaceholders(content.script ?? "");
  const filled = list.filter((p) => fills[p.key]?.trim()).length;
  return (
    <Dialog open={open} onClose={onClose} title="Make it yours" sheet wide>
      {list.length === 0 ? (
        <p className="text-base text-mute">This script has nothing to fill in. Change any line that doesn't sound like you as you practise.</p>
      ) : (
        <div>
          <p className="text-base text-mute">Add your own real details so the script becomes your answer. Short and specific beats long. If you don't have a number, describe what you saw. Anything left empty shows as a bracketed gap.</p>
          <div className="mt-4 flex items-center gap-4">
            <ProgressBar value={filled / list.length} className="flex-1" label="Placeholders filled" />
            <span className="text-sm tnum text-mute">{filled} of {list.length}</span>
          </div>
          <div className="mt-6 space-y-6">
            {list.map((p) => (
              <div key={p.key}>
                <label htmlFor={`ph-${p.key}`} className="block text-base text-ink">{p.label}</label>
                <p id={`hint-${p.key}`} className="mt-1 mb-2 text-sm text-mute">{p.hint}</p>
                <TextArea id={`ph-${p.key}`} aria-describedby={`hint-${p.key}`} rows={2} value={fills[p.key] ?? ""} onChange={(e) => setFill(day, p.key, e.target.value)} placeholder={p.label} />
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
            <Button variant="ghost" onClick={() => clear(day)} disabled={filled === 0}>
              Clear all
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
