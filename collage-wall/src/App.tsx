import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { artworkById, collections, layout, rows } from "./data";
import { buildWorld } from "./lib/layout";
import { Wall, type WallHandle } from "./components/Wall";
import { Viewer } from "./components/Viewer";

const idFromHash = () => {
  const m = /^#(artwork-\d+)$/.exec(window.location.hash);
  return m ? m[1] : null;
};

/** Reflect the open artwork in the URL hash. Sandboxed frames may refuse; the viewer still works without it. */
const setHash = (id: string | null, mode: "push" | "replace"): boolean => {
  try {
    if (id && mode === "push") window.location.hash = id;
    else if (id) window.location.replace(`#${id}`);
    else window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return !id || window.location.hash === `#${id}`;
  } catch {
    return false;
  }
};

export function App() {
  const world = useMemo(() => buildWorld(artworkById, rows, collections, layout), []);
  const wallRef = useRef<WallHandle>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(() => {
    const id = idFromHash();
    return id ? world.items.findIndex((i) => i.art.id === id) : null;
  });
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const pushed = useRef(false);
  const lastFocus = useRef<HTMLElement | null>(null);

  const open = useCallback(
    (index: number, rect: DOMRect) => {
      lastFocus.current = document.activeElement as HTMLElement | null;
      setOrigin(rect);
      setOpenIndex(index);
      pushed.current = setHash(world.items[index].art.id, "push");
    },
    [world],
  );

  const close = useCallback(() => {
    setOpenIndex(null);
    if (pushed.current) {
      pushed.current = false;
      try {
        window.history.back();
      } catch {
        setHash(null, "replace");
      }
    } else if (window.location.hash) {
      setHash(null, "replace");
    }
  }, []);

  const step = useCallback(
    (d: number) => {
      setOpenIndex((i) => {
        if (i === null) return i;
        const n = Math.min(world.items.length - 1, Math.max(0, i + d));
        if (n !== i) setHash(world.items[n].art.id, "replace");
        return n;
      });
    },
    [world],
  );

  // browser back / forward and manual hash edits
  useEffect(() => {
    const onPop = () => {
      const id = idFromHash();
      if (!id) {
        pushed.current = false;
        setOpenIndex(null);
        return;
      }
      const i = world.items.findIndex((it) => it.art.id === id);
      if (i >= 0) setOpenIndex(i);
    };
    window.addEventListener("hashchange", onPop);
    return () => window.removeEventListener("hashchange", onPop);
  }, [world]);

  // keep the wall behind the viewer centred on whatever is open
  useEffect(() => {
    if (openIndex !== null) wallRef.current?.jumpToItem(openIndex);
  }, [openIndex]);

  // restore focus to the tile that opened the viewer
  useEffect(() => {
    if (openIndex === null) lastFocus.current?.focus?.({ preventScroll: true });
  }, [openIndex]);

  useEffect(() => {
    document.title =
      openIndex !== null ? `${world.items[openIndex].art.label || "Untitled"} — Collage Wall` : "Collage Wall — a visual archive";
  }, [openIndex, world]);

  return (
    <>
      <Wall ref={wallRef} world={world} viewerOpen={openIndex !== null} onOpen={open} />
      {openIndex !== null && (
        <Viewer items={world.items} index={openIndex} originRect={origin} onClose={close} onStep={step} />
      )}
    </>
  );
}
