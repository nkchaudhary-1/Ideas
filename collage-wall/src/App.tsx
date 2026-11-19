import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { artworkById, collections, layout, rows } from "./data";
import { buildWorld } from "./lib/layout";
import { Wall, type WallHandle } from "./components/Wall";
import { Viewer } from "./components/Viewer";

const idFromHash = () => {
  const m = /^#\/(artwork-\d+)$/.exec(window.location.hash);
  return m ? m[1] : null;
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
      pushed.current = true;
      window.history.pushState(null, "", `#/${world.items[index].art.id}`);
    },
    [world],
  );

  const close = useCallback(() => {
    setOpenIndex(null);
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const step = useCallback(
    (d: number) => {
      setOpenIndex((i) => {
        if (i === null) return i;
        const n = Math.min(world.items.length - 1, Math.max(0, i + d));
        if (n !== i) window.history.replaceState(null, "", `#/${world.items[n].art.id}`);
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
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
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
