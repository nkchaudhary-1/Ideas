"use client";
import { useEffect, useRef } from "react";
import { Film } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";
import { formatTime } from "@/lib/util";

export default function AssetPicker({ onPick, onClose }: { onPick: (a: Asset) => void; onClose: () => void }) {
  const assets = useStore((s) => s.assets);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    setTimeout(() => window.addEventListener("mousedown", f), 0);
    return () => window.removeEventListener("mousedown", f);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute left-0 top-8 z-40 max-h-64 w-[272px] overflow-y-auto rounded-in-20 border border-line bg-panel p-2 shadow-2xl" data-testid="asset-picker">
      {assets.length === 0 && <div className="p-3 text-center text-xs text-mute">No media yet. Upload photos or videos first.</div>}
      <div className="grid grid-cols-4 gap-2">
        {assets.filter((a) => a.status === "ready").map((a) => (
          <button key={a.id} type="button" title={a.name} onClick={() => onPick(a)} className="relative aspect-square overflow-hidden rounded ring-1 ring-line hover:ring-ink/25">
            <img src={a.thumb} alt={a.name} className="h-full w-full object-cover" draggable={false} />
            {a.kind === "video" && <span className="absolute bottom-0.5 left-0.5 flex items-center gap-0.5 rounded bg-black/70 px-1 text-2xs text-white"><Film size={9} />{formatTime(a.duration ?? 0)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
