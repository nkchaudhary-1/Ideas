"use client";
import { useStore } from "@/lib/store";
import { SHORTCUTS } from "@/components/editor/Shortcuts";
import Modal from "@/components/ui/Modal";

export default function ShortcutsDialog() {
  const set = useStore((s) => s.setUI);
  return (
    <Modal title="Keyboard shortcuts" onClose={() => set({ shortcutsOpen: false })} width={560} testId="shortcuts-dialog">
      <ul className="divide-y divide-line/60 px-8 pb-6">
        {SHORTCUTS.map((s) => (
          <li key={s.action} className="flex items-center justify-between gap-8 py-4 text-sm">
            <span className="text-ink/90">{s.action}</span>
            <kbd className="whitespace-nowrap rounded border border-line bg-panel2 px-2 py-0.5 font-mono text-xs text-mute">{s.keys}</kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
